import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import UserAvatar from "../../components/ui/UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import PrimaryButton from "../../components/ui/PrimaryButton";
import AppToggle from "../../components/ui/AppToggle";
import TagChip from "../../components/ui/TagChip"; // Assuming you still have this to display the typed tags
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [warning, setWarning] = useState(false);

  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");

  // New States for tags and groups
  const [selectedGroup, _setSelectedGroup] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");

  const canPost = postTitle.trim().length > 0 && postBody.trim().length > 0;

  const handlePost = () => {
    if (!canPost) {
      Alert.alert("Almost there", "Give your post a title and share a few words before posting.");
      return;
    }
    Alert.alert("Posted 🎉", "Your post is now live in the Healing Stream.", [
      { text: "Done", onPress: () => navigation.goBack() },
    ]);
  };

  // Function to handle adding a typed tag
  const handleAddTag = () => {
    if (currentTag.trim().length > 0 && !customTags.includes(currentTag.trim())) {
      setCustomTags([...customTags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(t => t !== tagToRemove));
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>New Post</Text>
            <Text style={styles.sub}>
              {selectedGroup ? `Sharing to ${selectedGroup}` : "Sharing to My Feed"}
            </Text>
          </View>
          <PrimaryButton title="Post" onPress={handlePost} size="compact" disabled={!canPost} />
        </View>

        {/* Author + destination row */}
        <Pressable style={styles.groupSelectRow}>
          <UserAvatar initials="A" size={40} />
          <View style={styles.groupSelectInfo}>
            <Text style={styles.groupSelectValue}>Abhishek</Text>
            <Text style={styles.groupSelectLabel}>
              Posting to {selectedGroup ? selectedGroup : "My Feed"} ›
            </Text>
          </View>
          <Image
            source={imagePath.RightIcon}
            style={styles.chevronIcon}
          />
        </Pressable>

        {/* Editor Container */}
        <View style={styles.editor}>

          {/* Media Toolbar (Moved Above Inputs) */}
          <View style={styles.mediaToolbar}>
            <Pressable style={styles.mediaBtn}>
              <Image source={imagePath.UploadIcon} style={styles.mediaIcon} />
              <Text style={styles.mediaBtnText}>Image</Text>
            </Pressable>
            <Pressable style={styles.mediaBtn}>
              <Image source={imagePath.VideoIcon} style={styles.mediaIcon} />
              <Text style={styles.mediaBtnText}>Video</Text>
            </Pressable>

            {/* Suggested addition: Attach Link */}
            {/* <Pressable style={styles.mediaBtn}>
              <Text style={styles.mediaIcon}>🔗</Text>
              <Text style={styles.mediaBtnText}>Link</Text>
            </Pressable> */}
          </View>

          <TextInput
            placeholder="What's on your mind? Give it a title..."
            placeholderTextColor={colors.mutedText}
            style={styles.titleInput}
            value={postTitle}
            onChangeText={setPostTitle}
          />
          <View style={styles.line} />
          <TextInput
            multiline
            placeholder="Share your experience, question, or update. This community understands..."
            placeholderTextColor={colors.mutedText}
            style={styles.bodyInput}
            value={postBody}
            onChangeText={setPostBody}
          />
        </View>

        {/* Custom Tag Input Area */}
        <Text style={styles.sectionLabel}>Add tags (optional)</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            placeholder="Type a tag and press enter..."
            placeholderTextColor={colors.mutedText}
            value={currentTag}
            onChangeText={setCurrentTag}
            onSubmitEditing={handleAddTag} // Adds tag when user hits return/enter
            submitBehavior="submit" // Keeps keyboard open to type multiple tags
          />
          <Pressable style={styles.addTagBtn} onPress={handleAddTag}>
            <Text style={styles.addTagBtnText}>Add</Text>
          </Pressable>
        </View>

        {/* Display Added Tags */}
        {customTags.length > 0 && (
          <View style={styles.tagsWrap}>
            {customTags.map((t) => (
              <Pressable key={t} onPress={() => removeTag(t)}>
                <TagChip label={`${t}  ✕`} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Content Warning Toggle */}
        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <View style={styles.optTitleRow}>
              <Image source={imagePath.AlertIcon} style={{ width: 16, height: 16, marginRight: 6, tintColor: colors.mutedText }} />
              <Text style={styles.optTitle}>Content warning</Text>
            </View>
            <Text style={styles.optSub}>For sensitive or difficult topics</Text>
          </View>
          <AppToggle value={warning} onValueChange={setWarning} />
        </View>

        {/* Tag Member Action */}
        <Pressable style={styles.optionSimple}>
          <Image source={imagePath.UserIcon} style={styles.simpleIcon} />
          <Text style={styles.simpleText}>Tag another member</Text>
        </Pressable>

        {/* SUGGESTED ADDITIONS (Commented out for future review) */}
        {/* <Pressable style={styles.optionSimple}>
          <Text style={styles.simpleIcon}>📊</Text>
          <Text style={styles.simpleText}>Create a poll</Text>
        </Pressable>

        <Pressable style={styles.optionSimple}>
          <Text style={styles.simpleIcon}>📍</Text>
          <Text style={styles.simpleText}>Add location</Text>
        </Pressable>
        */}

        {/* Notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            🛡 Safe space reminder: Be kind and supportive. Do not share personal medical data publicly.
          </Text>
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateVerticalScale(8)
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: moderateScale(8)
  },
  title: {
    fontSize: TextStyles.heading,
    fontWeight: "500",
    color: colors.text
  },
  sub: {
    color: colors.mutedText,
    fontSize: TextStyles.caption,
    fontWeight: "500",
    marginTop: moderateVerticalScale(2)
  },

  // Group Selection Row
  groupSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateVerticalScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    justifyContent: "space-between"
  },
  groupSelectInfo: {
    flex: 1,
  },
  groupSelectLabel: {
    color: colors.mutedText,
    fontSize: TextStyles.caption,
    marginBottom: moderateVerticalScale(2)
  },
  groupSelectValue: {
    fontSize: TextStyles.body,
    fontWeight: "500",
    color: colors.text
  },
  chevronIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    resizeMode: "contain",
    tintColor: colors.mutedText,
    marginRight: moderateScale(4),
  },

  // Editor Area
  editor: {
    minHeight: moderateVerticalScale(280),
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: moderateScale(16),
    marginTop: moderateVerticalScale(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  // Media Toolbar inside Editor
  mediaToolbar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateVerticalScale(16),
    paddingBottom: moderateVerticalScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: moderateScale(16)
  },
  mediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightPurple,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    borderRadius: radius.xl,
  },
  mediaIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    resizeMode: "contain",
    tintColor: colors.primary,
    marginRight: moderateScale(6)
  },
  mediaBtnText: {
    fontSize: TextStyles.caption,
    fontWeight: "600",
    color: colors.primary,
  },
  titleInput: {
    fontSize: TextStyles.subtitle,
    fontWeight: "600",
    color: colors.text,
    paddingVertical: moderateVerticalScale(6),
  },
  line: {
    height: 0.3,
    backgroundColor: colors.border,
    marginVertical: moderateVerticalScale(1)
  },

  bodyInput: {
    minHeight: moderateVerticalScale(180),
    fontSize: TextStyles.caption,
    color: colors.text,
    textAlignVertical: "top",
  },

  // Custom Tag Input
  sectionLabel: {
    color: colors.text,
    fontWeight: "500",
    fontSize: TextStyles.body,
    marginTop: moderateVerticalScale(20),
    marginBottom: moderateVerticalScale(10)
  },
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: moderateScale(12),
    backgroundColor: colors.card,
    marginBottom: moderateVerticalScale(12)
  },
  tagInput: {
    flex: 1,
    height: moderateVerticalScale(44),
    fontSize: TextStyles.body,
    color: colors.text,
  },
  addTagBtn: {
    backgroundColor: colors.lightPurple,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    borderRadius: radius.sm,
  },
  addTagBtnText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: scale(12)
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    marginBottom: moderateVerticalScale(10)
  },

  // Options Rows
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateVerticalScale(14),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  optionTextWrap: {
    flex: 1,
  },
  optTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optTitle: {
    fontSize: TextStyles.body,
    fontWeight: "500",
    color: colors.text
  },
  optSub: {
    color: colors.mutedText,
    fontSize: TextStyles.caption,
    marginTop: moderateVerticalScale(2)
  },

  // Simple Action Buttons
  optionSimple: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateVerticalScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  simpleIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    resizeMode: "contain",
    tintColor: colors.mutedText,
    marginRight: moderateScale(10),
  },
  simpleText: {
    fontSize: TextStyles.body,
    fontWeight: "500",
    color: colors.text
  },

  // Notice Box
  notice: {
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: moderateScale(8),
    marginTop: moderateVerticalScale(6)
  },
  noticeText: {
    color: colors.mutedText,
    fontSize: TextStyles.caption,
    lineHeight: scale(16)
  },
});
