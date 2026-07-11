import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import  PrimaryButton from "../../components/ui/PrimaryButton";
import { SecondaryButton } from "../../components/ui/SecondaryButton";
import { StepIndicator } from "../../components/ui/StepIndicator";
import { conditions } from "../../data/conditions";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

const HealthJourneyScreen = ({ navigation }: any) => {
  const [selected, setSelected] = useState<string[]>(["Fibromyalgia"]);
  const [query, setQuery] = useState("");

  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const visibleConditions = query.trim()
    ? conditions.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))
    : conditions;

  return (
    <ScreenWrapper>
        <StepIndicator total={3} current={1} />
        <Text style={styles.step}>Step 2 of 3</Text>
        <Text style={styles.title}>Your health journey</Text>
        <Text style={styles.subtitle}>
          Select the condition(s) you live with. You can add more later.
        </Text>

        <View style={styles.searchBox}>
        <Image style={styles.searchIcon} source={imagePath.SearchIcon} />
          <TextInput
            placeholder="Search conditions..."
            placeholderTextColor={colors.mutedText}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={styles.chipWrap}>
          {selected.map((item) => (
            <Pressable key={item} style={styles.chip}>
              <Text style={styles.chipText}>{item} ×</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={visibleConditions}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyText}>No conditions match "{query.trim()}".</Text>
          }
          renderItem={({ item }) => {
            const active = selected.includes(item);
            return (
              <Pressable onPress={() => toggle(item)} style={styles.row}>
                <Text style={styles.rowText}>{item}</Text>
                <View style={[styles.circle, active && styles.circleActive]}>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </View>
              </Pressable>
            );
          }}
        />

        <View style={styles.bottomRow}>
          <SecondaryButton title="Back" onPress={() => navigation.goBack()} style={styles.bottomBtn} />
          <PrimaryButton title="Continue" onPress={() => navigation.navigate("PrivacySafety")} style={styles.bottomBtn} />
        </View>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  step: {
    color: colors.mutedText,
    fontSize: TextStyles.stepCounts,
    marginTop: moderateVerticalScale(18),
  },

  title: {
    fontSize: TextStyles.title,
    fontWeight: "600",
    color: colors.text,
    marginTop: moderateVerticalScale(6),
  },

  subtitle: {
    fontSize: TextStyles.body,
    color: colors.mutedText,
    marginTop: moderateVerticalScale(8),
    marginBottom: moderateVerticalScale(18),
  },

  searchBox: {
    height: moderateVerticalScale(52),
    backgroundColor: colors.lightBlue,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
  },

  searchIcon: {
    color: colors.mutedText,
    height: moderateVerticalScale(20),
    width : moderateScale(21),
    marginRight: moderateScale(8)
  },

  searchInput: {
    flex: 1,
    fontSize: TextStyles.body,
    color: colors.text
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(4),
    marginTop: moderateVerticalScale(10)
  },

  chip: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateVerticalScale(6),
  },

  chipText: {
    color: colors.white,
    fontWeight: "500"
  },

  list: {
    marginTop: 14
  },
  row: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowText: {
    fontSize: TextStyles.body,
    color: colors.text,
    fontWeight: "500"
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  check: {
    color: colors.white,
    fontWeight: "800"
  },
  bottomRow: {
    flexDirection: "row",
    gap: moderateScale(12),
    marginTop: moderateVerticalScale(12),
  },
  bottomBtn: { flex: 1 },
  emptyText: {
    textAlign: "center",
    color: colors.mutedText,
    fontSize: TextStyles.body,
    marginTop: moderateVerticalScale(24),
  },
});


export default HealthJourneyScreen