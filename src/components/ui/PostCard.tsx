import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
} from "react-native";

import UserAvatar from "./UserAvatar";
import { colors } from "../../theme/colors";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import imagePath from "../../constant/imagePath";

interface Props {
    post: {
        author: string;
        circle: string;
        time: string;
        content: string;
        image?: string;
        supportCount: number;
        helpfulCount: number;
        commentCount: number;
    };
}

export default function PostCard({ post }: Props) {
    return (
        <View style={styles.card}>

            {/* Header */}
            <View style={styles.header}>
                <UserAvatar
                    initials={post.author[0]}
                    size={42}
                    bg="#E9E3FB"
                    color="#7453C8"
                />

                <View style={styles.userInfo}>
                    <Text style={styles.author}>
                        {post.author}
                    </Text>

                    <Text style={styles.meta}>
                        {post.circle} • {post.time}
                    </Text>
                </View>

                <Pressable>
                    <Text style={styles.more}>⋯</Text>
                </Pressable>
            </View>

            {/* Content */}
            <Text style={styles.content}>
                {post.content}
            </Text>

            {/* Image */}
            {post.image && (
                <Image
                    source={{ uri: post.image }}
                    style={styles.image}
                    resizeMode="cover"
                />
            )}

            {/* Actions */}
            <View style={styles.actions}>
                <Pressable >
                    <Image style={styles.love} source={imagePath.HeartIcon} />
                    <Text>{post.supportCount}</Text>
                </Pressable>

                <Pressable >
                    <Image style={styles.love} source={imagePath.Help} />
                    <Text> {post.helpfulCount}</Text>
                </Pressable>

                <Pressable >
                    <Image style={styles.love} source={imagePath.ChatIcon} />
                    <Text> {post.commentCount}</Text>
                </Pressable>

                <Pressable>
                    <Image style={styles.love} source={imagePath.ShareIcon} />
                    <Text> {post.commentCount}</Text>
                </Pressable>

                <Pressable>
                    <Image style={styles.love} source={imagePath.ReportIcon} />
                    <Text> {post.commentCount}</Text>
                </Pressable>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: moderateScale(12),
        marginBottom: moderateVerticalScale(8),
        borderWidth: 1,
        borderColor: "#E8EDF5",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
    },

    userInfo: {
        flex: 1,
        marginLeft: 12,
    },

    author: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.text,
    },

    meta: {
        fontSize: 12,
        color: "#7C8AA5",
        marginTop: 2,
    },

    more: {
        fontSize: 24,
        color: "#7C8AA5",
    },

    content: {
        marginTop: 14,
        fontSize: 15,
        lineHeight: 20,
        color: colors.text,
    },

    image: {
        width: "100%",
        height: 220,
        borderRadius: 16,
        marginTop: 14,
    },

    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: moderateVerticalScale(14),
        paddingHorizontal : moderateScale(4),
    },


    love: {
        height: moderateVerticalScale(18),
        width : moderateScale(18)
    }
});