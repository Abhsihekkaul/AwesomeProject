import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import UserAvatar from "../../components/ui/UserAvatar";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

const chats = [
  { name: "Alex K.", last: "I've found that pacing myself helps the most...", time: "10:22 AM", unread: 2, initials: "AK" },
  { name: "Maya Harrison", last: "Finally found a sleep routine that works", time: "23m ago", unread: 0, initials: "MH" },
  { name: "Jamie L.", last: "Yes! The 4–7–8 technique changed my sleep quality...", time: "18m ago", unread: 0, initials: "JL" },

  // Indian users
  { name: "Priya Sharma", last: "Meditation before bed has really helped me relax.", time: "12m ago", unread: 1, initials: "PS" },
  { name: "Arjun Mehta", last: "I've been tracking my mood daily and it's useful.", time: "25m ago", unread: 0, initials: "AM" },
  { name: "Neha Verma", last: "The breathing exercises worked surprisingly well!", time: "32m ago", unread: 3, initials: "NV" },
  { name: "Rohan Kapoor", last: "Anyone else journaling before sleep?", time: "45m ago", unread: 0, initials: "RK" },
  { name: "Ananya Gupta", last: "My anxiety levels have dropped this month.", time: "1h ago", unread: 1, initials: "AG" },
  { name: "Karan Singh", last: "Walking after dinner improved my sleep quality.", time: "1h ago", unread: 0, initials: "KS" },
  { name: "Isha Malhotra", last: "Thank you all for the support ❤️", time: "2h ago", unread: 0, initials: "IM" },
  { name: "Rahul Nair", last: "Trying a digital detox this weekend.", time: "3h ago", unread: 2, initials: "RN" },
  { name: "Sneha Reddy", last: "I finally completed a full week of mindfulness.", time: "4h ago", unread: 0, initials: "SR" },
  { name: "Vikram Joshi", last: "Consistency is harder than I expected.", time: "5h ago", unread: 0, initials: "VJ" },
  { name: "Meera Iyer", last: "Sharing a gratitude list really helps.", time: "6h ago", unread: 4, initials: "MI" },
  { name: "Aditya Khanna", last: "The sleep sounds feature is amazing.", time: "8h ago", unread: 0, initials: "AK" },
  { name: "Pooja Bansal", last: "Anyone have tips for staying focused at work?", time: "9h ago", unread: 1, initials: "PB" },
  { name: "Aman Chawla", last: "Small daily improvements add up over time.", time: "Yesterday", unread: 0, initials: "AC" },
];

export default function ChatsScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Chats</Text>
      <Text style={styles.sub}>Private conversations with community members</Text>

      {chats.map((c) => (
        <Pressable key={c.name} onPress={() => navigation.navigate("ChatRoom")} style={styles.card}>
          <UserAvatar initials={c.initials} size={52} bg="#E9EEF8" color="#4E79C7" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.row}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.time}>{c.time}</Text>
            </View>
            <Text style={styles.last} numberOfLines={1}>{c.last}</Text>
          </View>
          {c.unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{c.unread}</Text></View> : null}
        </Pressable>
      ))}
      </ScrollView>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({

  title: {
    fontSize: TextStyles.title,
    fontWeight: "600",
  },

  sub: {
    fontSize: TextStyles.caption,
    color: "#6F87A6",
    marginTop: moderateVerticalScale(6) 
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
    padding: moderateScale(10),
    marginVertical: moderateVerticalScale(4)
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap : moderateScale(4)
  },

  name: {
    fontSize: TextStyles.body,
    fontWeight: "600",
  },

  time: {
    color: "#6F87A6",
    fontSize: TextStyles.caption,
  },

  last: {
    marginTop: moderateVerticalScale(2),
    fontSize: TextStyles.caption,
    opacity : 0.5,
  },

  badge: {
    width: moderateScale(20),
    height: moderateVerticalScale(20),
    borderRadius: "100%",
    backgroundColor: "#6070e4",
    alignItems: "center",
    justifyContent: "center"
  },

  badgeText: {
    color: colors.white,
    fontSize: TextStyles.caption,
    fontWeight: "600"
  },

});