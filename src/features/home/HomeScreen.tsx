import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import UserAvatar from "../../components/ui/UserAvatar";
import PostCard from "../../components/ui/PostCard";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";
import imagePath from "../../constant/imagePath";
import { radius } from "../../theme/radius";

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const quickActions = [
    { title: "Groups", Count: "5", to: "Groups" },
    { title: "Posts",  Count: "7", to: "Help" },
    { title: "Friends", Count: "100", to: "Chats" },
  ];

  const posts = [
    {
      id: "1",
      author: "Sarah",
      circle: "Fibromyalgia Warriors",
      time: "23m ago",
      content:
        "Finally found a sleep routine that actually works. After 3 years of terrible sleep, I tried the 4-7-8 breathing method combined with a heating pad and it has helped tremendously.",
      supportCount: 24,
      helpfulCount: 11,
      commentCount: 8,
      image:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    },
    {
      id: "2",
      author: "John",
      circle: "Diabetes Circle",
      time: "1h ago",
      content:
        "Has anyone experienced dizziness after switching medications? Curious about others' experiences.",
      supportCount: 12,
      helpfulCount: 5,
      commentCount: 16,
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <UserAvatar MarginRightSide={8} initials="S" size={40} bg="#E9E3FB" color="#7453C8" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.greeting}>Good afternoon,</Text>
            <Text style={styles.name}>Sarah</Text>
          </View>

          <Pressable onPress={() => navigation.navigate("Notifications")}>
            {/* <View style={styles.bell}> */}
              <Image style={styles.notificationIcon} source={imagePath.NotificationIcon} />
            {/* </View> */}
          </Pressable>

        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => navigation.navigate(item.to)}
              style={styles.quickCard}
            >
              <Text style={styles.Numbers}>{item.Count}</Text>
              <Text style={[styles.quickTitle,]}>{item.title}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.QuickTips}>
          <Image style={styles.HeartBtn} source={imagePath.HeartIcon}/>
          <View style={{ flex: 1 }}>
            <Text style={styles.TipsTitle}>Need Quick Health Tips</Text>
            <Text style={styles.TipsSub}>100+ resources available</Text>
          </View>
          <Image style={styles.RightIcon} source={imagePath.RightIcon}/>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Healing Stream</Text>
          <Pressable onPress={() => navigation.navigate("CreatePost")}>
            <Image style={styles.Post} source={imagePath.PostIcon } />
          </Pressable>
        </View>

        <View style={{ marginTop: moderateVerticalScale(8) }}>
          {posts.map((item) => (
            <PostCard
              key={item.id}
              post={item}
            />
          ))}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateVerticalScale(12)
  },
  greeting: {
    fontSize: TextStyles.stepCounts,
  },
  name: {
    color: colors.text,
    fontSize: TextStyles.heading,
    fontWeight: "600"
  },

  notificationIcon : {
    height: moderateVerticalScale(25),
    width : moderateScale(25),
},
  
  QuickTips: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "black",
    borderWidth : 0.2,
    borderRadius: radius.md,
    padding: moderateScale(11),
    marginBottom: moderateVerticalScale(12),
  },
  
  HeartBtn: {
    height: moderateVerticalScale(20),
    width : moderateScale(22),
    marginRight: moderateScale(12)
  },

  TipsTitle: {
    fontSize: TextStyles.stepCounts,
    fontWeight: "600"
  },
  TipsSub: {
    fontSize: TextStyles.caption,
    marginTop: moderateVerticalScale(2),
  },

  RightIcon : {
    height: moderateVerticalScale(14),
    width : moderateScale(14),
  },

  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-evenly"
  },

  quickCard: {
    padding: moderateScale(10),
    marginBottom: moderateScale(4),
    alignItems: "center",
    justifyContent: "center", 
  },
  Numbers: {
    fontSize: TextStyles.body,
    fontWeight: "600"
  },
  quickTitle: {
    marginTop : moderateVerticalScale(4),
    fontSize: TextStyles.stepCounts,
  },
  
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical : moderateVerticalScale(2),
  },

  sectionTitle: {
    fontSize: TextStyles.title,
  },

  Post : {
    height: moderateVerticalScale(20),
    width: moderateScale(20),
  },
});