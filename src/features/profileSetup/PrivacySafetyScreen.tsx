import React, { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import PrimaryButton from "../../components/ui/PrimaryButton";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { SecondaryButton } from "../../components/ui/SecondaryButton";
import { StepIndicator } from "../../components/ui/StepIndicator";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";


const PrivacySafetyScreen = ({ navigation }: any) => {
  const [publicProfile, setPublicProfile] = useState(false);
  const [showConditions, setShowConditions] = useState(true);
  const [anonymousPosts, setAnonymousPosts] = useState(false);

  const ToggleRow = ({
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <ScreenWrapper>
      <StepIndicator total={3} current={2} />
      <Text style={styles.step}>Step 3 of 3</Text>
      <Text style={styles.title}>Privacy & safety</Text>
      <Text style={styles.subtitle}>Choose what feels right for you. You can change this anytime.</Text>

      <ToggleRow
        title="Public profile"
        subtitle="Allow other members to view your healing journey."
        value={publicProfile}
        onValueChange={setPublicProfile}
      />

      {/* <ToggleRow
        title="Show my conditions"
        subtitle="Display your conditions on your public profile"
        value={showConditions}
        onValueChange={setShowConditions}
      /> */}

      <ToggleRow
        title="Anonymous posts by default"
        subtitle="Post without revealing your name to others."
        value={anonymousPosts}
        onValueChange={setAnonymousPosts}
      />

      <View style={styles.note}>
        <Text style={styles.noteTitle}>Your privacy is protected</Text>
        <Text style={styles.noteText}>
          We never share your medical information. You can update these settings anytime from your profile.
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <View style={styles.bottomRow}>
        <SecondaryButton
          title="Back"
          onPress={() => navigation.goBack()}
          style={styles.bottomBtn}
        />

        <PrimaryButton
          title=" HealCircle ›"
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            })
          }
          style={styles.bottomBtn}
        />
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

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#E3EAF4",
    marginBottom: moderateVerticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardLeft: {
    flex: 1,
    paddingRight: moderateScale(12),
  },

  cardTitle: {
    fontSize: TextStyles.subtitle,
    fontWeight: "600",
    color: colors.text,
    marginBottom: moderateVerticalScale(2),
  },
  cardSubtitle: {
    fontSize: TextStyles.stepCounts,
    color: "#6F87A6",
    lineHeight: 20
  },
  note: {
    backgroundColor: "#d6f4e1",
    borderRadius: radius.md,
    padding: moderateScale(16),
    marginTop: moderateVerticalScale(10),
  },
  noteTitle: {
    color: "#4FA57B",
    fontSize: TextStyles.body,
    fontWeight: "600",
    marginBottom: moderateVerticalScale(6),
  },

  noteText: {
    color: "#4FA57B",
    fontSize: TextStyles.caption,
    lineHeight: moderateScale(21)
  },

  bottomRow: {
    flexDirection: "row",
    gap: moderateScale(12),
  },

  bottomBtn: {
    flex: 1
  },

});

export default PrivacySafetyScreen