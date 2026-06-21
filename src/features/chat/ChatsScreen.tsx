import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import UserAvatar from "../../components/ui/UserAvatar";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

const chats = [
  { name: "Alex K.", last: "I've found that pacing myself helps the most...", time: "10:22 AM", unread: 2, initials: "AK" },
  { name: "Maya Harrison", last: "Finally found a sleep routine that works", time: "23m ago", unread: 0, initials: "MH" },
  { name: "Jamie L.", last: "Yes! The 4–7–8 technique changed my sleep quality...", time: "18m ago", unread: 0, initials: "JL" },
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
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 32, fontWeight: "800", color: colors.text },
  sub: { fontSize: 18, color: "#6F87A6", marginTop: 8, marginBottom: 16 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: 22, borderWidth: 1, borderColor: "#E3EAF4", padding: 16, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 18, fontWeight: "800", color: colors.text },
  time: { color: "#6F87A6", fontSize: scale(14) },
  last: { color: colors.text, marginTop: 4, fontSize: scale(16) },
  badge: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#4FA57B", alignItems: "center", justifyContent: "center" },
  badgeText: { color: colors.white, fontSize: scale(12), fontWeight: "800" },
});