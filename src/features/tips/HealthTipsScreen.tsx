import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import SearchBar from "../../components/ui/SearchBar";
import UserAvatar from "../../components/ui/UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { resourcesApi } from "../../api/resourcesApi";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";

// ---- Dummy content (until doctors can publish from the backend) ----

// Quick, universal advice shown on top — things anyone can do today.
const basicAdvice = [
  { id: "b1", glyph: "💧", text: "Sip water through the day — dehydration amplifies fatigue and brain fog." },
  { id: "b2", glyph: "😴", text: "Keep a fixed sleep window; consistency beats duration." },
  { id: "b3", glyph: "🚶", text: "A 10-minute gentle walk counts. Movement is medicine, dosage matters." },
  { id: "b4", glyph: "🧘", text: "60 seconds of slow breathing lowers your stress response measurably." },
  { id: "b5", glyph: "🥗", text: "Add one vegetable to a meal today — small swaps stick." },
];

const conditions = ["All", "Fibromyalgia", "Diabetes", "Long COVID", "Anxiety", "Sleep", "Chronic Pain"] as const;
type Condition = (typeof conditions)[number];

type TipPost = {
  id: string;
  type: "Article" | "Video" | "Photo Guide";
  title: string;
  summary: string;
  author: string;
  initials: string;
  condition: Exclude<Condition, "All">;
  duration: string;
};

const tipPosts: TipPost[] = [
  { id: "t1", type: "Article", title: "Pacing 101: escape the boom-and-bust cycle", summary: "Why doing 70% of what you can on good days protects your bad days.", author: "Dr. Sarah Chen", initials: "SC", condition: "Fibromyalgia", duration: "4 min read" },
  { id: "t2", type: "Video", title: "5 gentle bed stretches for morning stiffness", summary: "Follow along before you get up — no equipment needed.", author: "Dr. Robert Vance", initials: "RV", condition: "Chronic Pain", duration: "6 min watch" },
  { id: "t3", type: "Article", title: "Understanding blood sugar spikes after meals", summary: "The order you eat food in matters more than you think.", author: "Dr. Marcus Williams", initials: "MW", condition: "Diabetes", duration: "5 min read" },
  { id: "t4", type: "Photo Guide", title: "Plate method: portioning without weighing", summary: "One image to plan every diabetic-friendly meal.", author: "Dr. Priya Patel", initials: "PP", condition: "Diabetes", duration: "2 min" },
  { id: "t5", type: "Article", title: "Post-exertional malaise: plan your energy envelope", summary: "Track, predict, and respect your limits while recovering.", author: "Dr. James Lin", initials: "JL", condition: "Long COVID", duration: "7 min read" },
  { id: "t6", type: "Video", title: "4-7-8 breathing, guided", summary: "The technique our community recommends most for panic moments.", author: "Dr. Fatima Al-Sayed", initials: "FA", condition: "Anxiety", duration: "3 min watch" },
  { id: "t7", type: "Article", title: "Sleep hygiene that actually works with chronic pain", summary: "Position, temperature, and timing adjustments that help.", author: "Dr. Anna Kowalski", initials: "AK", condition: "Sleep", duration: "6 min read" },
  { id: "t8", type: "Photo Guide", title: "Desk ergonomics for flare-up days", summary: "Set up your workspace to spend less energy sitting.", author: "Dr. Robert Vance", initials: "RV", condition: "Fibromyalgia", duration: "2 min" },
  { id: "t9", type: "Article", title: "Caffeine, naps and your sleep debt", summary: "How to use both without wrecking tonight's sleep.", author: "Dr. Anna Kowalski", initials: "AK", condition: "Sleep", duration: "4 min read" },
  { id: "t10", type: "Video", title: "Grounding techniques for health anxiety", summary: "Three exercises to interrupt symptom-checking spirals.", author: "Dr. Sarah Chen", initials: "SC", condition: "Anxiety", duration: "5 min watch" },
];

const typeGlyph: Record<TipPost["type"], string> = {
  Article: "📄",
  Video: "🎥",
  "Photo Guide": "🖼️",
};

export default function HealthTipsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState<Condition>("All");

  // Live doctor-published tips when signed in; the demo library when signed out.
  const { data: allTips } = useLiveOrDemo<TipPost[]>(
    async () =>
      (await resourcesApi.getHealthTips()).map((t: any) => ({
        id: t.id,
        type: t.type,
        title: t.title,
        summary: t.summary,
        author: t.author,
        initials: t.author
          .replace("Dr. ", "")
          .split(" ")
          .map((p: string) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        condition: t.condition,
        duration: t.duration,
      })),
    tipPosts,
  );

  const visiblePosts = useMemo(() => {
    const byCondition = condition === "All" ? allTips : allTips.filter((t) => t.condition === condition);
    const q = query.trim().toLowerCase();
    if (!q) return byCondition;
    return byCondition.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.condition.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q),
    );
  }, [query, condition, allTips]);

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

      <SearchBar placeholder="Find your problem..." value={query} onChangeText={setQuery} />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        {/* Basic advice — always on top */}
        <Text style={styles.sectionTitle}>Basic health advice</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adviceRow}>
          {basicAdvice.map((a, i) => (
            <View key={a.id} style={[styles.adviceCard, { backgroundColor: cardTints[i % cardTints.length] }]}>
              <Text style={styles.adviceGlyph}>{a.glyph}</Text>
              <Text style={styles.adviceText}>{a.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Condition filter */}
        <Text style={styles.sectionTitle}>Browse by condition</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {conditions.map((c) => {
            const active = condition === c;
            return (
              <Pressable key={c} onPress={() => setCondition(c)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Doctor posts */}
        {visiblePosts.length === 0 ? (
          <Text style={styles.emptyText}>Nothing matches "{query.trim()}" yet — try another word.</Text>
        ) : null}
        {visiblePosts.map((t) => (
          <Pressable key={t.id} style={styles.postCard}>
            <View style={styles.postTopRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {typeGlyph[t.type]} {t.type}
                </Text>
              </View>
              <Text style={styles.duration}>{t.duration}</Text>
            </View>

            <Text style={styles.postTitle}>{t.title}</Text>
            <Text style={styles.postSummary}>{t.summary}</Text>

            <View style={styles.postBottomRow}>
              <UserAvatar initials={t.initials} size={26} />
              <Text style={styles.author}>{t.author}</Text>
              <View style={styles.conditionPill}>
                <Text style={styles.conditionPillText}>{t.condition}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </ScreenWrapper>
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

    // Condition chips
    chipRow: {
      gap: moderateScale(8),
      paddingRight: moderateScale(4),
    },
    chip: {
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateVerticalScale(7),
      borderRadius: radius.xl,
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
      justifyContent: "space-between",
      marginBottom: moderateVerticalScale(8),
    },
    typeBadge: {
      backgroundColor: colors.lightBlue,
      borderRadius: radius.xl,
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateVerticalScale(3),
    },
    typeBadgeText: {
      fontSize: scale(11),
      color: colors.info,
      fontWeight: "600",
    },
    duration: {
      fontSize: scale(11),
      color: colors.mutedText,
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
    },
    author: {
      flex: 1,
      fontSize: TextStyles.caption,
      color: colors.text,
      fontWeight: "500",
    },
    conditionPill: {
      backgroundColor: colors.lightPurple,
      borderRadius: radius.xl,
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
