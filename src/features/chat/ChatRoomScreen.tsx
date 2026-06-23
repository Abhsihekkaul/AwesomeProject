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
  Image,

} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import imagePath from "../../constant/imagePath";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import BackButton from "../../components/ui/BackButton";

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
          <BackButton />
          <View style={styles.headerCenter}>
            <Text style={styles.name}>Alex K.</Text>
            <Text style={styles.status}>● Online · Fibromyalgia</Text>
          </View>
        </View>


        <ScrollView showsVerticalScrollIndicator={false}>
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

  <Message
    mine
    text="I feel the same way. Most people are supportive, but unless they've experienced it themselves, it's hard for them to fully understand."
    time="10:25 AM"
  />

  <Message
    text="Exactly. Sometimes I spend more energy explaining my condition than actually managing it."
    time="10:27 AM"
  />

  <Message
    mine
    text="That sounds exhausting. Have you found anything that helps on difficult days?"
    time="10:29 AM"
  />

  <Message
    text="I've started keeping my expectations realistic. Instead of focusing on everything I can't do, I try to celebrate the small wins."
    time="10:31 AM"
  />

  <Message
    mine
    text="I like that mindset. I've been trying to do something similar—breaking tasks into smaller steps so they feel less overwhelming."
    time="10:33 AM"
  />

  <Message
    text="That's smart. Some days even getting out for a short walk feels like a huge achievement."
    time="10:35 AM"
  />

  <Message
    mine
    text="Absolutely. Progress isn't always obvious, but those small moments add up over time."
    time="10:36 AM"
  />

  <Message
    text="Thank you for saying that. I needed the reminder today. 😊"
    time="10:38 AM"
  />

  <Message
    mine
    text="Anytime. And if you're having a rough day, remember you're not facing it alone."
    time="10:40 AM"
  />

  <Message
    text="That means a lot. It's amazing how much difference a simple conversation can make."
    time="10:41 AM"
  />
</ScrollView>


        <View style={styles.inputBar}>
          <Image source={imagePath.UploadIcon} style={styles.uploadIcon} />
          <TextInput
            placeholder="Write something supportive..."
            placeholderTextColor="#9AA6BA"
            style={styles.input}
          />

          <Pressable style={styles.sendBtn}>
            <Image source={imagePath.RightIcon} style={styles.sendBtn} />
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
    borderBottomWidth: 1,
    borderBottomColor: "#E3EAF4",
    paddingBottom : moderateVerticalScale(4),
  },  
  
  headerCenter: {
    flex: 1,
  },

  name: {
    fontSize: TextStyles.body,
    fontWeight: "600",
  },

  status: {
    color: "#4E79C7",
    marginTop: moderateScale(2),
    fontSize: TextStyles.caption,
  },
  
  // chatArea: {
  //   paddingHorizontal: moderateScale(16),
  //   paddingBottom: moderateScale(18),
  // },

  msgWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: moderateScale(14),
  },

  smallAvatar: {
    width: moderateScale(34),
    height: moderateVerticalScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: "#E9EEF8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(8),
  },

  smallAvatarText: {
    color: "#4E79C7",
    fontWeight: "600",
    fontSize: TextStyles.stepCounts,
  },

  bubble: {
    maxWidth: "78%",
    backgroundColor: colors.white,
    padding: moderateScale(12),
    borderRadius: radius.md,
    borderWidth: moderateScale(1),
    borderColor: "#E3EAF4",
  },

  mineBubble: {
    backgroundColor: "#4E79C7",
    borderColor: "#4E79C7",
  },

  msgText: {
    color: colors.text,
    fontSize: TextStyles.stepCounts,
    lineHeight: moderateScale(22),
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

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(10),
    // backgroundColor: colors.white,
    borderTopWidth: moderateScale(1),
    borderTopColor: "#E3EAF4",
    paddingHorizontal : moderateScale(10)
  },

  uploadIcon: {
    height: moderateVerticalScale(20),
    width : moderateScale(22),
    marginRight: moderateScale(10),
  },

  input: {
    flex: 1,
    backgroundColor: "#f5f9ff",
    borderRadius: radius.md,
    paddingHorizontal: moderateScale(8),
    height: moderateVerticalScale(32),
    fontSize: TextStyles.stepCounts,
  },

  sendBtn: {
    width: moderateScale(20),
    height: moderateScale(18),
    marginLeft: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },

  // send: {
  //   fontSize: 22,
  //   color: "#8A9CB5",
  // },
});