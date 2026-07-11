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
import { useTheme, ThemeMode } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { colors, mode, setMode } = useTheme();
  const { signOut } = useAuth();
  const styles = makeStyles(colors);

  const [publicProfile, setPublicProfile] = useState(false);
  const [showConditions, setShowConditions] = useState(true);
  const [anonymousPosts, setAnonymousPosts] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [research, setResearch] = useState(false);

  const [groupActivity, setGroupActivity] = useState(true);
  const [replies, setReplies] = useState(true);
  const [matches, setMatches] = useState(true);
  const [consultants, setConsultants] = useState(false);

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

  // Navigation-style row for sections whose destination screens come later.
  const NavRow = ({ title, subtitle, last }: { title: string; subtitle?: string; last?: boolean }) => (
    <>
      <Pressable
        style={styles.row}
        onPress={() => Alert.alert(title, "This screen is coming soon — the design is reserved here so nothing gets forgotten.")}
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
    Alert.alert(
      "Delete account?",
      "This will permanently erase your profile, posts and messages. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Forever", style: "destructive", onPress: () => {} },
      ],
    );
  };

  const modeOptions: { key: ThemeMode; label: string }[] = [
    { key: "system", label: "System" },
    { key: "light", label: "Light" },
    { key: "dark", label: "Dark" },
  ];

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* ACCOUNT */}

        <View style={styles.card}>
          <Text style={styles.section}>ACCOUNT</Text>
          <NavRow title="Edit profile" subtitle="Name, avatar color, conditions" />
          <NavRow title="Change email" subtitle="abhishek@healingsathi.dev" />
          <NavRow title="Change password" subtitle="Last changed 30 days ago" />
          <NavRow title="Blocked users" subtitle="Manage who can't reach you" />
          <NavRow title="Language" subtitle="English" last />
        </View>

        {/* APPEARANCE */}

        <View style={styles.card}>
          <Text style={styles.section}>APPEARANCE</Text>

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
            NOTIFICATIONS
          </Text>

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
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <Pressable onPress={handleDeleteAccount} hitSlop={8}>
          <Text style={styles.deleteText}>Delete my account</Text>
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
