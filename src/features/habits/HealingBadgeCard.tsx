import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { resourcesApi } from "../../api/resourcesApi";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";

/**
 * Your Healing Points badge — shown on the Profile screen (web twin:
 * components/HealingBadge.tsx). The ladder lives on the backend; this just
 * renders whatever it says. Progress bar runs to YOUR next level — no
 * comparisons with anyone else.
 */

type Level = { level: number; name: string; icon: string; min: number };
type BadgeInfo = {
  points: { total: number };
  badge: { level: number; name: string; icon: string; min: number };
  nextBadge: { name: string; icon: string; at: number } | null;
  levels?: Level[];
};

// Mirrors the backend's HEALING_LEVELS — demo display + fallback only; live
// mode always renders what the server sends.
const LADDER: Level[] = [
  { level: 1, name: "Seedling", icon: "🌱", min: 0 },
  { level: 2, name: "Sprout", icon: "🌿", min: 150 },
  { level: 3, name: "Bloom", icon: "🌸", min: 600 },
  { level: 4, name: "Glow", icon: "✨", min: 1500 },
  { level: 5, name: "Radiant", icon: "🌟", min: 3000 },
  { level: 6, name: "Luminary", icon: "🌞", min: 6000 },
];

const DEMO_BADGE: BadgeInfo = {
  points: { total: 460 },
  badge: { level: 2, name: "Sprout", icon: "🌿", min: 150 },
  nextBadge: { name: "Bloom", icon: "🌸", at: 600 },
  levels: LADDER,
};

export default function HealingBadgeCard() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const { data } = useLiveOrDemo<BadgeInfo>(
    async () => resourcesApi.getHabitsToday(),
    DEMO_BADGE,
    DEMO_BADGE,
  );

  const badge = data.badge ?? DEMO_BADGE.badge;
  const next = data.nextBadge;
  const points = data.points?.total ?? 0;
  const span = next ? next.at - badge.min : 1;
  const progress = next ? Math.min(1, (points - badge.min) / span) : 1;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconTile}>
          <Text style={styles.iconText}>{badge.icon}</Text>
        </View>
        <View style={styles.textWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>Level {badge.level}</Text>
            </View>
          </View>
          <Text style={styles.pointsText}>✨ {points} Healing Points</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.nextText}>
        {next
          ? `${next.icon} ${next.name} at ${next.at} points — ${next.at - points} to go`
          : "Top of the ladder — a Luminary of the circle 🌞"}
      </Text>

      {/* The whole ladder — everyone should know the missions ahead */}
      <View style={styles.ladderRow}>
        {(data.levels ?? LADDER).map((lvl) => {
          const achieved = points >= lvl.min;
          const current = lvl.level === badge.level;
          return (
            <View
              key={lvl.level}
              style={[
                styles.ladderCell,
                current ? styles.ladderCellCurrent : achieved ? styles.ladderCellDone : null,
              ]}
            >
              <Text style={[styles.ladderIcon, !achieved && styles.ladderIconLocked]}>
                {lvl.icon}
              </Text>
              <Text
                style={[
                  styles.ladderName,
                  current ? styles.ladderNameCurrent : achieved ? styles.ladderNameDone : null,
                ]}
                numberOfLines={1}
              >
                {lvl.name}
              </Text>
              <Text style={styles.ladderMin}>{achieved && !current ? "✓" : `${lvl.min}+`}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(13),
      marginBottom: moderateVerticalScale(14),
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(10),
    },
    iconTile: {
      width: moderateScale(44),
      height: moderateScale(44),
      borderRadius: radius.md,
      backgroundColor: colors.lightPurple,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: {
      fontSize: scale(20),
    },
    textWrap: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(7),
    },
    badgeName: {
      fontSize: TextStyles.body,
      fontWeight: "700",
      color: colors.text,
    },
    levelPill: {
      backgroundColor: colors.lightPurple,
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(7),
      paddingVertical: 1,
    },
    levelPillText: {
      fontSize: scale(9),
      fontWeight: "800",
      color: colors.primary,
    },
    pointsText: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(1),
    },
    track: {
      height: moderateVerticalScale(6),
      borderRadius: radius.pill,
      backgroundColor: colors.lightBlue,
      overflow: "hidden",
      marginTop: moderateVerticalScale(10),
    },
    fill: {
      height: "100%",
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    nextText: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(6),
    },

    ladderRow: {
      flexDirection: "row",
      gap: moderateScale(5),
      marginTop: moderateVerticalScale(10),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: moderateVerticalScale(10),
    },
    ladderCell: {
      flex: 1,
      alignItems: "center",
      borderRadius: radius.sm,
      backgroundColor: colors.background,
      paddingVertical: moderateVerticalScale(6),
      opacity: 0.75,
    },
    ladderCellDone: {
      backgroundColor: colors.lightPurple,
      opacity: 1,
    },
    ladderCellCurrent: {
      backgroundColor: colors.lightPurple,
      borderWidth: 1,
      borderColor: colors.primary,
      opacity: 1,
    },
    ladderIcon: {
      fontSize: scale(13),
    },
    ladderIconLocked: {
      opacity: 0.45,
    },
    ladderName: {
      fontSize: scale(8),
      fontWeight: "700",
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },
    ladderNameDone: {
      color: colors.text,
    },
    ladderNameCurrent: {
      color: colors.primary,
    },
    ladderMin: {
      fontSize: scale(7),
      fontWeight: "600",
      color: colors.mutedText,
      marginTop: 1,
    },
  });
