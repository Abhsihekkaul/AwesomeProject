import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { moderateScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

type MessageProps = {
  mine?: boolean;
  text: string;
  time: string;
};

const Message = ({ mine, text, time }: MessageProps) => (
  <View style={[styles.msgWrap, mine && { justifyContent: "flex-end" }]}>
    {!mine ? (
      <View style={styles.smallAvatar}>
        <Text style={styles.smallAvatarText}>AK</Text>
      </View>
    ) : null}

    <View style={[styles.bubble, mine && styles.mineBubble]}>
      <Text style={[styles.msgText, mine && styles.mineText]}>
        {text}
      </Text>

      <Text style={[styles.time, mine && styles.mineTime]}>
        {time}
        {mine ? " ✓✓" : ""}
      </Text>
    </View>
  </View>
);

export default function ChatRoomScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.name}>Alex K.</Text>
          <Text style={styles.status}>● Online · Fibromyalgia</Text>
        </View>

        <Text style={styles.privacy}>🔒 E2E</Text>
      </View>

      <View style={styles.matchBox}>
        <Text style={styles.matchTitle}>87% Compatibility Match</Text>

        <Text style={styles.matchText}>
          You and Alex both live with fibromyalgia and are in similar stages of
          your journey. Matched by HealCircle&apos;s private algorithm.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.chatArea}
        showsVerticalScrollIndicator={false}
      >
        <Message
          text="I've found that pacing myself and not pushing through pain helps the most. Also, warm baths before sleep. What's been your biggest challenge lately?"
          time="10:18 AM"
        />

        <Message
          mine
          text="Definitely the unpredictability. You never know when a bad day is coming. I've been trying journaling — it helps me notice patterns."
          time="10:22 AM"
        />

        <Message
          text="That's such a good idea. I should try that. It's really comforting to talk to someone who gets it. 💙"
          time="10:24 AM"
        />
      </ScrollView>

      <View style={styles.supportBar}>
        <Text style={styles.supportText}>
          🛡 Need support? Access crisis resources in the Help tab.
        </Text>
      </View>

      <View style={styles.inputBar}>
        <Text style={styles.emoji}>☺</Text>

        <TextInput
          placeholder="Write something supportive..."
          placeholderTextColor="#9AA6BA"
          style={styles.input}
        />

        <Pressable style={styles.sendBtn}>
          <Text style={styles.send}>✈</Text>
        </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E3EAF4",
  },

  back: {
    fontSize: scale(36),
    color: colors.text,
    marginRight: moderateScale(8),
  },

  headerCenter: {
    flex: 1,
  },

  name: {
    fontSize: scale(22),
    fontWeight: "800",
    color: colors.text,
  },

  status: {
    color: "#4E79C7",
    marginTop: moderateScale(4),
    fontSize: scale(15),
  },

  privacy: {
    color: "#4FA57B",
    fontWeight: "800",
    backgroundColor: "#E8F6EE",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(999),
  },

  matchBox: {
    margin: moderateScale(16),
    backgroundColor: "#EEE7FF",
    borderRadius: moderateScale(22),
    padding: moderateScale(16),
    borderWidth: moderateScale(1),
    borderColor: "#D7C6F6",
  },

  matchTitle: {
    color: "#7453C8",
    fontSize: scale(18),
    fontWeight: "800",
  },

  matchText: {
    color: "#7453C8",
    fontSize: scale(15),
    lineHeight: moderateScale(22),
    marginTop: moderateScale(6),
  },

  chatArea: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(18),
  },

  msgWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: moderateScale(14),
  },

  smallAvatar: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: "#E9EEF8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(8),
  },

  smallAvatarText: {
    color: "#4E79C7",
    fontWeight: "800",
    fontSize: scale(12),
  },

  bubble: {
    maxWidth: "78%",
    backgroundColor: colors.white,
    padding: moderateScale(14),
    borderRadius: moderateScale(18),
    borderWidth: moderateScale(1),
    borderColor: "#E3EAF4",
  },

  mineBubble: {
    backgroundColor: "#4E79C7",
    borderColor: "#4E79C7",
  },

  msgText: {
    color: colors.text,
    fontSize: scale(17),
    lineHeight: moderateScale(25),
  },

  mineText: {
    color: colors.white,
  },

  time: {
    color: "#6F87A6",
    fontSize: scale(12),
    marginTop: moderateScale(8),
    alignSelf: "flex-end",
  },

  mineTime: {
    color: "#DCE6FA",
  },

  supportBar: {
    backgroundColor: "#EAF1FF",
    padding: moderateScale(12),
    borderTopWidth: moderateScale(1),
    borderTopColor: "#DCE5F3",
  },

  supportText: {
    color: "#4E79C7",
    fontSize: scale(14),
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(12),
    backgroundColor: colors.white,
    borderTopWidth: moderateScale(1),
    borderTopColor: "#E3EAF4",
  },

  emoji: {
    fontSize: scale(24),
    color: "#8A9CB5",
    marginRight: moderateScale(10),
  },

  input: {
    flex: 1,
    backgroundColor: "#EEF3FB",
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(16),
    height: moderateScale(54),
    fontSize: scale(16),
    color: colors.text,
  },

  sendBtn: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: 27,
    backgroundColor: "#EEF3FB",
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  send: {
    fontSize: 22,
    color: "#8A9CB5",
  },
});