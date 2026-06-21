import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import { StepIndicator } from "../../../components/ui/StepIndicator";
import { AppInput } from "../../../components/ui/AppInput";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../../components/ui/ScreenWrapper";

type Props = {
  navigation: any;
  name: string;
  setName: (value: string) => void;
  onContinue: () => void;
};

const ProfileNameScreen = ({ name, setName, onContinue }: Props) => {
  return (
    <ScreenWrapper>
      <StepIndicator total={3} current={0} />
      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.title}>Create your profile</Text>
      <Text style={styles.subtitle}>
        This is how others in your circles will know you.
      </Text>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name?.trim()?.charAt(0)?.toUpperCase() || "S"}</Text>
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
      <PrimaryButton title="Continue" onPress={onContinue} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  step: { color: "#6F87A6", fontSize: scale(16), marginTop: 18 },
  title: { fontSize: 30, fontWeight: "800", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 18, color: "#6F87A6", marginTop: 8 },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#C8D8F0",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 34,
    backgroundColor: "#EFF5FF",
  },
  avatarText: { fontSize: 44, fontWeight: "800", color: colors.primary },
  colorLabel: {
    textAlign: "center",
    color: "#6F87A6",
    fontSize: 18,
    marginTop: 18,
    marginBottom: 8,
  },
  helper: { color: "#6F87A6", fontSize: scale(14), marginTop: 8 },
});

export default ProfileNameScreen;