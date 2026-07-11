import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

// Entries live ONLY in AsyncStorage on the device — the diary is deliberately
// never sent to the backend so it stays fully private to the user.
const STORAGE_KEY = "healingsathi.diaryEntries";
const AUTOSAVE_DELAY_MS = 500;

type DiaryEntry = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function HealingDiaryScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // null = list view; otherwise the entry being edited
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setEntries(JSON.parse(raw));
        } catch {
          // Corrupt data — start fresh rather than crash the diary.
        }
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: DiaryEntry[]) => {
    setEntries(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).then(() => setSaveState("saved"));
  }, []);

  // Debounced autosave while typing in the editor
  useEffect(() => {
    if (!editingId || !loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");

    saveTimer.current = setTimeout(() => {
      setEntries((prev) => {
        const now = Date.now();
        const existing = prev.find((e) => e.id === editingId);
        const next = existing
          ? prev.map((e) => (e.id === editingId ? { ...e, title, body, updatedAt: now } : e))
          : [{ id: editingId, title, body, createdAt: now, updatedAt: now }, ...prev];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).then(() => setSaveState("saved"));
        return next;
      });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, body, editingId, loaded]);

  const openNewEntry = () => {
    setEditingId(Date.now().toString());
    setTitle("");
    setBody("");
    setSaveState("idle");
  };

  const openEntry = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setBody(entry.body);
    setSaveState("saved");
  };

  const closeEditor = () => {
    // Drop entries that were opened but never written into
    if (!title.trim() && !body.trim()) {
      persist(entries.filter((e) => e.id !== editingId));
    }
    setEditingId(null);
  };

  const deleteEntry = (entry: DiaryEntry) => {
    Alert.alert("Delete this entry?", "It will be removed from your phone. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => persist(entries.filter((e) => e.id !== entry.id)) },
    ]);
  };

  const privacyNote = (
    <View style={styles.privacyNote}>
      <Text style={styles.privacyText}>
        🔒 Your diary is saved only on this phone — never in the cloud. No one but you can
        read it, not even us.
      </Text>
    </View>
  );

  // ----- Editor view -----
  if (editingId) {
    return (
      <ScreenWrapper>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.editorHeader}>
            <Pressable onPress={closeEditor} hitSlop={8}>
              <Text style={styles.editorBack}>‹ Diary</Text>
            </Pressable>
            <Text style={styles.saveChip}>
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Auto-saved" : ""}
            </Text>
          </View>

          <Text style={styles.editorDate}>{formatDate(Date.now())}</Text>

          <TextInput
            style={styles.titleInput}
            placeholder="Give today a title..."
            placeholderTextColor={colors.mutedText}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.bodyInput}
            placeholder="How was your day? What helped, what hurt, what are you grateful for..."
            placeholderTextColor={colors.mutedText}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {privacyNote}
        </KeyboardAvoidingView>
      </ScreenWrapper>
    );
  }

  // ----- List view -----
  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Healing Diary</Text>
          <Text style={styles.sub}>Your private space to reflect</Text>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📔</Text>
              <Text style={styles.emptyTitle}>Start your first entry</Text>
              <Text style={styles.emptyText}>
                Writing a few lines a day helps you notice patterns in your healing journey.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.entryCard}
            onPress={() => openEntry(item)}
            onLongPress={() => deleteEntry(item)}
          >
            <Text style={styles.entryTitle} numberOfLines={1}>
              {item.title.trim() || "Untitled entry"}
            </Text>
            {item.body.trim() ? (
              <Text style={styles.entryPreview} numberOfLines={2}>
                {item.body.trim()}
              </Text>
            ) : null}
            <Text style={styles.entryDate}>{formatDate(item.updatedAt)}</Text>
          </Pressable>
        )}
      />

      <PrimaryButton title="+ New Entry" onPress={openNewEntry} style={styles.newBtn} />
      {privacyNote}
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    // List view
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(14),
    },
    headerTextWrap: {
      flex: 1,
    },
    title: {
      fontSize: TextStyles.heading,
      fontWeight: "600",
      color: colors.text,
    },
    sub: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },
    listContent: {
      paddingBottom: moderateVerticalScale(12),
      flexGrow: 1,
    },
    entryCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(14),
      marginBottom: moderateVerticalScale(10),
    },
    entryTitle: {
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
    },
    entryPreview: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(4),
      lineHeight: scale(17),
    },
    entryDate: {
      fontSize: scale(11),
      color: colors.mutedText,
      marginTop: moderateVerticalScale(8),
    },
    emptyWrap: {
      alignItems: "center",
      marginTop: moderateVerticalScale(60),
      paddingHorizontal: moderateScale(30),
    },
    emptyEmoji: {
      fontSize: scale(40),
      marginBottom: moderateVerticalScale(12),
    },
    emptyTitle: {
      fontSize: TextStyles.subtitle,
      fontWeight: "600",
      color: colors.text,
      marginBottom: moderateVerticalScale(6),
    },
    emptyText: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      textAlign: "center",
      lineHeight: scale(18),
    },
    newBtn: {
      marginBottom: moderateVerticalScale(10),
    },

    // Editor view
    editorHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(6),
    },
    editorBack: {
      color: colors.primary,
      fontSize: TextStyles.body,
      fontWeight: "600",
    },
    saveChip: {
      color: colors.success,
      fontSize: TextStyles.caption,
      fontWeight: "600",
    },
    editorDate: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      marginBottom: moderateVerticalScale(10),
    },
    titleInput: {
      fontSize: TextStyles.heading,
      fontWeight: "600",
      color: colors.text,
      paddingVertical: moderateVerticalScale(6),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    bodyInput: {
      flex: 1,
      fontSize: TextStyles.body,
      color: colors.text,
      lineHeight: scale(24),
      paddingTop: moderateVerticalScale(12),
    },

    // Shared privacy note
    privacyNote: {
      backgroundColor: colors.lightGreen,
      borderRadius: radius.md,
      padding: moderateScale(12),
      marginBottom: moderateVerticalScale(6),
    },
    privacyText: {
      color: colors.success,
      fontSize: TextStyles.caption,
      lineHeight: scale(17),
      textAlign: "center",
    },
  });
