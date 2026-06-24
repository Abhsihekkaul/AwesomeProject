import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import UserAvatar from "../../components/ui/UserAvatar";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import BackButton from "../../components/ui/BackButton";
import SearchBar from "./SearchBar";
import imagePath from "../../constant/imagePath";

// --- Dummy Data ---
const dummyGroups = [
    { id: "1", name: "Fibromyalgia Warriors", members: "1,284 members", initials: "FW", bg: "#EAF1FF", color: "#4E79C7" },
    { id: "2", name: "Chronic Pain Support", members: "3,402 members", initials: "CP", bg: "#FDF2E9", color: "#E67E22" },
    { id: "3", name: "Mindful Living", members: "890 members", initials: "ML", bg: "#EBF5F0", color: "#4FA57B" },
    { id: "4", name: "Sleep Strategies", members: "5,112 members", initials: "SS", bg: "#F1EBFF", color: "#7453C8" },
    { id: "5", name: "Diet & Wellness", members: "2,045 members", initials: "DW", bg: "#F9EBED", color: "#D94A56" },
    { id: "6", name: "Anxiety Recovery Circle", members: "2,734 members", initials: "AR", bg: "#EEF7FF", color: "#3A7BD5" },
    { id: "7", name: "Depression Support Hub", members: "4,301 members", initials: "DS", bg: "#FFF4EA", color: "#F2994A" },
    { id: "8", name: "Migraine Fighters", members: "1,543 members", initials: "MF", bg: "#F0FFF7", color: "#27AE60" },
    { id: "9", name: "PCOS Wellness Community", members: "6,203 members", initials: "PW", bg: "#FFF1F5", color: "#E84393" },
    { id: "10", name: "Healthy Habits Club", members: "980 members", initials: "HH", bg: "#EEF6F8", color: "#00A8CC" },
    { id: "11", name: "Stress Management Network", members: "2,891 members", initials: "SM", bg: "#F7F4FF", color: "#6C5CE7" },
    { id: "12", name: "Autoimmune Warriors", members: "1,602 members", initials: "AW", bg: "#FFF5F0", color: "#FF6B35" },
    { id: "13", name: "Cancer Survivor Circle", members: "3,712 members", initials: "CS", bg: "#F2FAF5", color: "#2DCE89" },
    { id: "14", name: "Heart Health Journey", members: "1,245 members", initials: "HH", bg: "#FFF0F0", color: "#EB5757" },
    { id: "15", name: "Weight Loss Together", members: "7,112 members", initials: "WT", bg: "#F0FFF4", color: "#38A169" },
    { id: "16", name: "Yoga & Meditation", members: "5,872 members", initials: "YM", bg: "#F3EEFF", color: "#805AD5" },
    { id: "17", name: "Diabetes Care Community", members: "2,421 members", initials: "DC", bg: "#EDF7FF", color: "#3182CE" },
    { id: "18", name: "Arthritis Support Group", members: "1,976 members", initials: "AS", bg: "#FFF8EB", color: "#D69E2E" },
    { id: "19", name: "Women's Health Space", members: "3,088 members", initials: "WH", bg: "#FFF0F6", color: "#D53F8C" },
    { id: "20", name: "Mental Wellness Tribe", members: "4,955 members", initials: "MW", bg: "#F0FFF9", color: "#319795" },
    { id: "21", name: "Thyroid Support Network", members: "2,101 members", initials: "TS", bg: "#EEF2FF", color: "#5A67D8" },
    { id: "22", name: "Parents Care Circle", members: "1,437 members", initials: "PC", bg: "#FFF7ED", color: "#DD6B20" },
    { id: "23", name: "Healthy Aging Community", members: "2,734 members", initials: "HA", bg: "#F7FAFC", color: "#4A5568" },
    { id: "24", name: "Nutrition & Fitness", members: "5,483 members", initials: "NF", bg: "#F0FFF4", color: "#2F855A" },
    { id: "25", name: "Rare Disease Warriors", members: "832 members", initials: "RD", bg: "#FAF5FF", color: "#9F7AEA" },
];

const dummyFriends = [
    { id: "1", name: "Shivani Rawat", status: "Online", initials: "SR" },
    { id: "2", name: "Arun Sharma", status: "Last active 2h ago", initials: "AS" },
    { id: "3", name: "Priya Sharma", status: "Online", initials: "PS" },
    { id: "4", name: "Alex King", status: "Last active yesterday", initials: "AK" },
    { id: "5", name: "Jamie Lee", status: "Online", initials: "JL" },
    { id: "6", name: "Riya Kapoor", status: "Online", initials: "RK" },
    { id: "7", name: "Neha Gupta", status: "Last active 10m ago", initials: "NG" },
    { id: "8", name: "Karan Malhotra", status: "Last active 5h ago", initials: "KM" },
    { id: "9", name: "Simran Kaur", status: "Online", initials: "SK" },
    { id: "10", name: "Aman Verma", status: "Last active 1d ago", initials: "AV" },
    { id: "11", name: "Rohan Mehta", status: "Online", initials: "RM" },
    { id: "12", name: "Pooja Singh", status: "Last active 20m ago", initials: "PS" },
    { id: "13", name: "Vikram Arora", status: "Last active 3h ago", initials: "VA" },
    { id: "14", name: "Sneha Batra", status: "Online", initials: "SB" },
    { id: "15", name: "Harsh Gupta", status: "Last active yesterday", initials: "HG" },
    { id: "16", name: "Ananya Joshi", status: "Online", initials: "AJ" },
    { id: "17", name: "Rahul Sharma", status: "Last active 45m ago", initials: "RS" },
    { id: "18", name: "Tanya Khanna", status: "Online", initials: "TK" },
    { id: "19", name: "Dev Patel", status: "Last active 6h ago", initials: "DP" },
    { id: "20", name: "Meera Nair", status: "Online", initials: "MN" },
    { id: "21", name: "Aditya Rao", status: "Last active 12m ago", initials: "AR" },
    { id: "22", name: "Nikita Jain", status: "Last active yesterday", initials: "NJ" },
    { id: "23", name: "Yash Khurana", status: "Online", initials: "YK" },
    { id: "24", name: "Ishita Sood", status: "Last active 4h ago", initials: "IS" },
    { id: "25", name: "Manav Bansal", status: "Online", initials: "MB" },
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
            <SearchBar placeholder="search a friend..." />
            
            <ScrollView showsVerticalScrollIndicator={false}>
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
                                <Image source={imagePath.ChatIcon} style={styles.Chat} />
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
        marginBottom: moderateVerticalScale(8)
    },
    headerTitle: {
        fontSize: TextStyles.heading,
        fontWeight: "600",
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        padding: moderateScale(12),
        marginTop: moderateVerticalScale(8),
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
        fontWeight: "500",
    },
    Chat: {
        width: moderateScale(22),
        height: moderateScale(22)
    },
    messageIcon: {
        fontSize: TextStyles.body,
    }
});