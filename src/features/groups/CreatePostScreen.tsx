import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { captureImageAsDataUri, pickImagesAsDataUri } from "../../utils/pickImage";
import UserAvatar from "../../components/ui/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { useTheme } from "../../theme/ThemeContext";
import PrimaryButton from "../../components/ui/PrimaryButton";
import AppToggle from "../../components/ui/AppToggle";
import TagChip from "../../components/ui/TagChip";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

const BODY_MAX = 5000;
// Hard cap, enforced by the backend too: a post carries at most 10 photos.
const MAX_PHOTOS = 10;

// Demo-mode destinations (signed out) — mirrors the groups demo data.
const DEMO_GROUPS = [
  { id: "g1", name: "Fibromyalgia Warriors", joined: true },
  { id: "g2", name: "Type 2 Diabetes", joined: true },
];

/**
 * Composer. A post can go to several destinations at once — the personal feed
 * and/or any groups the author has joined — and carry one gallery image
 * (base64 MVP until cloud media storage lands; videos say so honestly).
 */
export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [warning, setWarning] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");

  // Opened from a group's "+ Post" FAB → that group starts selected (and the feed
  // doesn't), so the post lands where the user is standing.
  const presetGroupId: string | undefined = route.params?.groupId;

  // Destinations: the personal feed and/or joined groups (multi-select chips).
  const [toFeed, setToFeed] = useState(!presetGroupId);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    presetGroupId ? [presetGroupId] : [],
  );

  // Attached photos (up to MAX_PHOTOS) as base64 data-URIs — they render as a
  // swipeable carousel once posted.
  const [images, setImages] = useState<string[]>([]);

  const [customTags, setCustomTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");

  const { user, isAuthenticated } = useAuth();
  const [isPosting, setIsPosting] = useState(false);

  const { data: myGroups } = useLiveOrDemo(
    async () => (await resourcesApi.getGroups()).filter((g: any) => g.joined),
    DEMO_GROUPS,
  );

  const authorName = user?.name ?? "You";
  const authorInitials = authorName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const toggleGroup = (id: string) =>
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  const selectedGroupNames = myGroups
    .filter((g: any) => selectedGroupIds.includes(g.id))
    .map((g: any) => g.name);
  const destinationSummary = [...(toFeed ? ["My Feed"] : []), ...selectedGroupNames];

  const canPost =
    postTitle.trim().length > 0 &&
    postBody.trim().length > 0 &&
    destinationSummary.length > 0 &&
    !isPosting;

  const remainingPhotoSlots = () => {
    const remaining = MAX_PHOTOS - images.length;
    if (remaining <= 0) {
      Alert.alert(
        "Photo limit reached",
        `A post can carry at most ${MAX_PHOTOS} photos. Remove one to add another.`,
      );
    }
    return remaining;
  };

  const handlePickImage = async () => {
    const remaining = remainingPhotoSlots();
    if (remaining <= 0) return;
    const picked = await pickImagesAsDataUri(remaining);
    if (picked.length) setImages((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
  };

  // Take a photo right now and attach it — no round trip through the gallery.
  const handleCaptureImage = async () => {
    if (remainingPhotoSlots() <= 0) return;
    const uri = await captureImageAsDataUri();
    if (uri) setImages((prev) => [...prev, uri].slice(0, MAX_PHOTOS));
  };

  const removeImage = (uri: string) => setImages((prev) => prev.filter((u) => u !== uri));

  const handlePickVideo = () => {
    Alert.alert(
      "Videos are coming soon",
      "Video uploads arrive with cloud media storage (next on the roadmap). Photos work today!",
    );
  };

  const handlePost = async () => {
    if (!canPost) {
      Alert.alert(
        "Almost there",
        destinationSummary.length === 0
          ? "Pick at least one place to share to — your feed or a group."
          : "Give your post a title and share a few words before posting.",
      );
      return;
    }

    // Signed in → persist through the API; signed out (demo) → local success flow.
    if (isAuthenticated) {
      setIsPosting(true);
      try {
        await resourcesApi.createPost({
          title: postTitle.trim(),
          content: postBody.trim(),
          tags: customTags,
          contentWarning: warning,
          toFeed,
          groupIds: selectedGroupIds,
          images: images.length ? images : undefined,
        });
      } catch (err) {
        Alert.alert("Couldn't post", apiErrorMessage(err));
        setIsPosting(false);
        return;
      }
      setIsPosting(false);
    }

    const where = destinationSummary.join(", ");
    Alert.alert("Posted 🎉", `Your post is now live in: ${where}.`, [
      { text: "Done", onPress: () => navigation.goBack() },
    ]);
  };

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
            <Text style={styles.sub} numberOfLines={1}>
              {destinationSummary.length > 0
                ? `Sharing to ${destinationSummary.join(" · ")}`
                : "Choose where to share below"}
            </Text>
          </View>
          <PrimaryButton title="Post" onPress={handlePost} size="compact" disabled={!canPost} />
        </View>

        {/* Author row */}
        <View style={styles.groupSelectRow}>
          <UserAvatar initials={authorInitials} uri={user?.avatarUrl} size={40} />
          <View style={styles.groupSelectInfo}>
            <Text style={styles.groupSelectValue}>{authorName}</Text>
            <Text style={styles.groupSelectLabel}>Posting publicly to your community</Text>
          </View>
        </View>

        {/* Destination chips: My Feed + every joined group (multi-select) */}
        <Text style={styles.sectionLabel}>Share to</Text>
        <View style={styles.destinationWrap}>
          <TagChip label="My Feed" active={toFeed} onPress={() => setToFeed(!toFeed)} />
          {myGroups.map((g: any) => (
            <TagChip
              key={g.id}
              label={g.name}
              active={selectedGroupIds.includes(g.id)}
              onPress={() => toggleGroup(g.id)}
            />
          ))}
        </View>
        {myGroups.length === 0 ? (
          <Text style={styles.destinationHint}>
            Join groups from the Groups tab to share your post there too.
          </Text>
        ) : null}

        {/* Editor */}
        <View style={styles.editor}>
          <View style={styles.mediaToolbar}>
            <Pressable style={styles.mediaBtn} onPress={handlePickImage}>
              <Image source={imagePath.UploadIcon} style={styles.mediaIcon} />
              <Text style={styles.mediaBtnText}>
                {images.length > 0 ? `Photos ${images.length}/${MAX_PHOTOS}` : "Photos"}
              </Text>
            </Pressable>
            <Pressable style={styles.mediaBtn} onPress={handleCaptureImage}>
              <Image source={imagePath.CameraIcon} style={styles.mediaIcon} />
              <Text style={styles.mediaBtnText}>Camera</Text>
            </Pressable>
            <Pressable style={styles.mediaBtn} onPress={handlePickVideo}>
              <Image source={imagePath.VideoIcon} style={styles.mediaIcon} />
              <Text style={styles.mediaBtnText}>Video</Text>
            </Pressable>
          </View>

          <TextInput
            placeholder="What's on your mind? Give it a title..."
            placeholderTextColor={colors.mutedText}
            style={styles.titleInput}
            value={postTitle}
            onChangeText={setPostTitle}
            maxLength={200}
          />
          <View style={styles.line} />
          <TextInput
            multiline
            placeholder="Share your experience, question, or update. This community understands..."
            placeholderTextColor={colors.mutedText}
            style={styles.bodyInput}
            value={postBody}
            onChangeText={setPostBody}
            maxLength={BODY_MAX}
          />

          {/* Attached photos: thumbnail strip, each removable, capped at MAX_PHOTOS */}
          {images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageStrip}
              keyboardShouldPersistTaps="handled"
            >
              {images.map((uri) => (
                <View key={uri.slice(-32)} style={styles.imageThumbWrap}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <Pressable style={styles.imageRemoveBtn} onPress={() => removeImage(uri)} hitSlop={8}>
                    <Text style={styles.imageRemoveText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <Text style={styles.charCount}>
            {postBody.length}/{BODY_MAX}
          </Text>
        </View>

        {/* Tags */}
        <Text style={styles.sectionLabel}>Add tags (optional)</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            placeholder="Type a tag and press enter..."
            placeholderTextColor={colors.mutedText}
            value={currentTag}
            onChangeText={setCurrentTag}
            onSubmitEditing={handleAddTag}
            submitBehavior="submit"
          />
          <Pressable style={styles.addTagBtn} onPress={handleAddTag}>
            <Text style={styles.addTagBtnText}>Add</Text>
          </Pressable>
        </View>

        {customTags.length > 0 && (
          <View style={styles.tagsWrap}>
            {customTags.map((t) => (
              <Pressable key={t} onPress={() => removeTag(t)}>
                <TagChip label={`${t}  ✕`} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Content warning */}
        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <View style={styles.optTitleRow}>
              <Image source={imagePath.AlertIcon} style={styles.alertIcon} />
              <Text style={styles.optTitle}>Content warning</Text>
            </View>
            <Text style={styles.optSub}>For sensitive or difficult topics</Text>
          </View>
          <AppToggle value={warning} onValueChange={setWarning} />
        </View>

        {/* Notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            🛡 Safe space reminder: Be kind and supportive. Do not share personal medical data publicly.
          </Text>
        </View>

        <View style={{ height: moderateVerticalScale(30) }} />
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

  // Author row
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

  // Destination chips
  destinationWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  destinationHint: {
    color: colors.mutedText,
    fontSize: TextStyles.caption,
    marginTop: moderateVerticalScale(8),
  },

  // Editor
  editor: {
    minHeight: moderateVerticalScale(260),
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: moderateScale(16),
    marginTop: moderateVerticalScale(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
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
    minHeight: moderateVerticalScale(150),
    fontSize: TextStyles.body,
    color: colors.text,
    textAlignVertical: "top",
  },
  imageStrip: {
    marginTop: moderateVerticalScale(12),
  },
  imageThumbWrap: {
    marginRight: moderateScale(10),
  },
  imageThumb: {
    width: moderateScale(92),
    height: moderateScale(92),
    borderRadius: radius.md,
    resizeMode: "cover",
  },
  imageRemoveBtn: {
    position: "absolute",
    top: moderateScale(8),
    right: moderateScale(8),
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.xl,
    width: moderateScale(26),
    height: moderateScale(26),
    alignItems: "center",
    justifyContent: "center",
  },
  imageRemoveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: scale(12),
  },
  charCount: {
    alignSelf: "flex-end",
    color: colors.mutedText,
    fontSize: TextStyles.caption,
    marginTop: moderateVerticalScale(8),
    fontVariant: ["tabular-nums"],
  },

  // Tags
  sectionLabel: {
    color: colors.text,
    fontWeight: "500",
    fontSize: TextStyles.body,
    marginTop: moderateVerticalScale(16),
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

  // Content warning row
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
  alertIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(6),
    tintColor: colors.mutedText,
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

  // Notice
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
