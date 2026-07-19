import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import UserAvatar from "../../components/ui/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { resourcesApi } from "../../api/resourcesApi";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";

/**
 * Healing Habits — the gamification card at the top of Health Tips (web twin:
 * components/HealingHabits.tsx). Tick the day's checklist, earn Healing
 * Points (10/task, +20 full day), watch the month fill in, and cheer your
 * sathis' progress. Gentle by design: empty days are just empty, never red.
 */

type HabitTask = { key: string; label: string; done: boolean };
type HabitsToday = {
  day: string;
  tasks: HabitTask[];
  points: { today: number; month: number; total: number; perTask: number; fullDayBonus: number };
  month: { day: string; completed: number; total: number }[];
};
type CircleEntry = {
  user: { id: string; name: string; avatarColor?: string; avatarUrl?: string | null };
  todayCompleted: number;
  todayTotal: number;
  monthPoints: number;
  cheeredToday: boolean;
};

const DEMO_TODAY: HabitsToday = {
  day: new Date().toISOString().slice(0, 10),
  tasks: [
    { key: "water", label: "Drink 2–4 litres of water", done: true },
    { key: "sleep", label: "Sleep 7–8 hours", done: true },
    { key: "walk", label: "Take a 30-minute walk", done: false },
    { key: "breathe", label: "60 seconds of slow breathing", done: false },
    { key: "veg", label: "Eat one extra fruit or vegetable", done: false },
  ],
  points: { today: 2, month: 42, total: 180, perTask: 1, fullDayBonus: 10 },
  month: [],
};

