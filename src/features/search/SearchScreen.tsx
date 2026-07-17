import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import SearchBar from "../../components/ui/SearchBar";
import CategoryChip from "../../components/ui/CategoryChip";
import UserAvatar from "../../components/ui/UserAvatar";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useAuth } from "../../context/AuthContext";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
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
  // People only: none → "+ Add Sathi", pending → "Requested", sathi → connected
  relation?: "none" | "pending" | "sathi";
};

// Demo-mode sample data (shown signed out, per the useLiveOrDemo contract).
const DEMO_PEOPLE: SearchResult[] = [
  { id: "p1", kind: "Person", title: "Shivani Rawat", subtitle: "Online", initials: "SR", relation: "none" },
  { id: "p2", kind: "Person", title: "Alex King", subtitle: "Fibromyalgia Warriors", initials: "AK", relation: "none" },
  { id: "p3", kind: "Person", title: "Priya Sharma", subtitle: "Online", initials: "PS", relation: "none" },
  { id: "p4", kind: "Person", title: "Jamie Lee", subtitle: "Long COVID Recovery", initials: "JL", relation: "none" },
];

const DEMO_GROUPS: SearchResult[] = [
  { id: "g1", kind: "Group", title: "Fibromyalgia Warriors", subtitle: "1,284 members", initials: "FW" },
  { id: "g2", kind: "Group", title: "Type 2 Diabetes", subtitle: "3,421 members", initials: "TD" },
  { id: "g3", kind: "Group", title: "Long COVID Recovery", subtitle: "892 members", initials: "LC" },
  { id: "g4", kind: "Group", title: "Multiple Sclerosis", subtitle: "678 members", initials: "MS" },
];

const DEMO_CONSULTANTS: SearchResult[] = [
  { id: "c1", kind: "Consultant", title: "Dr. Sarah Chen", subtitle: "Clinical Psychologist", initials: "SC" },
  { id: "c2", kind: "Consultant", title: "Dr. Priya Patel", subtitle: "Chronic Pain Specialist", initials: "PP" },
];

const FILTERS = ["All", "People", "Groups", "Consultants"] as const;
type Filter = (typeof FILTERS)[number];

const kindForFilter: Record<Exclude<Filter, "All">, ResultKind> = {
  People: "Person",
  Groups: "Group",
  Consultants: "Consultant",
};

const initialsOf = (name: string) =>
  name
    .replace("Dr. ", "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  // Groups + consultants are small directories: fetched once, filtered locally.
  const { data: groups } = useLiveOrDemo<SearchResult[]>(
    async () =>
      (await resourcesApi.getGroups()).map((g: any) => ({
        id: g.id,
        kind: "Group" as const,
        title: g.name,
        subtitle: `${g.memberCount} member${g.memberCount === 1 ? "" : "s"}`,
        initials: initialsOf(g.name),
      })),
    DEMO_GROUPS,
  );

  const { data: consultants } = useLiveOrDemo<SearchResult[]>(
    async () =>
      (await resourcesApi.getConsultants()).map((c: any) => ({
        id: c.id,
        kind: "Consultant" as const,
        title: c.name,
        subtitle: c.role,
        initials: initialsOf(c.name),
      })),
    DEMO_CONSULTANTS,
  );

  // People come from the live search endpoint, debounced as the user types.
  const [people, setPeople] = useState<SearchResult[]>(DEMO_PEOPLE);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isAuthenticated) {
      setPeople(DEMO_PEOPLE);
      return;
    }
    const q = query.trim();
    if (!q) {
      setPeople([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const users = await resourcesApi.searchUsers(q);
        setPeople(
          users.map((u: any) => ({
            id: u.id,
            kind: "Person" as const,
            title: u.name,
            subtitle: (u.conditions ?? []).slice(0, 2).join(", ") || "Member",
            initials: initialsOf(u.name),
            relation: u.relation,
          })),
        );
      } catch {
        setPeople([]);
      }
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, isAuthenticated]);

  const handleAddSathi = async (person: SearchResult) => {
    // Signed out: the demo keeps its old local-toggle behavior.
    if (!isAuthenticated) {
      setPeople((prev) =>
        prev.map((p) => (p.id === person.id ? { ...p, relation: "pending" } : p)),
      );
      return;
    }
    // Optimistic: flip to "Requested" immediately, roll back if the API fails.
    setPeople((prev) =>
      prev.map((p) => (p.id === person.id ? { ...p, relation: "pending" } : p)),
    );
    try {
      await resourcesApi.sendSathiRequest(person.id);
    } catch (err) {
      setPeople((prev) =>
        prev.map((p) => (p.id === person.id ? { ...p, relation: "none" } : p)),
      );
      Alert.alert("Couldn't send request", apiErrorMessage(err));
    }
  };

  const results = useMemo(() => {
    const all = [...people, ...groups, ...consultants];
    const byFilter =
      filter === "All" ? all : all.filter((r) => r.kind === kindForFilter[filter]);
    const q = query.trim().toLowerCase();
    if (!q) return byFilter;
    // People are already server-filtered by the query; groups/consultants filter locally.
    return byFilter.filter(
      (r) =>
        r.kind === "Person" ||
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q),
    );
  }, [people, groups, consultants, query, filter]);

  const onResultPress = async (result: SearchResult) => {
    if (result.kind === "Group") {
      navigation.navigate("GroupDetails", { name: result.title });
    } else if (result.kind === "Consultant") {
      navigation.navigate("ConsultantProfile", { name: result.title });
    } else if (result.kind === "Person" && isAuthenticated) {
      // Tapping a person opens their read-only profile (Message lives there).
      navigation.navigate("UserProfile", { userId: result.id, name: result.title });
    }
  };

  const emptyText = isAuthenticated && !query.trim()
    ? "Search for people by name to add them as a Sathi."
    : "No results found.";

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
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.resultRow} onPress={() => onResultPress(item)}>
            <UserAvatar initials={item.initials} size={44} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
            </View>
            {item.kind === "Person" ? (
              item.relation === "sathi" ? (
                <View style={styles.kindPill}>
                  <Text style={styles.kindPillText}>Sathi ✓</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => handleAddSathi(item)}
                  style={[styles.addBtn, item.relation === "pending" && styles.addBtnDone]}
                  hitSlop={6}
                  disabled={item.relation === "pending"}
                >
                  <Text
                    style={[styles.addBtnText, item.relation === "pending" && styles.addBtnTextDone]}
                  >
                    {item.relation === "pending" ? "Requested ✓" : "+ Add Sathi"}
                  </Text>
                </Pressable>
              )
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
