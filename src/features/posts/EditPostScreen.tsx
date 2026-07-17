import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import type { Post } from "../../components/ui/PostCard";

/**
 * Edit your own post (title + text). Photos and where it was posted stay fixed —
 * the backend enforces the same rule. Every feed refetches on focus, so the
 * change is visible the moment you're back.
 */
export default function EditPostScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const post: Post = route.params?.post;
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      Alert.alert("Post can't be empty", "Write something, or delete the post instead.");
      return;
    }
    setIsSaving(true);
    try {
      await resourcesApi.updatePost(post.id, { title: title.trim(), content: trimmed });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't save changes", apiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <BackButton />
            <Text style={styles.headerTitle}>Edit post</Text>
          </View>

          <Text style={styles.label}>Title (optional)</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Add a title..."
            placeholderTextColor={colors.mutedText}
            maxLength={200}
          />

          <Text style={styles.label}>Post</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Share your experience..."
            placeholderTextColor={colors.mutedText}
            multiline
            maxLength={5000}
          />

          <Text style={styles.note}>
            Photos and the place you posted to can't be changed — delete and repost for that.
          </Text>

          <PrimaryButton
            title={isSaving ? "Saving..." : "Save Changes"}
            onPress={save}
            disabled={isSaving}
          />
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(16),
    },
    headerTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    label: {
      color: colors.text,
      fontSize: TextStyles.body,
      fontWeight: "600",
      marginBottom: moderateVerticalScale(8),
    },
    titleInput: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      color: colors.text,
      fontSize: TextStyles.body,
      padding: moderateScale(12),
      marginBottom: moderateVerticalScale(16),
    },
    contentInput: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      color: colors.text,
      fontSize: TextStyles.body,
      lineHeight: scale(20),
      padding: moderateScale(12),
      minHeight: moderateVerticalScale(160),
      textAlignVertical: "top",
      marginBottom: moderateVerticalScale(10),
    },
    note: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      marginBottom: moderateVerticalScale(16),
    },
  });
