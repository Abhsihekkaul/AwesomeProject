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
import { colors } from "../../theme/colors";
import  PrimaryButton from "../../components/ui/PrimaryButton";
import { SecondaryButton } from "../../components/ui/SecondaryButton";
import { StepIndicator } from "../../components/ui/StepIndicator";
import { conditions } from "../../data/conditions";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

const HealthJourneyScreen = ({ navigation }: any) => {
  const [selected, setSelected] = useState<string[]>(["Fibromyalgia"]);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

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
          <TextInput placeholder="Search conditions..." placeholderTextColor="#90A1B8" style={styles.searchInput} />
        </View>

        <View style={styles.chipWrap}>
          {selected.map((item) => (
            <Pressable key={item} style={styles.chip}>
              <Text style={styles.chipText}>{item} ×</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={conditions}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          style={styles.list}
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

const styles = StyleSheet.create({
  step: {
    color: "#6F87A6",
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
    color: "#6F87A6",
    marginTop: moderateVerticalScale(8),
    marginBottom: moderateVerticalScale(18),
  },

  searchBox: {
    height: moderateVerticalScale(52),
    backgroundColor: "#EEF3FB",
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
  },

  searchIcon: {
    color: "#90A1B8",
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
    borderBottomColor: "#E5ECF6",
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
    borderColor: "#C9D8EE",
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
});


export default HealthJourneyScreen