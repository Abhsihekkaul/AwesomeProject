import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
} from "react-native";
import { colors } from "../../../theme/colors";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import { SecondaryButton } from "../../../components/ui/SecondaryButton";
import { StepIndicator } from "../../../components/ui/StepIndicator";
import { conditions } from "../../../data/conditions";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../../components/ui/ScreenWrapper";

type Props = {
  navigation: any;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  onBack: () => void;
  onContinue: () => void;
};

const HealthJourneyScreen = ({ selected, setSelected, onBack, onContinue }: Props) => {
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
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Search conditions..."
          placeholderTextColor="#90A1B8"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.chipWrap}>
        {selected.map((item) => (
          <Pressable key={item} style={styles.chip} onPress={() => toggle(item)}>
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
        <SecondaryButton title="Back" onPress={onBack} style={styles.bottomBtn} />
        <PrimaryButton title="Continue" onPress={onContinue} style={styles.bottomBtn} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  step: { color: "#6F87A6", fontSize: scale(16), marginTop: 18 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 18, color: "#6F87A6", marginTop: 8, marginBottom: 18 },
  searchBox: {
    height: 52,
    backgroundColor: "#EEF3FB",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  searchIcon: { fontSize: 18, color: "#90A1B8", marginRight: 10 },
  searchInput: { flex: 1, fontSize: scale(16), color: colors.text },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  chip: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { color: colors.white, fontWeight: "700" },
  list: { marginTop: 14 },
  row: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: "#E5ECF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: { fontSize: 18, color: colors.text, fontWeight: "600" },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#C9D8EE",
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: colors.white, fontWeight: "800" },
  bottomRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  bottomBtn: { flex: 1 },
});

export default HealthJourneyScreen;