import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import SearchBar from "../../components/ui/SearchBar";
import UserAvatar from "../../components/ui/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { resourcesApi } from "../../api/resourcesApi";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { DEMO_TIPS, type Tip } from "./tipsLibrary";
import HealingHabitsCard from "../habits/HealingHabitsCard";

// Quick, universal advice shown on top — things anyone can do today.
const basicAdvice = [
  { id: "b1", glyph: "💧", text: "Sip water through the day — dehydration amplifies fatigue and brain fog." },
  { id: "b2", glyph: "😴", text: "Keep a fixed sleep window; consistency beats duration." },
  { id: "b3", glyph: "🚶", text: "A 10-minute gentle walk counts. Movement is medicine, dosage matters." },
  { id: "b4", glyph: "🧘", text: "60 seconds of slow breathing lowers your stress response measurably." },
  { id: "b5", glyph: "🥗", text: "Add one vegetable to a meal today — small swaps stick." },
];

const typeGlyph: Record<string, string> = {
  Article: "📄",
  Video: "🎥",
  "Photo Guide": "🖼️",
};

const initialsOf = (name: string) =>
  name
    .replace("Dr. ", "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Deterministic per-day pick, so everyone sees the same "tip of the day". */
const dailyPick = (tips: Tip[]) => {
  if (tips.length === 0) return null;
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000,
  );
  return tips[dayOfYear % tips.length];
};

/**
 * Health Tips v3 (mirrored on the web /tips page): every card opens its own
 * screen (TipDetails) with the full article + questions, and tips matching
 * your conditions lead the screen — "For your journey" first.
 */
