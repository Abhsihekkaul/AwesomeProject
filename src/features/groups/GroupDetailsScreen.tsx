import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

export default function GroupDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupName = route.params?.name ?? "Fibromyalgia Warriors";
  const [tab, setTab] = useState<"Posts" | "Members" | "Resources">("Posts");

  return (
    <ScreenWrapper>
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{groupName}</Text>
        <View style={styles.joined}><Text style={styles.joinedText}>Joined ✓</Text></View>
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.meta}>👥 1,284 members</Text>
        <Text style={styles.meta}>✓ MODERATED</Text>
      </View>

      <Text style={styles.desc}>
        A supportive community for people living with fibromyalgia. Share experiences, coping strategies, and find understanding.
      </Text>
      <Text style={styles.moderator}>🛡 Moderated by Dr. Priya Patel</Text>

      <View style={styles.tabRow}>
        {(["Posts", "Members", "Resources"] as const).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={styles.tabItem}>
            <Text style={[styles.tabText, tab === item && styles.tabActive]}>{item}</Text>
            {tab === item ? <View style={styles.underline} /> : <View style={{ height: 2 }} />}
          </Pressable>
        ))}
      </View>

      {tab === "Posts" && (
        <View style={styles.postCard}>
          <View style={styles.postTop}>
            <View style={styles.avatar}><Text style={styles.avatarText}>MH</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.postName}>Maya Harrison</Text>
              <Text style={styles.postTime}>23m ago</Text>
            </View>
            <Text style={styles.postMenu}>⋯</Text>
          </View>

          <Text style={styles.postTitle}>Finally found a sleep routine that actually helps</Text>
          <Text style={styles.postBody}>
            After 3 years of terrible sleep from fibro, I tried the 4–7–8 breathing combined with a heating pad on my lower back and legs.
            Last night I slept 6 hours straight — first time in months! Anyone else found breathing exercises helpful?
          </Text>

          <View style={styles.actionsRow}>
            <Text style={styles.action}>↑ 47</Text>
            <Text style={styles.action}>↓</Text>
            <Text style={styles.action}>💬 2 replies</Text>
            <Text style={styles.action}>⚑</Text>
          </View>

          <View style={styles.comment}>
            <View style={[styles.smallAvatar, { backgroundColor: "#EAF1FF" }]}><Text style={styles.smallText}>JL</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.commentName}>Jamie L. <Text style={styles.commentTime}>18m ago</Text></Text>
              <Text style={styles.commentText}>
                Yes! The 4–7–8 technique changed my sleep quality dramatically. I also use magnesium glycinate before bed.
              </Text>
            </View>
          </View>
        </View>
      )}

      <Pressable style={styles.postFab} onPress={() => navigation.navigate("CreatePost")}>
        <Text style={styles.postFabText}>＋ Post</Text>
      </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, flexDirection: "row", alignItems: "center" },
  back: { fontSize: 36, color: "#7453C8", marginRight: 10 },
  title: { flex: 1, fontSize: 24, fontWeight: "800", color: "#7453C8" },
  joined: { backgroundColor: "#7453C8", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
  joinedText: { color: colors.white, fontWeight: "800" },
  subHeader: { flexDirection: "row", paddingHorizontal: 20, gap: 12 },
  meta: { color: "#7453C8", fontWeight: "700" },
  desc: { color: "#7453C8", fontSize:scale(18), lineHeight: 28, paddingHorizontal: 20, marginTop: 14 },
  moderator: { color: "#7453C8", paddingHorizontal: 20, marginTop: 10, fontSize: scale(15) },
  tabRow: { flexDirection: "row", marginTop: 18, backgroundColor: colors.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E3EAF4" },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 16 },
  tabText: { color: "#6F87A6", fontSize: scale(16), fontWeight: "800" },
  tabActive: { color: "#7453C8" },
  underline: { position: "absolute", bottom: 0, width: "100%", height: 3, backgroundColor: "#7453C8" },
  postCard: { backgroundColor: colors.white, margin: 16, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: "#E3EAF4" },
  postTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E9E3FB", alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { color: "#7453C8", fontWeight: "800" },
  postName: { fontSize: 18, fontWeight: "800", color: colors.text },
  postTime: { color: "#6F87A6", marginTop: 2 },
  postMenu: { fontSize: 28, color: "#6F87A6" },
  postTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 8 },
  postBody: { fontSize: scale(17), lineHeight: 27, color: colors.text, marginTop: 10 },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E3EAF4" },
  action: { color: "#6F87A6", fontSize: scale(16), fontWeight: "700" },
  comment: { flexDirection: "row", marginTop: 16, paddingLeft: 6 },
  smallAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginRight: 10 },
  smallText: { color: "#7453C8", fontWeight: "800", fontSize: scale(12) },
  commentName: { color: colors.text, fontWeight: "800", fontSize: scale(16) },
  commentTime: { color: "#6F87A6", fontWeight: "600" },
  commentText: { color: colors.text, fontSize: scale(16), lineHeight: 24, marginTop: 6 },
  postFab: { position: "absolute", right: 18, bottom: 18, backgroundColor: "#7453C8", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 14 },
  postFabText: { color: colors.white, fontSize: 18, fontWeight: "800" },
});