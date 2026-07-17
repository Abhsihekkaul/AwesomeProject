import React, { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { timeAgo } from "../../utils/timeAgo";

type GroupProposal = {
  id: string;
  condition: string;
  description: string;
  population: string;
  reason: string;
  references: string;
  proposedBy: string;
  submittedAt: string;
};

type ConsultantApplication = {
  id: string;
  fullName: string;
  specialty: string;
  credentials: string;
  licenseNumber: string;
  yearsExperience: number;
  bio: string;
  languages: string[];
  applicantEmail: string;
  submittedAt: string;
};

type Styles = ReturnType<typeof makeStyles>;

const DecisionRow = ({
  styles,
  disabled,
  onApprove,
  onReject,
}: {
  styles: Styles;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) => (
  <View style={styles.decisionRow}>
    <Pressable
      style={[styles.decisionBtn, styles.approveBtn, disabled && styles.btnDisabled]}
      disabled={disabled}
      onPress={onApprove}
    >
      <Text style={styles.approveText}>Approve</Text>
    </Pressable>
    <Pressable
      style={[styles.decisionBtn, styles.rejectBtn, disabled && styles.btnDisabled]}
      disabled={disabled}
      onPress={onReject}
    >
      <Text style={styles.rejectText}>Reject</Text>
    </Pressable>
  </View>
);

const Meta = ({ styles, label, value }: { styles: Styles; label: string; value?: string }) =>
  value ? (
    <Text style={styles.meta}>
      <Text style={styles.metaLabel}>{label}: </Text>
      {value}
    </Text>
  ) : null;

/**
 * Superuser review queue (Settings → Admin, role "admin" only).
 * Everything the community proposes goes through a human here before it's live:
 * new support groups and consultant ("join as a doctor") applications.
 */
export default function AdminReviewScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [proposals, setProposals] = useState<GroupProposal[]>([]);
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Ids with an in-flight decision — their buttons lock so a double-tap can't
  // approve twice (the backend would 404 the second call anyway).
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const data = await resourcesApi.getAdminReviews();
      setProposals(data.groupProposals);
      setApplications(data.consultantApplications);
    } catch (err) {
      Alert.alert("Couldn't load the review queue", apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const decide = async (id: string, action: () => Promise<unknown>, confirm: string) => {
    Alert.alert(confirm, "This is visible to the member immediately.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setBusy((prev) => ({ ...prev, [id]: true }));
          try {
            await action();
            await load();
          } catch (err) {
            Alert.alert("Couldn't apply that decision", apiErrorMessage(err));
          } finally {
            setBusy((prev) => ({ ...prev, [id]: false }));
          }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <BackButton />
        <Text style={styles.headerTitle}>Review queue</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.section}>GROUP PROPOSALS ({proposals.length})</Text>
        {!loading && proposals.length === 0 ? (
          <Text style={styles.empty}>Nothing waiting — new proposals land here.</Text>
        ) : null}
        {proposals.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardTitle}>{p.condition}</Text>
            <Text style={styles.cardSub}>
              by {p.proposedBy} • {timeAgo(p.submittedAt)}
            </Text>
            <Meta styles={styles} label="Description" value={p.description} />
            <Meta styles={styles} label="Who it's for" value={p.population} />
            <Meta styles={styles} label="Why it matters" value={p.reason} />
            <Meta styles={styles} label="References" value={p.references} />
            <DecisionRow
              styles={styles}
              disabled={!!busy[p.id]}
              onApprove={() =>
                decide(p.id, () => resourcesApi.approveGroupProposal(p.id), `Approve "${p.condition}"?`)
              }
              onReject={() =>
                decide(p.id, () => resourcesApi.rejectGroupProposal(p.id), `Reject "${p.condition}"?`)
              }
            />
          </View>
        ))}

        <Text style={styles.section}>CONSULTANT APPLICATIONS ({applications.length})</Text>
        {!loading && applications.length === 0 ? (
          <Text style={styles.empty}>Nothing waiting — new applications land here.</Text>
        ) : null}
        {applications.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardTitle}>{a.fullName}</Text>
            <Text style={styles.cardSub}>
              {a.specialty} • {a.yearsExperience} yrs • {timeAgo(a.submittedAt)}
            </Text>
            <Meta styles={styles} label="Credentials" value={a.credentials} />
            <Meta styles={styles} label="License" value={a.licenseNumber} />
            <Meta styles={styles} label="Languages" value={a.languages.join(", ")} />
            <Meta styles={styles} label="Bio" value={a.bio} />
            <Meta styles={styles} label="Email" value={a.applicantEmail} />
            <DecisionRow
              styles={styles}
              disabled={!!busy[a.id]}
              onApprove={() =>
                decide(a.id, () => resourcesApi.approveConsultantApplication(a.id), `Approve ${a.fullName}?`)
              }
              onReject={() =>
                decide(a.id, () => resourcesApi.rejectConsultantApplication(a.id), `Reject ${a.fullName}?`)
              }
            />
          </View>
        ))}

        <View style={{ height: moderateVerticalScale(30) }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: moderateVerticalScale(10),
    },
    headerTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    section: {
      fontSize: TextStyles.caption,
      fontWeight: "700",
      color: colors.mutedText,
      letterSpacing: 0.6,
      marginTop: moderateVerticalScale(16),
      marginBottom: moderateVerticalScale(8),
    },
    empty: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      marginBottom: moderateVerticalScale(4),
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(14),
      marginBottom: moderateVerticalScale(12),
    },
    cardTitle: {
      fontSize: TextStyles.body,
      fontWeight: "700",
      color: colors.text,
    },
    cardSub: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
      marginBottom: moderateVerticalScale(8),
    },
    meta: {
      fontSize: TextStyles.caption,
      color: colors.text,
      lineHeight: scale(18),
      marginBottom: moderateVerticalScale(4),
    },
    metaLabel: {
      color: colors.mutedText,
      fontWeight: "600",
    },
    decisionRow: {
      flexDirection: "row",
      gap: moderateScale(10),
      marginTop: moderateVerticalScale(10),
    },
    decisionBtn: {
      flex: 1,
      alignItems: "center",
      borderRadius: radius.xl,
      paddingVertical: moderateVerticalScale(9),
    },
    approveBtn: {
      backgroundColor: colors.primary,
    },
    rejectBtn: {
      backgroundColor: colors.lightPurple,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    approveText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: TextStyles.caption,
    },
    rejectText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: TextStyles.caption,
    },
  });