export default function HealthTipsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const styles = makeStyles(colors);

  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState<string | null>(null);

  // Live doctor-published tips when signed in; the demo library when signed out.
  const { data: allTips } = useLiveOrDemo<Tip[]>(
    async () => resourcesApi.getHealthTips(),
    DEMO_TIPS,
  );

  const openTip = (t: Tip) => navigation.navigate("TipDetails", { id: t.id, tip: t });

  const conditionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of allTips) counts.set(t.condition, (counts.get(t.condition) ?? 0) + 1);
    return counts;
  }, [allTips]);

  // Case-insensitive overlap between a tip's condition and the user's saved ones.
  const myConditions = (user?.conditions ?? []).map((c: string) => c.toLowerCase());
  const matchesJourney = (tip: Tip) =>
    myConditions.some(
      (c: string) =>
        tip.condition.toLowerCase().includes(c) || c.includes(tip.condition.toLowerCase()),
    );

  const { journeyTips, otherTips } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allTips.filter(
      (t) =>
        (!condition || t.condition === condition) &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.condition.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q)),
    );
    // Your conditions lead the screen; everything else follows.
    return {
      journeyTips: filtered.filter(matchesJourney),
      otherTips: filtered.filter((t) => !matchesJourney(t)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, condition, allTips, user?.conditions]);

  // The hero prefers a tip about YOUR conditions when any exist.
  const featured = dailyPick(allTips.filter(matchesJourney)) ?? dailyPick(allTips);

  const cardTints = [colors.lightPurple, colors.lightBlue, colors.lightGreen, colors.lightOrange];

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Health Tips</Text>
          <Text style={styles.sub}>Quick, doctor-reviewed guidance for your condition</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        {/* Gamification: today's checklist + Healing Points + the circle's progress */}
        <HealingHabitsCard />

        {/* Tip of the day — the shelf's front cover */}
        {featured ? (
          <Pressable onPress={() => openTip(featured)}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroGlowTop} />
              <View style={styles.heroGlowBottom} />
              <Text style={styles.heroKicker}>
                ✨ TIP OF THE DAY{matchesJourney(featured) ? " · FOR YOUR JOURNEY" : ""}
              </Text>
              <Text style={styles.heroTitle}>{featured.title}</Text>
              <Text style={styles.heroSummary}>{featured.summary}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>
                    {typeGlyph[featured.type]} {featured.type}
                  </Text>
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>{featured.condition}</Text>
                </View>
                <Text style={styles.heroAuthor} numberOfLines={1}>
                  {featured.author} · {featured.duration} · Read →
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        ) : null}

        {/* Quick wins — always doable today */}
        <Text style={styles.sectionTitle}>Quick wins</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adviceRow}>
          {basicAdvice.map((a, i) => (
            <View key={a.id} style={[styles.adviceCard, { backgroundColor: cardTints[i % cardTints.length] }]}>
              <Text style={styles.adviceGlyph}>{a.glyph}</Text>
              <Text style={styles.adviceText}>{a.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.searchWrap}>
          <SearchBar placeholder="Search tips — condition, topic, author..." value={query} onChangeText={setQuery} />
        </View>

        {/* Condition filter with counts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Pressable onPress={() => setCondition(null)} style={[styles.chip, !condition && styles.chipActive]}>
            <Text style={[styles.chipText, !condition && styles.chipTextActive]}>All · {allTips.length}</Text>
          </Pressable>
          {[...conditionCounts.entries()].map(([c, count]) => {
            const active = condition === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCondition(active ? null : c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c} · {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* The shelf — your conditions lead, everything else follows */}
        {journeyTips.length === 0 && otherTips.length === 0 ? (
          <Text style={styles.emptyText}>
            {query.trim() || condition ? "No tips match your search." : "No tips published yet."}
          </Text>
        ) : null}
        {journeyTips.length > 0 ? (
          <Text style={styles.sectionTitle}>For your journey</Text>
        ) : null}
        {journeyTips.map((t) => (
          <TipCardRow key={t.id} tip={t} journey onPress={() => openTip(t)} styles={styles} />
        ))}
        {journeyTips.length > 0 && otherTips.length > 0 ? (
          <Text style={styles.sectionTitle}>More tips</Text>
        ) : null}
        {otherTips.map((t) => (
          <TipCardRow key={t.id} tip={t} journey={false} onPress={() => openTip(t)} styles={styles} />
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

/** One tip on the shelf — tap opens its own screen (full article + questions). */
function TipCardRow({
  tip,
  journey,
  onPress,
  styles,
}: {
  tip: Tip;
  journey: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable style={styles.postCard} onPress={onPress}>
      <View style={styles.postTopRow}>
        <View style={styles.typeTile}>
          <Text style={styles.typeTileGlyph}>{typeGlyph[tip.type]}</Text>
        </View>
        <View style={styles.postTopText}>
          <Text style={styles.typeName}>{tip.type}</Text>
          <Text style={styles.duration}>{tip.duration}</Text>
        </View>
        {journey ? (
          <View style={styles.journeyPill}>
            <Text style={styles.journeyPillText}>For your journey</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.postTitle}>{tip.title}</Text>
      <Text style={styles.postSummary}>{tip.summary}</Text>

      <View style={styles.postBottomRow}>
        <UserAvatar initials={initialsOf(tip.author)} size={26} />
        <Text style={styles.author}>{tip.author}</Text>
        <View style={styles.conditionPill}>
          <Text style={styles.conditionPillText}>{tip.condition}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(14),
    },
    headerTextWrap: {
      flex: 1,
    },
    title: {
      fontSize: TextStyles.heading,
      fontWeight: "600",
      color: colors.text,
    },
    sub: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },
    scrollContent: {
      paddingBottom: moderateVerticalScale(32),
    },
    sectionTitle: {
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
      marginTop: moderateVerticalScale(16),
      marginBottom: moderateVerticalScale(10),
    },

    // Tip of the day hero
    hero: {
      borderRadius: radius.lg,
      padding: moderateScale(16),
      overflow: "hidden",
    },
    heroGlowTop: {
      position: "absolute",
      top: -moderateScale(40),
      right: -moderateScale(40),
      width: moderateScale(140),
      height: moderateScale(140),
      borderRadius: moderateScale(70),
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    heroGlowBottom: {
      position: "absolute",
      bottom: -moderateScale(50),
      left: -moderateScale(20),
      width: moderateScale(120),
      height: moderateScale(120),
      borderRadius: moderateScale(60),
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    heroKicker: {
      color: "rgba(255,255,255,0.9)",
      fontSize: scale(10),
      fontWeight: "800",
      letterSpacing: 1,
    },
    heroTitle: {
      color: "#FFFFFF",
      fontSize: TextStyles.subtitle,
      fontWeight: "700",
      marginTop: moderateVerticalScale(6),
      lineHeight: scale(22),
    },
    heroSummary: {
      color: "rgba(255,255,255,0.9)",
      fontSize: TextStyles.caption,
      lineHeight: scale(17),
      marginTop: moderateVerticalScale(4),
    },
    heroMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: moderateScale(6),
      marginTop: moderateVerticalScale(10),
    },
    heroPill: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(9),
      paddingVertical: moderateVerticalScale(3),
    },
    heroPillText: {
      color: "#FFFFFF",
      fontSize: scale(10),
      fontWeight: "700",
    },
    heroAuthor: {
      flex: 1,
      color: "rgba(255,255,255,0.9)",
      fontSize: scale(10),
      fontWeight: "600",
    },

    // Basic advice cards
    adviceRow: {
      gap: moderateScale(10),
      paddingRight: moderateScale(4),
    },
    adviceCard: {
      width: moderateScale(180),
      borderRadius: radius.md,
      padding: moderateScale(12),
    },
    adviceGlyph: {
      fontSize: scale(20),
      marginBottom: moderateVerticalScale(6),
    },
    adviceText: {
      fontSize: TextStyles.caption,
      color: colors.text,
      lineHeight: scale(17),
    },

    searchWrap: {
      marginTop: moderateVerticalScale(14),
      marginBottom: moderateVerticalScale(10),
    },

    // Condition chips
    chipRow: {
      gap: moderateScale(8),
      paddingRight: moderateScale(4),
    },
    chip: {
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateVerticalScale(7),
      borderRadius: radius.pill,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.mutedText,
      fontWeight: "600",
      fontSize: TextStyles.caption,
    },
    chipTextActive: {
      color: colors.white,
    },

    // Doctor posts
    postCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(14),
      marginTop: moderateVerticalScale(12),
    },
    postTopRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: moderateVerticalScale(10),
    },
    typeTile: {
      width: moderateScale(34),
      height: moderateScale(34),
      borderRadius: radius.sm,
      backgroundColor: colors.lightPurple,
      alignItems: "center",
      justifyContent: "center",
      marginRight: moderateScale(9),
    },
    typeTileGlyph: {
      fontSize: scale(15),
    },
    postTopText: {
      flex: 1,
    },
    typeName: {
      fontSize: scale(11),
      color: colors.primary,
      fontWeight: "700",
    },
    duration: {
      fontSize: scale(10),
      color: colors.mutedText,
      marginTop: 1,
    },
    journeyPill: {
      backgroundColor: colors.lightGreen,
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(9),
      paddingVertical: moderateVerticalScale(3),
    },
    journeyPillText: {
      fontSize: scale(9),
      color: colors.success,
      fontWeight: "800",
    },
    postTitle: {
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
    },
    postSummary: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      lineHeight: scale(18),
      marginTop: moderateVerticalScale(4),
    },
    postBottomRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: moderateVerticalScale(10),
    },
    author: {
      flex: 1,
      fontSize: TextStyles.caption,
      color: colors.text,
      fontWeight: "500",
    },
    conditionPill: {
      backgroundColor: colors.lightPurple,
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateVerticalScale(3),
    },
    conditionPillText: {
      fontSize: scale(11),
      color: colors.primary,
      fontWeight: "600",
    },
    emptyText: {
      textAlign: "center",
      color: colors.mutedText,
      fontSize: TextStyles.body,
      marginTop: moderateVerticalScale(30),
    },
  });
