import React from "react";
import { StyleSheet, Text, View, Switch } from "react-native";
import { colors } from "../../../theme/colors";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import { SecondaryButton } from "../../../components/ui/SecondaryButton";
import { StepIndicator } from "../../../components/ui/StepIndicator";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../../components/ui/ScreenWrapper";

type ToggleRowProps = {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

type Props = {
  navigation: any;
  publicProfile: boolean;
  setPublicProfile: React.Dispatch<React.SetStateAction<boolean>>;
  showConditions: boolean;
  setShowConditions: React.Dispatch<React.SetStateAction<boolean>>;
  anonymousPosts: boolean;
  setAnonymousPosts: React.Dispatch<React.SetStateAction<boolean>>;
  onBack: () => void;
  onFinish: () => void;
};

const ToggleRow = ({
  title,
  subtitle,
  value,
  onValueChange,
}: ToggleRowProps) => (
  <View style={styles.card}>
    <View style={styles.cardLeft}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    <Switch value={value} onValueChange={onValueChange} />
  </View>
);

const PrivacySafetyScreen = ({
  publicProfile,
  setPublicProfile,
  showConditions,
  setShowConditions,
  anonymousPosts,
  setAnonymousPosts,
  onBack,
  onFinish,
}: Props) => {
  return (
    <ScreenWrapper>
      <StepIndicator total={3} current={2} />
      <Text style={styles.step}>Step 3 of 3</Text>
      <Text style={styles.title}>Privacy & safety</Text>
      <Text style={styles.subtitle}>
        Choose what feels right for you. You can change this anytime.
      </Text>

      <ToggleRow
        title="Public profile"
        subtitle="Allow other members to view your basic profile"
        value={publicProfile}
        onValueChange={setPublicProfile}
      />

      <ToggleRow
        title="Show my conditions"
        subtitle="Display your conditions on your public profile"
        value={showConditions}
        onValueChange={setShowConditions}
      />

      <ToggleRow
        title="Anonymous posts by default"
        subtitle="Post without revealing your name to others"
        value={anonymousPosts}
        onValueChange={setAnonymousPosts}
      />

      <View style={styles.note}>
        <Text style={styles.noteTitle}>🔒 Your privacy is protected</Text>
        <Text style={styles.noteText}>
          We never share your medical information. You can update these settings anytime from your profile.
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <View style={styles.bottomRow}>
        <SecondaryButton title="Back" onPress={onBack} style={styles.bottomBtn} />
        <PrimaryButton title=" HealCircle ›" onPress={onFinish} style={styles.bottomBtn} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  step: { color: "#6F87A6", fontSize: scale(16), marginTop: 18 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 18, color: "#6F87A6", marginTop: 8, marginBottom: 18 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E3EAF4",
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: scale(17), fontWeight: "800", color: colors.text, marginBottom: 6 },
  cardSubtitle: { fontSize: scale(14), color: "#6F87A6", lineHeight: 20 },
  note: {
    backgroundColor: "#E7F4EC",
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
  },
  noteTitle: { color: "#4FA57B", fontSize: scale(16), fontWeight: "800", marginBottom: 6 },
  noteText: { color: "#4FA57B", fontSize: scale(14), lineHeight: 21 },
  bottomRow: { flexDirection: "row", gap: 12 },
  bottomBtn: { flex: 1 },
});

export default PrivacySafetyScreen;