import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import SearchBar from "../../components/ui/SearchBar";
import CategoryChip from "../../components/ui/CategoryChip";
import UserAvatar from "../../components/ui/UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import { radius } from "../../theme/radius";

type ResultKind = "Person" | "Group" | "Consultant";

type SearchResult = {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  initials: string;
};

// Self-contained sample data (nothing in this app is backend-wired yet — consistent with
// every other screen). Kept local rather than importing other screens' in-file dummy arrays.
const PEOPLE: SearchResult[] = [
  { id: "p1", kind: "Person", title: "Shivani Rawat", subtitle: "Online", initials: "SR" },
  { id: "p2", kind: "Person", title: "Alex King", subtitle: "Fibromyalgia Warriors", initials: "AK" },
  { id: "p3", kind: "Person", title: "Priya Sharma", subtitle: "Online", initials: "PS" },
  { id: "p4", kind: "Person", title: "Jamie Lee", subtitle: "Long COVID Recovery", initials: "JL" },
];

const GROUPS: SearchResult[] = [
  { id: "g1", kind: "Group", title: "Fibromyalgia Warriors", subtitle: "1,284 members", initials: "FW" },
  { id: "g2", kind: "Group", title: "Type 2 Diabetes", subtitle: "3,421 members", initials: "TD" },
  { id: "g3", kind: "Group", title: "Long COVID Recovery", subtitle: "892 members", initials: "LC" },
  { id: "g4", kind: "Group", title: "Multiple Sclerosis", subtitle: "678 members", initials: "MS" },
];

const CONSULTANTS: SearchResult[] = [
  { id: "c1", kind: "Consultant", title: "Dr. Sarah Chen", subtitle: "Clinical Psychologist", initials: "SC" },
  { id: "c2", kind: "Consultant", title: "Dr. Priya Patel", subtitle: "Chronic Pain Specialist", initials: "PP" },
];

const ALL_RESULTS = [...PEOPLE, ...GROUPS, ...CONSULTANTS];

const FILTERS = ["All", "People", "Groups", "Consultants"] as const;
type Filter = (typeof FILTERS)[number];

const kindForFilter: Record<Exclude<Filter, "All">, ResultKind> = {
  People: "Person",
  Groups: "Group",
  Consultants: "Consultant",
};

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  // Sathi (friend) requests — local until the social graph is backend-wired
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  const toggleRequest = (id: string) => {
    setRequested((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const results = useMemo(() => {
    const byFilter =
      filter === "All" ? ALL_RESULTS : ALL_RESULTS.filter((r) => r.kind === kindForFilter[filter]);
    const q = query.trim().toLowerCase();
    if (!q) return byFilter;
    return byFilter.filter(
      (r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q),
    );
  }, [query, filter]);

  const onResultPress = (result: SearchResult) => {
    if (result.kind === "Group") navigation.navigate("GroupDetails", { name: result.title });
    else if (result.kind === "Consultant") navigation.navigate("ConsultantProfile");
    else navigation.navigate("ChatRoom", { name: result.title });
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.searchWrap}>
          <SearchBar
            placeholder="Search people, groups, consultants..."
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <CategoryChip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No results found.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.resultRow} onPress={() => onResultPress(item)}>
            <UserAvatar initials={item.initials} size={44} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
            </View>
            {item.kind === "Person" ? (
              <Pressable
                onPress={() => toggleRequest(item.id)}
                style={[styles.addBtn, requested[item.id] && styles.addBtnDone]}
                hitSlop={6}
              >
                <Text style={[styles.addBtnText, requested[item.id] && styles.addBtnTextDone]}>
                  {requested[item.id] ? "Requested ✓" : "+ Add Sathi"}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.kindPill}>
                <Text style={styles.kindPillText}>{item.kind}</Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: moderateVerticalScale(12),
    },
    searchWrap: {
      flex: 1,
      marginLeft: moderateScale(8),
    },
    filterRow: {
      flexDirection: "row",
      gap: moderateScale(8),
      marginBottom: moderateVerticalScale(12),
    },
    listContent: {
      paddingBottom: moderateVerticalScale(24),
    },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(12),
      marginBottom: moderateVerticalScale(8),
    },
    resultInfo: {
      flex: 1,
      marginLeft: moderateScale(12),
    },
    resultTitle: {
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
    },
    resultSubtitle: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },
    kindPill: {
      backgroundColor: colors.lightPurple,
      borderRadius: radius.xl,
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateVerticalScale(4),
    },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.xl,
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(6),
    },
    addBtnDone: {
      backgroundColor: colors.lightPurple,
    },
    addBtnText: {
      fontSize: TextStyles.caption,
      color: colors.white,
      fontWeight: "600",
    },
    addBtnTextDone: {
      color: colors.primary,
    },
    kindPillText: {
      fontSize: TextStyles.caption,
      color: colors.primary,
      fontWeight: "600",
    },
    emptyText: {
      textAlign: "center",
      color: colors.mutedText,
      marginTop: moderateVerticalScale(40),
      fontSize: TextStyles.body,
    },
  });
