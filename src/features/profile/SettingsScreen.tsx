import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import AppToggle from "../../components/ui/AppToggle";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { useChatNotifications } from "../../context/ChatNotificationsContext";
import { useTheme, ThemeMode } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";
import { useT } from "../../i18n";

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { colors, mode, setMode } = useTheme();
  const { signOut, user, isAuthenticated } = useAuth();
  const styles = makeStyles(colors);
  const t = useT();

  const [publicProfile, setPublicProfile] = useState(false);
  const [showConditions, setShowConditions] = useState(true);
  const [anonymousPosts, setAnonymousPosts] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [research, setResearch] = useState(false);

  const [groupActivity, setGroupActivity] = useState(true);
  const [replies, setReplies] = useState(true);
  const [matches, setMatches] = useState(true);
  const [consultants, setConsultants] = useState(false);

  // The one notification toggle that's fully real: off = no message popups and no
  // Notifications-page entries (saved on the account; unread badges still count).
  const { notificationsEnabled, setNotificationsEnabled } = useChatNotifications();

  const SettingRow = ({
    title,
    subtitle,
    value,
    onChange,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <AppToggle value={value} onValueChange={onChange} />
      </View>

      <View style={styles.divider} />
    </>
  );

  // Navigation row. `screen` routes there; rows without a destination yet keep the
  // "coming soon" alert so nothing looks silently broken.
  const NavRow = ({
    title,
    subtitle,
    screen,
    needsAccount = true,
    last,
  }: {
    title: string;
    subtitle?: string;
    screen?: string;
    needsAccount?: boolean;
    last?: boolean;
  }) => (
    <>
      <Pressable
        style={styles.row}
        onPress={() => {
          if (!screen) {
            Alert.alert(title, "This screen is coming soon — the design is reserved here so nothing gets forgotten.");
            return;
          }
          if (needsAccount && !isAuthenticated) {
            Alert.alert("Sign in required", "Account settings are available once you're signed in.");
            return;
          }
          navigation.navigate(screen);
        }}
      >
        <View style={styles.rowTextWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Image source={imagePath.RightIcon} style={styles.chevron} />
      </Pressable>
      {!last ? <View style={styles.divider} /> : null}
    </>
  );

  const handleSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "There's no account to delete in demo mode.");
      return;
    }
    // The real flow (password confirmation + final warning) lives on its own screen.
    navigation.navigate("DeleteAccount");
  };

  const modeOptions: { key: ThemeMode; label: string }[] = [
    { key: "system", label: t("themeSystem") },
    { key: "light", label: t("themeLight") },
    { key: "dark", label: t("themeDark") },
  ];

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.headerTitle}>{t("settings")}</Text>
        </View>

        {/* ACCOUNT */}

        <View style={styles.card}>
          <Text style={styles.section}>{t("sectionAccount")}</Text>
          <NavRow title={t("editProfile")} subtitle={t("editProfileHint")} screen="EditProfile" />
          <NavRow title={t("changeEmail")} subtitle={user?.email ?? "Sign in to manage your email"} screen="ChangeEmail" />
          <NavRow title={t("changePassword")} subtitle={t("changePasswordHint")} screen="ChangePassword" />
          <NavRow title={t("blockedUsers")} subtitle={t("blockedUsersHint")} screen="BlockedUsers" />
          <NavRow title={t("language")} subtitle={t("languageHint")} screen="Language" needsAccount={false} last />
        </View>

        {/* ADMIN — only rendered for superusers (role "admin"); the backend enforces it too */}
        {user?.role === "admin" ? (
          <View style={styles.card}>
            <Text style={styles.section}>{t("sectionAdmin")}</Text>
            <NavRow
              title="Review queue"
              subtitle="Approve group proposals & consultant applications"
              screen="AdminReview"
              last
            />
          </View>
        ) : null}

        {/* APPEARANCE */}

        <View style={styles.card}>
          <Text style={styles.section}>{t("sectionAppearance")}</Text>

          <View style={styles.modeRow}>
            {modeOptions.map((opt) => {
              const active = mode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setMode(opt.key)}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                >
                  <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* PRIVACY */}

        <View style={styles.card}>
          <Text style={styles.section}>
            PRIVACY & VISIBILITY
          </Text>

          <SettingRow
            title="Public profile"
            subtitle="Others can view your profile"
            value={publicProfile}
            onChange={setPublicProfile}
          />

          <SettingRow
            title="Show my conditions"
            subtitle="Visible on your profile"
            value={showConditions}
            onChange={setShowConditions}
          />

          <SettingRow
            title="Anonymous posts by default"
            subtitle="Hide your name on new posts"
            value={anonymousPosts}
            onChange={setAnonymousPosts}
          />

          <SettingRow
            title="Usage analytics"
            subtitle="Help improve HealCircle"
            value={analytics}
            onChange={setAnalytics}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                Research participation
              </Text>

              <Text style={styles.subtitle}>
                Contribute to anonymized research
              </Text>
            </View>

            <AppToggle value={research} onValueChange={setResearch} />
          </View>
        </View>

        {/* NOTIFICATIONS */}

        <View style={styles.card}>
          <Text style={styles.section}>
            {t("sectionNotifications")}
          </Text>

          <SettingRow
            title={t("chatMessages")}
            subtitle={t("chatMessagesHint")}
            value={notificationsEnabled}
            onChange={setNotificationsEnabled}
          />

          <SettingRow
            title="Group activity"
            subtitle="Updates from your communities"
            value={groupActivity}
            onChange={setGroupActivity}
          />

          <SettingRow
            title="Replies to my posts"
            subtitle="Someone responded to you"
            value={replies}
            onChange={setReplies}
          />

          <SettingRow
            title="New matches"
            subtitle="Compatibility connections"
            value={matches}
            onChange={setMatches}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                Consultant updates
              </Text>

              <Text style={styles.subtitle}>
                Appointment availability
              </Text>
            </View>

            <AppToggle value={consultants} onValueChange={setConsultants} />
          </View>
        </View>

        {/* SUPPORT */}

        <View style={styles.card}>
          <Text style={styles.section}>SUPPORT</Text>
          <NavRow title="Help center" subtitle="FAQs and guides" />
          <NavRow title="Contact us" subtitle="We reply within 24 hours" />
          <NavRow title="Report a problem" subtitle="Something broken or unsafe" last />
        </View>

        {/* ABOUT */}

        <View style={styles.card}>
          <Text style={styles.section}>ABOUT</Text>
          <NavRow title="Community guidelines" />
          <NavRow title="Terms of service" />
          <NavRow title="Privacy policy" />
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.title}>App version</Text>
            </View>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        <PrimaryButton
          title="View Notifications"
          onPress={() => navigation.navigate("Notifications")}
        />

        {/* Sign out / danger zone */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t("signOut")}</Text>
        </Pressable>

        <Pressable onPress={handleDeleteAccount} hitSlop={8}>
          <Text style={styles.deleteText}>{t("deleteMyAccount")}</Text>
        </Pressable>

        <View style={{ height: moderateVerticalScale(40) }} />
      </ScrollView>
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

    card: {
      backgroundColor: colors.card,
      marginBottom: moderateVerticalScale(16),
      borderRadius: radius.md,
      padding: moderateScale(16),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },

    section: {
      color: colors.mutedText,
      fontWeight: "600",
      fontSize: TextStyles.caption,
      letterSpacing: 0.5,
      marginBottom: moderateVerticalScale(16),
    },

    modeRow: {
      flexDirection: "row",
      gap: moderateScale(8),
    },

    modeChip: {
      flex: 1,
      paddingVertical: moderateVerticalScale(10),
      borderRadius: radius.sm,
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },

    modeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    modeChipText: {
      color: colors.mutedText,
      fontWeight: "600",
      fontSize: TextStyles.stepCounts,
    },

    modeChipTextActive: {
      color: colors.white,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: moderateVerticalScale(10),
    },

    title: {
      fontSize: TextStyles.body,
      fontWeight: "500",
      color: colors.text,
    },

    subtitle: {
      color: colors.mutedText,
      marginTop: moderateVerticalScale(4),
      fontSize: TextStyles.caption,
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: moderateVerticalScale(10),
    },

    rowTextWrap: {
      flex: 1,
      paddingRight: moderateScale(12),
    },

    chevron: {
      width: moderateScale(13),
      height: moderateScale(13),
      resizeMode: "contain",
      tintColor: colors.mutedText,
    },

    versionText: {
      color: colors.mutedText,
      fontSize: TextStyles.stepCounts,
      fontVariant: ["tabular-nums"],
    },

    signOutBtn: {
      marginTop: moderateVerticalScale(16),
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.danger,
      paddingVertical: moderateVerticalScale(14),
      alignItems: "center",
    },

    signOutText: {
      color: colors.danger,
      fontWeight: "600",
      fontSize: TextStyles.body,
    },

    deleteText: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      textAlign: "center",
      marginTop: moderateVerticalScale(16),
      textDecorationLine: "underline",
    },
  });
