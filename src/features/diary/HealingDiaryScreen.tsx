import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import {
  decryptText,
  deriveDiaryKey,
  encryptText,
  makeKeyCheck,
  makeSalt,
  verifyKey,
  type DiaryKey,
} from "../../utils/diaryCrypto";

/**
 * Healing Diary v2 — sealed pages in OUR database, readable by NO ONE but
 * you: every page is encrypted on this phone (AES-256-GCM, key derived from
 * your diary passphrase) before it travels. The server stores ciphertext it
 * cannot open; the same passphrase opens the same pages on the web app.
 * Old device-only entries are imported into the sealed diary on first unlock.
 * (Web twin: HealingSathiWebApp app/(main)/diary.)
 */

const LEGACY_KEY = "healingsathi.diaryEntries";

type SealedEntry = { id: string; ciphertext: string; iv: string; time: string; edited?: boolean };
type OpenEntry = {
  id: string;
  time: string;
  text: string;
  mood?: string;
  edited?: boolean;
  unreadable?: boolean;
};

const MOODS = [
  { key: "calm", label: "Calm", glyph: "🌤" },
  { key: "hopeful", label: "Hopeful", glyph: "🌱" },
  { key: "grateful", label: "Grateful", glyph: "✨" },
  { key: "heavy", label: "Heavy", glyph: "🌧" },
  { key: "anxious", label: "Anxious", glyph: "🌪" },
  { key: "tired", label: "Tired", glyph: "🕯" },
];
const moodOf = (key?: string) => MOODS.find((m) => m.key === key);

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export default function HealingDiaryScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [meta, setMeta] = useState<
    { salt: string; checkCiphertext: string; checkIv: string } | null | undefined
  >(undefined);
  const [checked, setChecked] = useState(false);
  const [key, setKey] = useState<DiaryKey | null>(null);
  const [entries, setEntries] = useState<OpenEntry[]>([]);
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(0);

  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<OpenEntry | null>(null);

  // Peek at whether the diary exists, so the lock screen says the right thing.
  const checkMeta = useCallback(async () => {
    try {
      const { meta: m } = await resourcesApi.getDiary();
      setMeta(m);
    } catch {
      setMeta(null);
    }
    setChecked(true);
  }, []);
  if (isAuthenticated && !checked && meta === undefined) {
    void checkMeta();
  }

  const decryptAll = async (k: DiaryKey, sealed: SealedEntry[]): Promise<OpenEntry[]> =>
    Promise.all(
      sealed.map(async (e) => {
        try {
          const payload = JSON.parse(await decryptText(k, e.ciphertext, e.iv));
          return { id: e.id, time: e.time, text: payload.text ?? "", mood: payload.mood, edited: e.edited };
        } catch {
          // A page from a different passphrase era — shown honestly as sealed.
          return { id: e.id, time: e.time, text: "", unreadable: true };
        }
      }),
    );

  /** Old device-only entries → encrypted pages, then the local copy is cleared. */
  const migrateLegacy = async (k: DiaryKey) => {
    try {
      const raw = await AsyncStorage.getItem(LEGACY_KEY);
      if (!raw) return 0;
      const legacy: { title?: string; body?: string }[] = JSON.parse(raw);
      let count = 0;
      for (const item of legacy) {
        const text = [item.title, item.body].filter(Boolean).join("\n\n");
        if (!text) continue;
        await resourcesApi.addDiaryEntry(await encryptText(k, JSON.stringify({ text })));
        count += 1;
      }
      await AsyncStorage.removeItem(LEGACY_KEY);
      return count;
    } catch {
      return 0;
    }
  };

  const unlock = async () => {
    if (!passphrase || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { meta: fetchedMeta, entries: sealed } = await resourcesApi.getDiary();
      if (!fetchedMeta) {
        if (passphrase.length < 8) {
          setError("Choose a passphrase of at least 8 characters — it is the only key to these pages.");
          return;
        }
        if (passphrase !== confirm) {
          setError("The two passphrases don't match.");
          return;
        }
        const salt = makeSalt();
        const k = await deriveDiaryKey(passphrase, salt);
        const check = await makeKeyCheck(k);
        const created = await resourcesApi.setupDiary({
          salt,
          checkCiphertext: check.ciphertext,
          checkIv: check.iv,
        });
        setMeta(created);
        setKey(k);
        const migrated = await migrateLegacy(k);
        setImported(migrated);
        if (migrated > 0) {
          const { entries: refreshed } = await resourcesApi.getDiary();
          setEntries(await decryptAll(k, refreshed));
        } else {
          setEntries([]);
        }
      } else {
        const k = await deriveDiaryKey(passphrase, fetchedMeta.salt);
        if (!(await verifyKey(k, fetchedMeta.checkCiphertext, fetchedMeta.checkIv))) {
          setError("That passphrase doesn't open this diary.");
          return;
        }
        setMeta(fetchedMeta);
        setKey(k);
        const migrated = await migrateLegacy(k);
        setImported(migrated);
        const { entries: refreshed } = migrated > 0 ? await resourcesApi.getDiary() : { entries: sealed };
        setEntries(await decryptAll(k, refreshed));
      }
      setPassphrase("");
      setConfirm("");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't open the diary"));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const text = draft.trim();
    if (!text || !key || busy) return;
    setBusy(true);
    try {
      const payload = JSON.stringify({ text, mood });
      if (editing) {
        const updated = await resourcesApi.updateDiaryEntry(editing.id, await encryptText(key, payload));
        setEntries((prev) =>
          prev.map((e) => (e.id === editing.id ? { ...e, text, mood, edited: updated.edited } : e)),
        );
        setEditing(null);
      } else {
        const created: SealedEntry = await resourcesApi.addDiaryEntry(await encryptText(key, payload));
        setEntries((prev) => [{ id: created.id, time: created.time, text, mood }, ...prev]);
      }
      setDraft("");
      setMood(undefined);
    } catch (err) {
      Alert.alert("Couldn't seal this page", apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (entry: OpenEntry) => {
    Alert.alert("Burn this page?", "It can't be recovered.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Burn",
        style: "destructive",
        onPress: async () => {
          try {
            await resourcesApi.deleteDiaryEntry(entry.id);
            setEntries((prev) => prev.filter((e) => e.id !== entry.id));
          } catch (err) {
            Alert.alert("Couldn't delete", apiErrorMessage(err));
          }
        },
      },
    ]);
  };

  const lock = () => {
    setKey(null);
    setEntries([]);
    setDraft("");
    setEditing(null);
  };

  const hero = (subtitle: string, showLock: boolean) => (
    <LinearGradient
      colors={["#2b2350", colors.primaryDark, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={heroStyles.hero}
    >
      <View style={heroStyles.glowTop} />
      <View style={heroStyles.glowBottom} />
      <View style={heroStyles.topRow}>
        <Text style={heroStyles.title}>Healing Diary</Text>
        {showLock ? (
          <Pressable onPress={lock} style={heroStyles.lockBtn} hitSlop={6}>
            <Text style={heroStyles.lockBtnText}>🔒 Lock</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={heroStyles.subtitle}>{subtitle}</Text>
      <View style={heroStyles.e2eePill}>
        <Text style={heroStyles.e2eeText}>🔒 End-to-end encrypted — only you hold the key</Text>
      </View>
    </LinearGradient>
  );

  const creating = checked && meta === null;

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.headerTitle}>Healing Diary</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          {!isAuthenticated ? (
            <>
              {hero("A sealed place for the thoughts you don't post. Encrypted on this phone — not even we can read a page.", false)}
              <View style={styles.card}>
                <Text style={styles.mutedCenter}>
                  Sign in to open your diary — the same passphrase unlocks it on every device.
                </Text>
                <PrimaryButton title="Sign In" onPress={() => navigation.navigate("Auth")} />
              </View>
            </>
          ) : !key ? (
            <>
              {hero(
                creating
                  ? "Choose a passphrase to seal your diary. Every page is encrypted on this phone before it travels."
                  : "Your pages are sealed. Enter your diary passphrase to open them.",
                false,
              )}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{creating ? "Create your diary" : "Open your diary"}</Text>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={passphrase}
                  onChangeText={setPassphrase}
                  placeholder={creating ? "A passphrase you'll remember (8+ characters)" : "Your diary passphrase"}
                  placeholderTextColor={colors.mutedText}
                />
                {creating ? (
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Type it once more"
                    placeholderTextColor={colors.mutedText}
                  />
                ) : null}
                {busy ? (
                  <ActivityIndicator color={colors.primary} style={styles.spinner} />
                ) : (
                  <PrimaryButton
                    title={creating ? "Seal my diary" : "Open my diary"}
                    onPress={unlock}
                    disabled={!passphrase || !checked}
                  />
                )}
                <Text style={styles.warnText}>
                  {creating
                    ? "⚠️ The passphrase never leaves your phone and we cannot reset it. If it's forgotten, these pages stay sealed forever — that is what end-to-end encrypted means."
                    : "The passphrase never leaves this phone — it only derives the key that opens your pages here."}
                </Text>
              </View>
            </>
          ) : (
            <>
              {hero(
                `${entries.length === 0 ? "Your first page is waiting." : `${entries.length} sealed page${entries.length === 1 ? "" : "s"}.`} Written for no one but you.`,
                true,
              )}

              {imported > 0 ? (
                <View style={styles.importNote}>
                  <Text style={styles.importNoteText}>
                    {imported} page{imported === 1 ? "" : "s"} from this phone {imported === 1 ? "was" : "were"} sealed
                    into your diary — they now follow your account.
                  </Text>
                </View>
              ) : null}

              {/* Tonight's page */}
              <View style={styles.card}>
                <Text style={styles.kicker}>{editing ? "REWRITING A PAGE" : "TONIGHT'S PAGE"}</Text>
                <View style={styles.moodRow}>
                  {MOODS.map((m) => {
                    const active = mood === m.key;
                    return (
                      <Pressable
                        key={m.key}
                        onPress={() => setMood(active ? undefined : m.key)}
                        style={[styles.moodChip, active && styles.moodChipActive]}
                      >
                        <Text style={[styles.moodChipText, active && styles.moodChipTextActive]}>
                          {m.glyph} {m.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  style={styles.pageInput}
                  multiline
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Let it out — this page is sealed before it leaves your phone..."
                  placeholderTextColor={colors.mutedText}
                  textAlignVertical="top"
                />
                <View style={styles.saveRow}>
                  <PrimaryButton
                    title={busy ? "Sealing..." : editing ? "Reseal page" : "🔒 Seal this page"}
                    onPress={save}
                    disabled={busy || !draft.trim()}
                    size="compact"
                  />
                  {editing ? (
                    <Pressable
                      onPress={() => {
                        setEditing(null);
                        setDraft("");
                        setMood(undefined);
                      }}
                      hitSlop={6}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* The pages */}
              {entries.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.mutedCenter}>Empty for now — and completely yours. 💜</Text>
                </View>
              ) : (
                entries.map((entry) => {
                  const m = moodOf(entry.mood);
                  return (
                    <View key={entry.id} style={styles.entryCard}>
                      <View style={styles.entryTopRow}>
                        <Text style={styles.entryDate}>{dateLabel(entry.time)}</Text>
                        {m ? (
                          <View style={styles.entryMoodPill}>
                            <Text style={styles.entryMoodText}>
                              {m.glyph} {m.label}
                            </Text>
                          </View>
                        ) : null}
                        {entry.edited ? <Text style={styles.editedText}>· edited</Text> : null}
                        <View style={styles.entryActions}>
                          {!entry.unreadable ? (
                            <Pressable
                              onPress={() => {
                                setEditing(entry);
                                setDraft(entry.text);
                                setMood(entry.mood);
                              }}
                              hitSlop={6}
                            >
                              <Text style={styles.entryActionText}>Edit</Text>
                            </Pressable>
                          ) : null}
                          <Pressable onPress={() => remove(entry)} hitSlop={6}>
                            <Text style={[styles.entryActionText, styles.burnText]}>Burn</Text>
                          </Pressable>
                        </View>
                      </View>
                      {entry.unreadable ? (
                        <Text style={styles.unreadableText}>
                          🔒 Sealed with a different passphrase — this page can't be opened with the current one.
                        </Text>
                      ) : (
                        <Text style={styles.entryText}>{entry.text}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const heroStyles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    padding: moderateScale(16),
    overflow: "hidden",
    marginBottom: moderateVerticalScale(12),
  },
  glowTop: {
    position: "absolute",
    top: -moderateScale(45),
    right: -moderateScale(30),
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(75),
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -moderateScale(55),
    left: -moderateScale(30),
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#FFFFFF",
    fontSize: TextStyles.subtitle,
    fontWeight: "800",
  },
  lockBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: moderateScale(11),
    paddingVertical: moderateVerticalScale(4),
  },
  lockBtnText: {
    color: "#FFFFFF",
    fontSize: scale(11),
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: TextStyles.caption,
    lineHeight: scale(17),
    marginTop: moderateVerticalScale(5),
  },
  e2eePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateVerticalScale(4),
    marginTop: moderateVerticalScale(10),
  },
  e2eeText: {
    color: "#FFFFFF",
    fontSize: scale(10),
    fontWeight: "700",
  },
});

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(12),
    },
    headerTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    scrollContent: {
      paddingBottom: moderateVerticalScale(32),
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
      marginBottom: moderateVerticalScale(8),
    },
    errorText: {
      color: colors.danger,
      fontSize: TextStyles.caption,
      marginBottom: moderateVerticalScale(6),
    },
    input: {
      backgroundColor: colors.lightBlue,
      borderRadius: radius.md,
      paddingHorizontal: moderateScale(13),
      paddingVertical: moderateVerticalScale(10),
      fontSize: TextStyles.stepCounts,
      color: colors.text,
      marginBottom: moderateVerticalScale(9),
    },
    spinner: {
      marginVertical: moderateVerticalScale(14),
    },
    warnText: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      lineHeight: scale(16),
      marginTop: moderateVerticalScale(10),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: moderateVerticalScale(10),
    },
    mutedCenter: {
      fontSize: TextStyles.stepCounts,
      color: colors.mutedText,
      textAlign: "center",
      marginBottom: moderateVerticalScale(10),
    },

    importNote: {
      backgroundColor: colors.lightGreen,
      borderRadius: radius.md,
      padding: moderateScale(10),
      marginBottom: moderateVerticalScale(12),
    },
    importNoteText: {
      color: colors.success,
      fontSize: TextStyles.caption,
      fontWeight: "600",
      textAlign: "center",
    },

    kicker: {
      fontSize: scale(9),
      fontWeight: "800",
      letterSpacing: 1,
      color: colors.mutedText,
      marginBottom: moderateVerticalScale(8),
    },
    moodRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(6),
      marginBottom: moderateVerticalScale(9),
    },
    moodChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderRadius: 999,
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateVerticalScale(4),
    },
    moodChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.lightPurple,
    },
    moodChipText: {
      fontSize: scale(10),
      fontWeight: "600",
      color: colors.mutedText,
    },
    moodChipTextActive: {
      color: colors.primary,
    },
    pageInput: {
      minHeight: moderateVerticalScale(110),
      backgroundColor: colors.lightBlue,
      borderRadius: radius.md,
      padding: moderateScale(12),
      fontSize: TextStyles.stepCounts,
      lineHeight: scale(20),
      color: colors.text,
    },
    saveRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(14),
      marginTop: moderateVerticalScale(10),
    },
    cancelText: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      fontWeight: "600",
      textDecorationLine: "underline",
    },

    entryCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(13),
      marginBottom: moderateVerticalScale(10),
    },
    entryTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(6),
      marginBottom: moderateVerticalScale(6),
    },
    entryDate: {
      fontSize: TextStyles.caption,
      fontWeight: "700",
      color: colors.mutedText,
    },
    entryMoodPill: {
      backgroundColor: colors.lightPurple,
      borderRadius: 999,
      paddingHorizontal: moderateScale(7),
      paddingVertical: 1,
    },
    entryMoodText: {
      fontSize: scale(9),
      fontWeight: "700",
      color: colors.primary,
    },
    editedText: {
      fontSize: scale(9),
      color: colors.mutedText,
    },
    entryActions: {
      flexDirection: "row",
      gap: moderateScale(12),
      marginLeft: "auto",
    },
    entryActionText: {
      fontSize: TextStyles.caption,
      fontWeight: "600",
      color: colors.mutedText,
    },
    burnText: {
      color: colors.danger,
    },
    entryText: {
      fontSize: TextStyles.stepCounts,
      lineHeight: scale(20),
      color: colors.text,
    },
    unreadableText: {
      fontSize: TextStyles.stepCounts,
      color: colors.mutedText,
      fontStyle: "italic",
    },
  });