const DEMO_CIRCLE: CircleEntry[] = [
  { user: { id: "d1", name: "Alex K." }, todayCompleted: 4, todayTotal: 5, monthPoints: 46, cheeredToday: false },
  { user: { id: "d2", name: "Maya Harrison" }, todayCompleted: 2, todayTotal: 5, monthPoints: 28, cheeredToday: true },
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function HealingHabitsCard() {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<any>();
  const styles = makeStyles(colors);

  const { data: today, refresh } = useLiveOrDemo<HabitsToday>(
    async () => resourcesApi.getHabitsToday(),
    DEMO_TODAY,
    DEMO_TODAY,
    60_000,
  );

  const { data: circle, refresh: refreshCircle } = useLiveOrDemo<CircleEntry[]>(
    async () => resourcesApi.getHabitsCircle(),
    DEMO_CIRCLE,
    [],
    60_000,
  );

  // Optimistic tick overlay — the API + refresh reconcile shortly after.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const isDone = (t: HabitTask) => overrides[t.key] ?? t.done;
  const doneCount = today.tasks.filter(isDone).length;
  const allDone = doneCount >= today.tasks.length;
  const pointsToday = doneCount * today.points.perTask + (allDone ? today.points.fullDayBonus : 0);
  const totalPoints = today.points.total + (pointsToday - today.points.today);
  const monthPoints = today.points.month + (pointsToday - today.points.today);

  const toggle = async (t: HabitTask) => {
    if (!isAuthenticated) {
      Alert.alert(
        "Sign in required",
        "Create an account to start collecting Healing Points — your circle will see your progress.",
      );
      return;
    }
    const prev = isDone(t);
    setOverrides((o) => ({ ...o, [t.key]: !prev }));
    try {
      await resourcesApi.toggleHabit(t.key);
      refresh({ silent: true });
    } catch {
      setOverrides((o) => ({ ...o, [t.key]: prev }));
    }
  };

  const cheer = async (entry: CircleEntry) => {
    if (!isAuthenticated || entry.cheeredToday) return;
    try {
      await resourcesApi.cheerHabits(entry.user.id);
      refreshCircle({ silent: true });
    } catch {
      /* the button simply stays available */
    }
  };

  // The month strip: one dot per day so far this month.
  const dayOfMonth = Number(today.day.slice(8, 10));
  const monthByDay = new Map(today.month.map((m) => [Number(m.day.slice(8, 10)), m]));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🌱 Daily healing habits</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>✨ {totalPoints} pts</Text>
        </View>
      </View>

      {/* Today's progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${(doneCount / today.tasks.length) * 100}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {doneCount}/{today.tasks.length} · +{pointsToday} today
        </Text>
      </View>
      {allDone ? (
        <Text style={styles.fullDayText}>Full day ✓ — bonus earned. Gentle on yourself tomorrow too.</Text>
      ) : null}

      {/* The checklist */}
      {today.tasks.map((t) => {
        const done = isDone(t);
        return (
          <Pressable
            key={t.key}
            onPress={() => toggle(t)}
            style={[styles.taskRow, done && styles.taskRowDone]}
          >
            <View style={[styles.tick, done && styles.tickDone]}>
              {done ? <Text style={styles.tickMark}>✓</Text> : null}
            </View>
            <Text style={[styles.taskLabel, done && styles.taskLabelDone]}>{t.label}</Text>
            <Text style={styles.taskPoints}>+{today.points.perTask}</Text>
          </Pressable>
        );
      })}

      {/* Month strip */}
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>This month</Text>
        <Text style={styles.monthPoints}>{monthPoints} pts</Text>
      </View>
      <View style={styles.monthStrip}>
        {Array.from({ length: dayOfMonth }, (_, i) => i + 1).map((d) => {
          const rec =
            d === dayOfMonth
              ? { completed: doneCount, total: today.tasks.length }
              : monthByDay.get(d);
          const frac = rec ? rec.completed / rec.total : 0;
          return (
            <View
              key={d}
              style={[
                styles.monthDot,
                frac >= 1
                  ? { backgroundColor: colors.primary }
                  : frac > 0
                    ? { backgroundColor: colors.lightPurple, borderWidth: 1, borderColor: colors.primary }
                    : { backgroundColor: colors.lightBlue },
              ]}
            />
          );
        })}
      </View>

      {/* The circle — support each other */}
      {circle.length > 0 ? (
        <>
          <Text style={styles.circleTitle}>Your circle today</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circleRow}>
            {circle.map((entry) => (
              <View key={entry.user.id} style={styles.circleCard}>
                <Pressable
                  onPress={() => navigation.navigate("UserProfile", { userId: entry.user.id, name: entry.user.name })}
                >
                  <UserAvatar
                    initials={initialsOf(entry.user.name)}
                    uri={entry.user.avatarUrl}
                    size={moderateScale(36)}
                    MarginRightSide={0}
                  />
                </Pressable>
                <Text style={styles.circleName} numberOfLines={1}>
                  {entry.user.name.split(" ")[0]}
                </Text>
                <Text style={styles.circleStats}>
                  {entry.todayCompleted}/{entry.todayTotal} · {entry.monthPoints} pts
                </Text>
                <Pressable
                  onPress={() => cheer(entry)}
                  disabled={entry.cheeredToday}
                  style={[styles.cheerBtn, entry.cheeredToday && styles.cheerBtnDone]}
                >
                  <Text style={[styles.cheerText, entry.cheeredToday && styles.cheerTextDone]}>
                    {entry.cheeredToday ? "Cheered ✓" : "Cheer 🎉"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(14),
      marginBottom: moderateVerticalScale(12),
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: moderateScale(8),
    },
    title: {
      fontSize: TextStyles.body,
      fontWeight: "700",
      color: colors.text,
    },
    pointsBadge: {
      backgroundColor: colors.lightPurple,
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateVerticalScale(4),
    },
    pointsBadgeText: {
      color: colors.primary,
      fontSize: scale(11),
      fontWeight: "800",
    },

    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(10),
      marginTop: moderateVerticalScale(10),
    },
    progressTrack: {
      flex: 1,
      height: moderateVerticalScale(6),
      borderRadius: radius.pill,
      backgroundColor: colors.lightBlue,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    progressLabel: {
      fontSize: scale(10),
      fontWeight: "700",
      color: colors.mutedText,
    },
    fullDayText: {
      marginTop: moderateVerticalScale(6),
      fontSize: TextStyles.caption,
      fontWeight: "600",
      color: colors.success,
    },

    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(10),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(9),
      marginTop: moderateVerticalScale(7),
    },
    taskRowDone: {
      borderColor: colors.primary,
      backgroundColor: colors.lightPurple,
    },
    tick: {
      width: moderateScale(22),
      height: moderateScale(22),
      borderRadius: moderateScale(11),
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    tickDone: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    tickMark: {
      color: colors.white,
      fontSize: scale(11),
      fontWeight: "800",
    },
    taskLabel: {
      flex: 1,
      fontSize: TextStyles.stepCounts,
      fontWeight: "500",
      color: colors.text,
    },
    taskLabelDone: {
      color: colors.primary,
      fontWeight: "600",
    },
    taskPoints: {
      fontSize: scale(10),
      fontWeight: "700",
      color: colors.mutedText,
    },

    monthHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: moderateVerticalScale(12),
      marginBottom: moderateVerticalScale(6),
    },
    monthTitle: {
      fontSize: TextStyles.caption,
      fontWeight: "700",
      color: colors.mutedText,
    },
    monthPoints: {
      fontSize: TextStyles.caption,
      fontWeight: "600",
      color: colors.mutedText,
    },
    monthStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(5),
    },
    monthDot: {
      width: moderateScale(11),
      height: moderateScale(11),
      borderRadius: moderateScale(6),
    },

    circleTitle: {
      fontSize: TextStyles.caption,
      fontWeight: "700",
      color: colors.mutedText,
      marginTop: moderateVerticalScale(12),
      marginBottom: moderateVerticalScale(6),
    },
    circleRow: {
      gap: moderateScale(8),
    },
    circleCard: {
      width: moderateScale(86),
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: moderateScale(8),
    },
    circleName: {
      marginTop: moderateVerticalScale(4),
      fontSize: TextStyles.caption,
      fontWeight: "600",
      color: colors.text,
      maxWidth: moderateScale(76),
    },
    circleStats: {
      fontSize: scale(9),
      fontWeight: "700",
      color: colors.mutedText,
      marginTop: moderateVerticalScale(1),
    },
    cheerBtn: {
      marginTop: moderateVerticalScale(5),
      backgroundColor: colors.lightPurple,
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(9),
      paddingVertical: moderateVerticalScale(3),
    },
    cheerBtnDone: {
      backgroundColor: colors.lightGreen,
    },
    cheerText: {
      fontSize: scale(9),
      fontWeight: "800",
      color: colors.primary,
    },
    cheerTextDone: {
      color: colors.success,
    },
  });
