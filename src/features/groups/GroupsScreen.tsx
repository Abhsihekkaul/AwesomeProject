import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Image, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import SearchBar from "../../components/ui/SearchBar";
import CategoryChip from "../../components/ui/CategoryChip";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import imagePath from "../../constant/imagePath";

const groups = [
  {
    title: "Fibromyalgia Warriors",
    members: "1,284 members",
    posts: "47 posts today",
    tag: "Chronic Pain",
    verified: true,
    joined: true,
  },
  {
    title: "Type 2 Diabetes",
    members: "3,421 members",
    posts: "112 posts today",
    tag: "Metabolic",
    verified: true,
    joined: true,
  },
  {
    title: "Long COVID Recovery",
    members: "892 members",
    posts: "34 posts today",
    tag: "Post-Viral",
    verified: true,
    joined: true,
  },
  {
    title: "Multiple Sclerosis",
    members: "678 members",
    posts: "19 posts today",
    tag: "Neurology",
    bg: "#F6F0FF",
    accent: "#8A66D2",
    verified: true,
    joined: false,
  },
];

export default function GroupsScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Support Groups</Text>
          <Pressable onPress={() => navigation.navigate("RequestGroup")} style={styles.requestBtn}>
            <Text style={styles.requestText}>＋ Request</Text>
          </Pressable>
        </View>

        <SearchBar placeholder="Search conditions, groups..." />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
          <View style={styles.chipRow}>
            <CategoryChip label="All" active />
            <CategoryChip label="My Groups" />
            <CategoryChip label="Mental Health" />
            <CategoryChip label="Autoimmune" />
          </View>
        </ScrollView>

        <FlatList
          data={groups}
          keyExtractor={(item) => item.title}
          renderItem={({ item: g }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("GroupDetails", { name: g.title })
              }
              style={styles.card}
            >
              {true ? (
                <Image
                  source={imagePath.googleIcon}
                  style={{
                    height: moderateScale(150),
                    width: "100%",
                    resizeMode: "contain",
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: g.bg,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 36 }}>👥</Text>
                </View>
              )}

              <View>
                <Text style={styles.cardTitle}>{g.title}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{g.members}</Text>
                  <Text style={styles.meta}>{g.posts}</Text>
                </View>

                <Text
                  style={[
                    styles.tag,
                    {
                      color: colors.card,
                      backgroundColor: colors.primaryDark,
                    },
                  ]}
                >
                  {g.tag}
                </Text>

                <TouchableOpacity
                  onPress={() => console.log("reaching")}
                  style={[
                    styles.joinedPill,
                    {
                      borderColor: g.accent,
                      backgroundColor: g.joined ? colors.card : g.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.joinedText,
                      {
                        color: g.joined ? g.accent : colors.card,
                      },
                    ]}
                  >
                    {g.joined ? "Joined ✓" : "Join"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: 120
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: scale(24), fontWeight: "800", color: colors.text },
  requestBtn: {
    backgroundColor: "#EAF1FF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  requestText: { color: "#4E79C7", fontWeight: "800", fontSize: scale(16) },
  chipRow: { flexDirection: "row", alignItems: "center", paddingBottom: 4 },
  card: {
    flexDirection: "column",
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    borderWidth: moderateScale(1),
    borderColor: "#E3EAF4",
    marginTop: moderateVerticalScale(14),
    padding: moderateScale(12),

  },
  iconBox: {
    width: '100%',
    height: moderateScale(100),
    borderTopLeftRadius: moderateScale(18),
    borderTopRightRadius: moderateScale(18),
    alignItems: "center", justifyContent: "center", marginRight: 14
  },

  cardTitle: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    paddingVertical: moderateVerticalScale(8),
    color: colors.text
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  meta: {
    color: "#6F87A6",
    fontSize: scale(16),
    fontWeight: "600"
  },

  tag: {
    alignSelf: "flex-start",
    padding: moderateScale(8),
    marginVertical: moderateVerticalScale(8),
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "700"
  },

  joinedPill: {
    borderWidth: 1,
    borderRadius: 99,
    padding: moderateScale(8),
  },

  joinedText: {
    fontSize: scale(16),
    fontWeight: "800",
    textAlign: 'center'
  },

});