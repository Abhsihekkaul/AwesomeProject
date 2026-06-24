import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Share } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import UserAvatar from "../../components/ui/UserAvatar";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { TextStyles } from "../../theme/typography";

const recentFriends = [
    { name: "Shivani", initials: "SR" },
    { name: "Arun", initials: "A" },
    { name: "Priya", initials: "PS" },
    { name: "Alex", initials: "AK" },
    { name: "Neha", initials: "NV" },
];

export default function ShareSheet({ visible, onClose, postUrl = "https://healingstream.app/p/123" }: { visible: boolean, onClose: () => void, postUrl?: string }) {

    // Triggers the native iOS/Android share overlay
    const handleExternalShare = async () => {
        try {
            await Share.share({
                message: `Check out this post on Healing Stream: ${postUrl}`,
                url: postUrl, // iOS only
            });
            onClose(); // Close our custom sheet after opening the system one
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.dismissArea} onPress={onClose} />

                <View style={styles.sheetContainer}>
                    <View style={styles.dragHandle} />
                    <Text style={styles.sheetTitle}>Share to</Text>

                    {/* Internal App Sharing */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsScroll}>
                        {recentFriends.map((friend, index) => (
                            <Pressable key={index} style={styles.friendNode} onPress={() => { console.log(`Sent to ${friend.name}`); onClose(); }}>
                                <UserAvatar initials={friend.initials} size={56} bg="#F1EBFF" color="#7453C8" />
                                <Text style={styles.friendName}>{friend.name}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <View style={styles.divider} />

                    {/* External Platform Sharing */}
                    <Pressable style={styles.externalShareBtn} onPress={handleExternalShare}>
                        <View style={styles.iconPlaceholder}><Text>🔗</Text></View>
                        <Text style={styles.externalShareText}>Share via other apps...</Text>
                    </Pressable>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    dismissArea: { flex: 1 },
    sheetContainer: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: moderateVerticalScale(30) },
    dragHandle: { width: moderateScale(40), height: moderateVerticalScale(4), backgroundColor: "#D1D5DB", alignSelf: "center", borderRadius: radius.sm, marginTop: moderateVerticalScale(10) },
    sheetTitle: { fontSize: TextStyles.title, fontWeight: "700", marginLeft: moderateScale(20), marginTop: moderateVerticalScale(16), color: colors.text },

    friendsScroll: { paddingHorizontal: moderateScale(20), marginTop: moderateVerticalScale(20), gap: moderateScale(16) },
    friendNode: { alignItems: "center", width: moderateScale(64) },
    friendName: { marginTop: moderateVerticalScale(8), fontSize: scale(12), color: colors.text, fontWeight: "500", textAlign: "center" },

    divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: moderateVerticalScale(24), marginHorizontal: moderateScale(20) },

    externalShareBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: moderateScale(20), paddingBottom: moderateVerticalScale(10) },
    iconPlaceholder: { width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20), backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginRight: moderateScale(12) },
    externalShareText: { fontSize: scale(16), color: colors.text, fontWeight: "500" }
});