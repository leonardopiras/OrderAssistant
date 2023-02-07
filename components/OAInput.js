<script src="http://localhost:8097"></script>

import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, PixelRatio,
} from 'react-native';
import Animated, { color, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";



export default function OAInput ({label, showError, 
    errorMsg, showHint, hintMsg, style, children, onBlur, onFocus,
    childrenStyle}) {
    
    const [isFocused, setIsFocused]= useState(false);

    const labelScale = useSharedValue(1);
    const labelTranslate = useSharedValue(0);
    const labelAnimStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                scale: withSpring(labelScale.value),
             },
           
                {
                    translateY: withDelay(300,withTiming(labelTranslate.value))
                }
        ]
        }
    })

    const inputStyle = {
        borderWidth: isFocused ? 2 : 0,
        borderBottomWidth: 2,
        borderColor: showError ? colors.redBtn : colors.transpBlack, 
        marginTop: label ? 10 : null
    }

    const labelStyle = {
        color: showError ? colors.redBtn : colors.color_8,
        borderColor: showError ? colors.redBtn : colors.transpBlack, 
        borderWidth: isFocused ? 1 : 0.5
    }


    const onInputFocus = () => {
        setIsFocused(true);
        labelScale.value = 1.2;
        labelTranslate.value = -2;
        if (typeof onFocus === "function") 
            onFocus();
    }

    const onInputBlur = () => {
        setIsFocused(false);
        labelScale.value = 1;
        labelTranslate.value = 2;
        if (typeof onBlur === "function")
            onBlur();
    }

    const UIBottomMsg = () => {
        if (showError && errorMsg) 
            return (<Text style={[styles.text, myStyles.error, myStyles.bottomMsg]}>{errorMsg}</Text>);
        else if (showHint && hintMsg)
            return (<Text style={[styles.text, myStyles.hint, myStyles.bottomMsg]}>{hintMsg}</Text>);
    }


    return (
        <View style={[myStyles.container, {paddingTop: 13 * PixelRatio.getFontScale()}, style]}>
            {label ?
                <Animated.Text
                    style={[styles.text, labelStyle, labelAnimStyle, myStyles.label]}>
                    {label}
                </Animated.Text> : null}
            <View
                style={[myStyles.inputContainer, inputStyle, childrenStyle]}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
            >{children}</View>
            {UIBottomMsg()}
        </View>
    );
}



const myStyles = StyleSheet.create({
    container: {
        justifyContent: "space-between",
        alignSelf: "flex-start",
        marginBottom: 3
    },
    label: {
        backgroundColor: "white",
        paddingTop: 2,
        paddingBottom: 0,
        paddingHorizontal: 10,
        alignSelf: "flex-start",
        position: "absolute",
        zIndex: 2,
        marginStart: 6,
    },
    inputContainer: {
        backgroundColor: colors.transpBlack,
    },
    error: {
        color: colors.redBtn,
        borderColor: colors.redBtn,
    },
    hint: {
        color: colors.transpBlack,
    },
    bottomMsg: {
        fontSize: 11
    }
});