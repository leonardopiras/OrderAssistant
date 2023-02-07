<script src="http://localhost:8097"></script>

import React, { useState } from 'react';
import {
  StyleSheet, TextInput, View, 
} from 'react-native';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import OAInput from '@components/OAInput';
import OAButton from '@components/OAButton';


export default function OATextInput ({value, setValue, label, showError, showSigns,
    errorMsg, showHint, hintMsg, multiline, keyboardType, style,
    onBlur, onFocus}) {
    

    const isDecimal = (keyboardType && (keyboardType == "decimal-pad"));


    const inputStyleMultiline = (multiline) ?
     {
        height:  70,
        textAlignVertical: "top",
        paddingTop: 10,
    } : null;

    const changeNumber = (increment) => {
        setValue(prev => {
                const num = parseInt(prev);
                if (isNaN(num))
                    return prev;
                else
                    return (increment ? num+1 : num-1).toString();
            })
    }

    const UIPlusMinus = isDecimal && showSigns ? (
        <View style={myStyles.plusMinusContainer}>
            <OAButton
                style={{backgroundColor: colors.greenBtn, paddingHorizontal: 20}}
                icon={"plus-thick"}
                isHorizontal={true}
                iconProps={{ size: 15, style: {} }}
                onPress={() => changeNumber(true)}
            />
            <OAButton
                style={{backgroundColor: colors.redBtn, paddingHorizontal: 20}}
                icon={"minus-thick"}
                isHorizontal={true}
                iconProps={{ size: 15, style: {} }}
                onPress={() => changeNumber(false)}
            />
        </View>
    ) : null;

    const UITextInput = (
        <View style={{flexDirection: "row"}}>
            <TextInput
                style={[styles.text, myStyles.textInput, inputStyleMultiline]}
                onChangeText={setValue}
                value={value}
                multiline={multiline}
                keyboardType={keyboardType}
                selectTextOnFocus={true}
                selectionColor={colors.color_2}
                
            />
            {UIPlusMinus}
        </View>
    );


    return (
        <View style={[myStyles.container, style]}>
            <OAInput
                label={label}
                children={UITextInput}
                style={[{ width: "100%"}]}
                showError={showError}
                errorMsg={errorMsg}
                showHint={showHint}
                hintMsg={hintMsg}
                onBlur={onBlur}
                onFocus={onFocus}
            />
        </View>
    );
}



const myStyles = StyleSheet.create({
    textInput: {
        paddingHorizontal: 10,
        fontSize: 14,
        paddingVertical: 2,
        flex:1
    },
    container: {
        flexDirection: "row",
        width: "100%",
    },
    plusMinusContainer: {
        flexDirection: "row",
        alignItems: "stretch",
        flex: 1,
        padding: 10,
        justifyContent: "space-evenly",
        right: 0

    }
});