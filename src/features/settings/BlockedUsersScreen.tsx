import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import UserAvatar from "../../components/ui/UserAvatar";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

type BlockedUser = { id: string; name: string; avatarColor: string };

/** Settings → Blocked users: list + one-tap unblock. */
export default function BlockedUsersScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const { data: blocked, setData, loading } = useLiveOrDemo<BlockedUser[]>(
    () => resourcesApi.getBlockedUsers(),
    [],
  );

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert("Unblock?", `${user.name} will be able to find and message you again.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        onPress: async () => {
          try {
            await resourcesApi.unblockUser(user.id);
            setData(blocked.filter((u) => u.id !== user.id));
          } catch (err) {
            Alert.alert("Couldn't unblock", apiErrorMessage(err));
          }
        },
      },
    ]);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <BackButton />
        <Text style={styles.headerTitle}>Blocked users</Text>
      </View>

      <FlatList
        data={blocked}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? "Loading…" : "You haven't blocked anyone. People you block can't search, message or send you Sathi requests."}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <UserAvatar initials={initials(item.name)} size={44} />
            <Text style={styles.name}>{item.name}</Text>
            <Pressable style={styles.unblockBtn} onPress={() => handleUnblock(item)} hitSlop={6}>
              <Text style={styles.unblockText}>Unblock</Text>
            </Pressable>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(12),
      marginBottom: moderateVerticalScale(8),
    },
    name: {
      flex: 1,
      marginLeft: moderateScale(12),
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
    },
    unblockBtn: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.danger,
      borderRadius: radius.xl,
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(6),
    },
    unblockText: {
      color: colors.danger,
      fontWeight: "600",
      fontSize: TextStyles.caption,
    },
    emptyText: {
      textAlign: "center",
      color: colors.mutedText,
      marginTop: moderateVerticalScale(40),
      fontSize: TextStyles.body,
      lineHeight: moderateVerticalScale(22),
      paddingHorizontal: moderateScale(20),
    },
  });
