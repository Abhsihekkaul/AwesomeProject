import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import UserAvatar from "../../components/ui/UserAvatar";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import BackButton from "../../components/ui/BackButton";

// --- Dummy Data ---
const dummyGroups = [
    { id: "1", name: "Fibromyalgia Warriors", members: "1,284 members", initials: "FW", bg: "#EAF1FF", color: "#4E79C7" },
    { id: "2", name: "Chronic Pain Support", members: "3,402 members", initials: "CP", bg: "#FDF2E9", color: "#E67E22" },
    { id: "3", name: "Mindful Living", members: "890 members", initials: "ML", bg: "#EBF5F0", color: "#4FA57B" },
    { id: "4", name: "Sleep Strategies", members: "5,112 members", initials: "SS", bg: "#F1EBFF", color: "#7453C8" },
    { id: "5", name: "Diet & Wellness", members: "2,045 members", initials: "DW", bg: "#F9EBED", color: "#D94A56" },
];

const dummyFriends = [
    { id: "1", name: "Shivani Rawat", status: "Online", initials: "SR" },
    { id: "2", name: "Arun", status: "Last active 2h ago", initials: "A" },
    { id: "3", name: "Priya Sharma", status: "Online", initials: "PS" },
    { id: "4", name: "Alex K.", status: "Last active yesterday", initials: "AK" },
    { id: "5", name: "Jamie L.", status: "Online", initials: "JL" },
];

export default function DirectoryScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    // Extract 'type' from route params, default to "Groups" if undefined
    const directoryType: "Groups" | "Friends" = route.params?.type || "Groups";

    // Conditionally select data
    const data = directoryType === "Groups" ? dummyGroups : dummyFriends;

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>My {directoryType}</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${directoryType.toLowerCase()}...`}
                    placeholderTextColor="#8A9CB5"
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {data.map((item: any) => (
                    <Pressable
                        key={item.id}
                        style={styles.card}
                        onPress={() => {
                            if (directoryType === "Groups") {
                                navigation.navigate("GroupDetails", { name: item.name });
                            } else {
                                // Navigate to private chat or profile
                                navigation.navigate("ChatRoom", { name: item.name });
                            }
                        }}
                    >
                        {directoryType === "Groups" ? (
                            // Group Item UI
                            <>
                                <View style={[styles.avatarBox, { backgroundColor: item.bg }]}>
                                    <Text style={[styles.avatarText, { color: item.color }]}>{item.initials}</Text>
                                </View>
                                <View style={styles.infoBox}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemSub}>{item.members}</Text>
                                </View>
                                <View style={styles.actionBtn}>
                                    <Text style={styles.actionText}>View</Text>
                                </View>
                            </>
                        ) : (
                            // Friend Item UI
                            <>
                                <UserAvatar initials={item.initials} size={48} bg="#F1EBFF" color="#7453C8" />
                                <View style={styles.infoBox}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={[styles.itemSub, item.status === "Online" && styles.onlineText]}>
                                        {item.status}
                                    </Text>
                                </View>
                                <View style={styles.messageBtn}>
                                    <Text style={styles.messageIcon}>💬</Text>
                                </View>
                            </>
                        )}
                    </Pressable>
                ))}
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: moderateVerticalScale(16)
    },
    headerTitle: {
        fontSize: TextStyles.heading,
        fontWeight: "600",
        color: colors.text,
    },
    searchContainer: {
        marginBottom: moderateVerticalScale(16),
    },
    searchInput: {
        backgroundColor: "#F9FAFC",
        borderWidth: 0.2,
        borderColor: "#b8bbc0",
        borderRadius: radius.md,
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateVerticalScale(12),
        fontSize: TextStyles.caption,
        color: colors.text,
    },
    scrollContent: {
        paddingBottom: moderateVerticalScale(40),
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        padding: moderateScale(12),
        marginBottom: moderateVerticalScale(8),
        borderRadius: radius.md,
        borderWidth: 0.2,
        borderColor: "#b8bbc0",
    },
    avatarBox: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: radius.sm,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: scale(16),
        fontWeight: "700",
    },
    infoBox: {
        flex: 1,
        marginLeft: moderateScale(14),
    },
    itemName: {
        fontSize: TextStyles.body,
        fontWeight: "600",
        color: colors.text,
    },
    itemSub: {
        fontSize: TextStyles.caption,
        color: "#6F87A6",
        marginTop: moderateVerticalScale(2),
    },
    onlineText: {
        color: "#4FA57B",
        fontWeight: "500",
    },
    actionBtn: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateVerticalScale(6),
        borderRadius: radius.xl,
    },
    actionText: {
        fontSize: scale(12),
        color: colors.text,
        fontWeight: "600",
    },
    messageBtn: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        backgroundColor: "#F9FAFC",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 0.2,
        borderColor: "#b8bbc0",
    },
    messageIcon: {
        fontSize: scale(14),
    }
});