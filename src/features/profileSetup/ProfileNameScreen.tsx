import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { moderateVerticalScale, scale } from "react-native-size-matters";
import { AppInput } from "../../components/ui/AppInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { StepIndicator } from "../../components/ui/StepIndicator";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";

const ProfileNameScreen = ({ navigation }: any) => {
  const [name, setName] = useState("Sarah");

  return (
    <ScreenWrapper>
      <StepIndicator total={3} current={0} />
      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.title}>Create your profile</Text>
      <Text style={styles.subtitle}>This is how others in your circles will know you.</Text>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>S</Text>
      </View>

      <Text style={styles.colorLabel}>Choose your color</Text>

      <AppInput
        label="Display Name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
      />

      <Text style={styles.helper}>
        This can be a nickname — your real name is never required.
      </Text>

      <View style={{ flex: 1 }} />
      <PrimaryButton title="Continue" onPress={() => navigation.navigate("HealthJourney")} />
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
    marginTop: 8,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#C8D8F0",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateVerticalScale(32),
    backgroundColor: "#EFF5FF",
  },

  avatarText: {
    fontSize: TextStyles.hero,
    fontWeight: "800",
    color: colors.primary
  },

  colorLabel: {
    textAlign: "center",
    color: "#6380a7",
    fontSize: TextStyles.body,
    marginTop: moderateVerticalScale(18),
    marginBottom: moderateVerticalScale(8),
  },

  helper: {
    color: "#6F87A6",
    fontSize: TextStyles.stepCounts,
    marginTop: moderateVerticalScale(8),
  },

});


export default ProfileNameScreen