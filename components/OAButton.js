<script src="http://localhost:8097"></script>

import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Image,
    Pressable, Text
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import OAFullScreen from '@components/OAFullScreen';

import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";



export default function OAButton ({ onPress, title, image, icon, iconProps,
    style, square, entering, isHorizontal, textStyle, imageStyle, askConfirm, description,
disabled }) {



    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const pressedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                scale: withSpring(scale.value)
            }],
            opacity: withSpring(opacity.value)

           
        }
    })

    const containerStyle = {
        aspectRatio: square ? 1 : null,
        backgroundColor: (style && style.backgroundColor) ? style.backgroundColor : (
            disabled ? colors.transpBlack : colors.color_2
        ),
        opacity: disabled ? 0.1 : 1
    }

    const pressableStyle = disabled ? ({
    }) : null;

    const handlePress = () => {
        if (askConfirm) {
            OAFullScreen.showDialog({
                type: "confirmAction",
                description: description,
                onPressPrimaryBtn: () => onPress(),
            });
        } else 
            onPress();
    }


    const UIcon = (icon) ?
        <Icon style={[iconProps.style, {}]} name={icon}
            color={"rgba(255,255,255,1)"}
            size={iconProps.size}
        /> : (image ?
            <Image style={[myStyles.image, imageStyle]} source={image} /> : null);

    const onPressIn = () => {
        scale.value = 1.05;
        opacity.value = 0.8;
    }

    const onPressOut = () => {
        scale.value = 1;
        opacity.value = 1;
    }


    let button = null;
    if (isHorizontal) {
        button = (
            <Pressable 
            disabled={disabled}
            style={[myStyles.btn, pressableStyle, myStyles.btnHorizontal]} onPress={handlePress}
                onPressIn={onPressIn} onPressOut={onPressOut}
            >
                {UIcon}
                {title ? <Text
                    style={[styles.text, myStyles.text, textStyle]}
                >{title}</Text> : null}
            </Pressable>);
    } else {
        button = (
            <Pressable style={[myStyles.btn, pressableStyle, myStyles.btnVertical]} onPress={handlePress}
                onPressIn={onPressIn} onPressOut={onPressOut}
                disabled={disabled}
            >
                {title ?
                    <Text
                        style={[styles.text, myStyles.text, textStyle]}>{title}</Text>
                    : null}
                {UIcon}
            </Pressable>);
    }





    return (
        <Animated.View
            entering={entering}
            style={[myStyles.container, style, containerStyle, pressedStyle]}>
            {button}
        </Animated.View>
    );
}



const myStyles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6
    },
    btnHorizontal: {
        justifyContent: "flex-start",
        flexDirection: "row",
    },
    btnVertical: {
        justifyContent: "center"
    },
    btn: {
        alignItems: 'center',
        padding: 5,
        width: "100%"
    },
    text: {
        color: "rgba(255,255,255,1)",
        alignSelf: "center",

    },
    image: {
        marginHorizontal: 3,
        resizeMode: "center",
        tintColor: "rgba(255,255,255,1)",
    }
});