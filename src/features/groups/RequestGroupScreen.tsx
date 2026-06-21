import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

function Field({ label, placeholder, multiline }: { label: string; placeholder: string; multiline?: boolean }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#A0A9BA"
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

export default function RequestGroupScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
    <ScrollView  contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Request New Group</Text>
          <Text style={styles.sub}>For medical review & approval</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ New groups are reviewed by our medical team to ensure they serve a real need and maintain community safety. Review typically takes 2–5 business days.
        </Text>
      </View>

      <Field label="Condition / Disease Name *" placeholder="e.g. Postural Orthostatic Tachycardia Syndrome" />
      <Field label="Brief Description *" placeholder="Describe the condition and what the group would support..." multiline />
      <Field label="Estimated Affected Population" placeholder="e.g. ~3 million in the US; affects mostly young women..." />
      <Field label="Why does this group need to exist? *" placeholder="Share your personal experience or why this community is needed..." multiline />
      <Field label="Medical References (optional)" placeholder="Links to medical organizations, research papers, or patient advocacy groups..." multiline />

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          ⚠ Please be as specific as possible. The more context you provide, the faster our reviewers can assess the request.
        </Text>
      </View>

      <View style={{ height: 18 }} />
      <PrimaryButton title="Submit for Review" onPress={() => {}} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  back: { fontSize: 36, color: colors.text, marginRight: 8 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  sub: { color: "#6F87A6", fontSize: scale(16), marginTop: 4 },
  infoBox: { backgroundColor: "#EAF1FF", borderRadius: 22, padding: 16, marginBottom: 18 },
  infoText: { color: "#4E79C7", fontSize: scale(16), lineHeight: 24 },
  label: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 10 },
  input: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E3EAF4",
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: scale(16),
  },
  textArea: { minHeight: 110, textAlignVertical: "top", paddingTop: 14 },
  notice: { backgroundColor: "#E8F6EE", borderRadius: 18, padding: 14, marginTop: 8 },
  noticeText: { color: "#4FA57B", fontSize: scale(14), lineHeight: 22 },
});