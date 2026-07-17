import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import { useTheme } from "../../theme/ThemeContext";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { AppInput } from "../../components/ui/AppInput";
import { useAuth } from "../../context/AuthContext";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

export default function RequestGroupScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [population, setPopulation] = useState("");
  const [reason, setReason] = useState("");
  const [references, setReferences] = useState("");

  const canSubmit = condition.trim() && description.trim() && reason.trim();
  const filledCount = [condition, description, reason].filter((v) => v.trim()).length;

  const { isAuthenticated } = useAuth();

  const handleSubmit = async () => {
    const missing = [
      !condition.trim() && "condition name",
      !description.trim() && "description",
      !reason.trim() && "why the group needs to exist",
    ].filter(Boolean);

    if (missing.length > 0) {
      Alert.alert("A few details missing", `Please fill in the ${missing.join(", ")} field${missing.length > 1 ? "s" : ""} marked with *.`);
      return;
    }

    // Signed in → creates a real proposal for superuser review; demo → local success flow.
    if (isAuthenticated) {
      try {
        await resourcesApi.requestGroup({
          condition: condition.trim(),
          description: description.trim(),
          population: population.trim() || undefined,
          reason: reason.trim(),
          references: references.trim() || undefined,
        });
      } catch (err) {
        Alert.alert("Couldn't submit", apiErrorMessage(err));
        return;
      }
    }

    Alert.alert(
      "Request submitted ✅",
      "Our medical team will review your request within 2–5 business days. We'll notify you once it's approved.",
      [{ text: "Done", onPress: () => navigation.goBack() }],
    );
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Request New Group</Text>
            <Text style={styles.sub}>For medical review & approval</Text>
          </View>
        </View>

        {/* Review Info */}
        <View style={styles.infoBox}>
          <Image
            source={imagePath.ShieldIcon}
            style={[styles.infoIcon, { tintColor: colors.primary }]}
          />
          <Text style={styles.infoText}>
            New groups are reviewed by our medical team to ensure they serve a
            real need and maintain community safety. Review typically takes 2–5
            business days.
          </Text>
        </View>

        {/* Form */}
        <AppInput
          label="Condition / Disease Name *"
          value={condition}
          onChangeText={setCondition}
          placeholder="e.g. Postural Orthostatic Tachycardia Syndrome"
        />
        <AppInput
          label="Brief Description *"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the condition and what the group would support..."
          multiline
        />
        <AppInput
          label="Estimated Affected Population"
          value={population}
          onChangeText={setPopulation}
          placeholder="e.g. ~3 million in the US; affects mostly young women..."
        />
        <AppInput
          label="Why does this group need to exist? *"
          value={reason}
          onChangeText={setReason}
          placeholder="Share your personal experience or why this community is needed..."
          multiline
        />
        <AppInput
          label="Medical References (optional)"
          value={references}
          onChangeText={setReferences}
          placeholder="Links to medical organizations, research papers, or patient advocacy groups..."
          multiline
        />

        {/* Reviewer Tip */}
        <View style={styles.notice}>
          <Image
            source={imagePath.AlertIcon}
            style={[styles.infoIcon, { tintColor: colors.success }]}
          />
          <Text style={styles.noticeText}>
            Please be as specific as possible. The more context you provide,
            the faster our reviewers can assess the request.
          </Text>
        </View>

        <Text style={styles.progressHint}>
          {canSubmit
            ? "All required fields complete — ready to submit."
            : `${filledCount} of 3 required fields filled`}
        </Text>
        <PrimaryButton title="Submit for Review" onPress={handleSubmit} disabled={!canSubmit} />
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      paddingBottom: moderateVerticalScale(40),
    },
    progressHint: {
      textAlign: "center",
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      marginBottom: moderateVerticalScale(10),
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: moderateVerticalScale(16),
    },
    headerTextWrap: {
      flex: 1,
      marginLeft: moderateScale(8),
    },
    title: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    sub: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      fontWeight: "500",
      marginTop: moderateVerticalScale(2),
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.lightPurple,
      borderRadius: radius.md,
      padding: moderateScale(14),
      marginBottom: moderateVerticalScale(20),
      gap: moderateScale(10),
    },
    infoIcon: {
      width: moderateScale(18),
      height: moderateScale(18),
      resizeMode: "contain",
      marginTop: moderateVerticalScale(2),
    },
    infoText: {
      flex: 1,
      color: colors.primary,
      fontSize: TextStyles.caption,
      lineHeight: scale(18),
    },
    notice: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.lightGreen,
      borderRadius: radius.md,
      padding: moderateScale(14),
      marginTop: moderateVerticalScale(4),
      marginBottom: moderateVerticalScale(20),
      gap: moderateScale(10),
    },
    noticeText: {
      flex: 1,
      color: colors.success,
      fontSize: TextStyles.caption,
      lineHeight: scale(18),
    },
  });
