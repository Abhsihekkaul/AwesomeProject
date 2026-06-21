import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import TagChip from "../../components/ui/TagChip";
import AppToggle from "../../components/ui/AppToggle";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const [anonymous, setAnonymous] = useState(false);
  const [warning, setWarning] = useState(false);
  const tags = ["💙 Vent", "🌟 Win", "❓ Question", "💡 Tip", "🌙 Sleep", "💊 Meds"];

  return (
    <ScreenWrapper>
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>New Post</Text>
          <Text style={styles.sub}>Sharing to Fibromyalgia Warriors</Text>
        </View>
        <Pressable style={styles.postBtn}>
          <Text style={styles.postText}>✈ Post</Text>
        </Pressable>
      </View>

      <View style={styles.authorRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>S</Text></View>
        <View>
          <Text style={styles.authorName}>Sarah</Text>
          <Text style={styles.authorSub}>Visible to group members</Text>
        </View>
      </View>

      <View style={styles.editor}>
        <TextInput placeholder="What's on your mind? Give it a title..." placeholderTextColor="#919BB0" style={styles.titleInput} />
        <View style={styles.line} />
        <TextInput
          multiline
          placeholder="Share your experience, question, or update. This community understands..."
          placeholderTextColor="#B0B8C8"
          style={styles.bodyInput}
        />
      </View>

      <Text style={styles.sectionLabel}>Add a tag (optional)</Text>
      <View style={styles.tagsWrap}>
        {tags.map((t) => <TagChip key={t} label={t} />)}
      </View>

      <View style={styles.optionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.optTitle}>👁 Post anonymously</Text>
          <Text style={styles.optSub}>Your name won't appear</Text>
        </View>
        <AppToggle value={anonymous} onValueChange={setAnonymous} />
      </View>

      <View style={styles.optionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.optTitle}>⚠ Content warning</Text>
          <Text style={styles.optSub}>For sensitive or difficult topics</Text>
        </View>
        <AppToggle value={warning} onValueChange={setWarning} />
      </View>

      <Pressable style={styles.optionSimple}>
        <Text style={styles.simpleIcon}>🖼</Text>
        <Text style={styles.simpleText}>Attach image</Text>
      </Pressable>

      <Pressable style={styles.optionSimple}>
        <Text style={styles.simpleIcon}>🏷</Text>
        <Text style={styles.simpleText}>Tag another member</Text>
      </Pressable>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          🛡 Safe space reminder: Be kind and supportive. Do not share personal medical data publicly.
        </Text>
      </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  back: { fontSize: 36, color: colors.text, marginRight: 8 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  sub: { color: "#6F87A6", fontSize: scale(16), marginTop: 4 },
  postBtn: { backgroundColor: "#EAF1FF", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
  postText: { color: "#6F87A6", fontWeight: "800" },
  authorRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E3EAF4" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#E9E3FB", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#7453C8", fontWeight: "800", fontSize: 18 },
  authorName: { fontSize: 18, fontWeight: "800", color: colors.text },
  authorSub: { color: "#6F87A6", marginTop: 3 },
  editor: { minHeight: 360, backgroundColor: colors.white, borderRadius: 24, padding: 18, marginTop: 8, borderWidth: 1, borderColor: "#E3EAF4" },
  titleInput: { fontSize: 24, fontWeight: "800", color: colors.text, padding: 0 },
  line: { height: 1, backgroundColor: "#E3EAF4", marginVertical: 18 },
  bodyInput: { minHeight: 250, fontSize: 18, lineHeight: 28, color: colors.text, textAlignVertical: "top" },
  sectionLabel: { color: "#6F87A6", fontWeight: "800", fontSize: scale(16), marginTop: 18, marginBottom: 10 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap" },
  optionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#E3EAF4" },
  optTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  optSub: { color: "#6F87A6", marginTop: 3 },
  optionSimple: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  simpleIcon: { fontSize: scale(20), marginRight: 10 },
  simpleText: { fontSize: 18, fontWeight: "700", color: colors.text },
  notice: { backgroundColor: "#EAF1FF", borderRadius: 18, padding: 14, marginTop: 8 },
  noticeText: { color: "#4E79C7", fontSize: scale(14), lineHeight: 22 },
});