import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import AppToggle from "../../components/ui/AppToggle";
import TagChip from "../../components/ui/TagChip"; // Assuming you still have this to display the typed tags
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const [warning, setWarning] = useState(false);

  // New States for tags and groups
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");

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
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>New Post</Text>
            <Text style={styles.sub}>
              {selectedGroup ? `Sharing to ${selectedGroup}` : "Sharing to My Feed"}
            </Text>
          </View>
          <Pressable style={styles.postBtn}>
            <Text style={styles.postText}>Post</Text>
          </Pressable>
        </View>

        {/* Group Selection Row (Replaced Author Row) */}
        <Pressable style={styles.groupSelectRow}>
          <View style={styles.groupSelectInfo}>
            <Text style={styles.groupSelectLabel}>Posting to</Text>
            <Text style={styles.groupSelectValue}>
              {selectedGroup ? selectedGroup : "My Feed (No Group)"}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* Editor Container */}
        <View style={styles.editor}>

          {/* Media Toolbar (Moved Above Inputs) */}
          <View style={styles.mediaToolbar}>
            <Pressable style={styles.mediaBtn}>
              <Text style={styles.mediaIcon}>🖼</Text>
              <Text style={styles.mediaBtnText}>Image</Text>
            </Pressable>
            <Pressable style={styles.mediaBtn}>
              <Text style={styles.mediaIcon}>🎥</Text>
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
            placeholderTextColor="#919BB0"
            style={styles.titleInput}
          />
          <View style={styles.line} />
          <TextInput
            multiline
            placeholder="Share your experience, question, or update. This community understands..."
            placeholderTextColor="#B0B8C8"
            style={styles.bodyInput}
          />
        </View>

        {/* Custom Tag Input Area */}
        <Text style={styles.sectionLabel}>Add tags (optional)</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            placeholder="Type a tag and press enter..."
            placeholderTextColor="#919BB0"
            value={currentTag}
            onChangeText={setCurrentTag}
            onSubmitEditing={handleAddTag} // Adds tag when user hits return/enter
            blurOnSubmit={false} // Keeps keyboard open to type multiple tags
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
            <Text style={styles.optTitle}>⚠ Content warning</Text>
            <Text style={styles.optSub}>For sensitive or difficult topics</Text>
          </View>
          <AppToggle value={warning} onValueChange={setWarning} />
        </View>

        {/* Tag Member Action */}
        <Pressable style={styles.optionSimple}>
          <Text style={styles.simpleIcon}>🏷</Text>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    color: "#6F87A6",
    fontSize: TextStyles.caption,
    fontWeight: "500",
    marginTop: moderateVerticalScale(2)
  },
  postBtn: {
    backgroundColor: "#5714ff",
    borderRadius: radius.md,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    shadowColor: "#7453C8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  postText: {
    color: colors.white,
    fontWeight: "500",
    fontSize: TextStyles.caption,
  },

  // Group Selection Row
  groupSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateVerticalScale(12),
    borderTopWidth: 0.2,
    borderBottomWidth: 0.2,
    borderColor: "#b8bbc0",
    justifyContent: "space-between"
  },
  groupSelectInfo: {
    flex: 1,
  },
  groupSelectLabel: {
    color: "#6F87A6",
    fontSize: TextStyles.caption,
    marginBottom: moderateVerticalScale(2)
  },
  groupSelectValue: {
    fontSize: TextStyles.body,
    fontWeight: "500",
    color: colors.text
  },
  chevron: {
    fontSize: scale(24),
    color: "#6F87A6",
    paddingRight: moderateScale(4)
  },

  // Editor Area
  editor: {
    minHeight: moderateVerticalScale(280),
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: moderateScale(16),
    marginTop: moderateVerticalScale(16),
    borderWidth: 0.2,
    borderColor: "#b8bbc0"
  },
  // Media Toolbar inside Editor
  mediaToolbar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateVerticalScale(16),
    paddingBottom: moderateVerticalScale(12),
    borderBottomWidth: 0.2,
    borderBottomColor: "#E2E8F0",
    gap: moderateScale(16)
  },
  mediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFC",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateVerticalScale(6),
    borderRadius: radius.sm,
    borderWidth: 0.2,
    borderColor: "#E2E8F0",
  },
  mediaIcon: {
    fontSize: scale(14),
    marginRight: moderateScale(6)
  },
  mediaBtnText: {
    fontSize: TextStyles.caption,
    fontWeight: "500",
    color: "#4A5568"
  },
  titleInput: {
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text,
  },
  line: {
    height: 0.3,
    backgroundColor: "#b8bbc0",
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
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
    borderRadius: radius.md,
    paddingHorizontal: moderateScale(12),
    backgroundColor: colors.white,
    marginBottom: moderateVerticalScale(12)
  },
  tagInput: {
    flex: 1,
    height: moderateVerticalScale(44),
    fontSize: TextStyles.body,
    color: colors.text,
  },
  addTagBtn: {
    backgroundColor: "#E9E3FB",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    borderRadius: radius.sm,
  },
  addTagBtnText: {
    color: "#7453C8",
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
    borderTopWidth: 0.2,
    borderTopColor: "#b8bbc0"
  },
  optionTextWrap: {
    flex: 1,
  },
  optTitle: {
    fontSize: TextStyles.body,
    fontWeight: "500",
    color: colors.text
  },
  optSub: {
    color: "#6F87A6",
    fontSize: TextStyles.caption,
    marginTop: moderateVerticalScale(2)
  },

  // Simple Action Buttons
  optionSimple: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateVerticalScale(12),
    borderTopWidth: 0.2,
    borderTopColor: "#b8bbc0"
  },
  simpleIcon: {
    fontSize: scale(20),
    marginRight: moderateScale(10)
  },
  simpleText: {
    fontSize: TextStyles.body,
    fontWeight: "500",
    color: colors.text
  },

  // Notice Box
  notice: {
    backgroundColor: "#F9FAFC",
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
    borderRadius: radius.md,
    padding: moderateScale(8),
    marginTop: moderateVerticalScale(6)
  },
  noticeText: {
    color: "#6F87A6",
    fontSize: TextStyles.caption,
    lineHeight: scale(16)
  },
});