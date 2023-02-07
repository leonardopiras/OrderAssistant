<script src="http://localhost:8097"></script>

import React, { useState } from 'react';
import {
    StyleSheet, TextInput, Text, View, Switch, Alert
} from 'react-native';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import OAInput from '@components/OAInput';
import OAFullScreen from '@components/OAFullScreen';

export default function OAToggle({ 
    value, setValue, value1, setValue1,
    mainMsg, mainMsg1,
    label, 
    showError,
    errorMsg, showHint, hintMsg, style,
    askConfirm, getWarningMessage, getWarningMessage1,
    onBlur, onFocus, }) {

    const [sentences, setSentences] = useState({
        warning: "Attenzione",
        areUSure: "Sei sicuro di voler modificare lo stato di \"",
        confirm: "Conferma",
        cancel: "Annulla"
    });




    const onChange = (setValFun, newVal, valueIndx) => {
        if (askConfirm) {
            OAFullScreen.showDialog({
                type: "confirmAction",
                description: valueIndx === 0 ? getWarningMessage(newVal) : getWarningMessage1(newVal),
                onPressPrimaryBtn: () => setValFun(newVal),
            });
        } else
            setValFun(newVal);
    }
   

    const UIRow = (val, setVal, msg, valueIndx) => {
        return (
            <View style={myStyles.row}>
                <Text style={[styles.text, myStyles.text]}>{msg}</Text>

                <Switch
                    value={val}
                    trackColor={{ true: colors.color_2, false: colors.transpBlack }}
                    thumbColor={colors.color_8}
                    onValueChange={v => onChange(setVal, v, valueIndx)}
                />

            </View>
        );
    }

    const UIToggle = (
       <View style={myStyles.container}>
            {UIRow(value, setValue, mainMsg, 0)}
            {typeof value1 === "boolean" ? UIRow(value1, setValue1, mainMsg1, 1) : null}
       </View>
    );


    return (
        <OAInput
            label={label}
            children={UIToggle}
            style={[myStyles.input, style]}
            showError={showError}
            errorMsg={errorMsg}
            showHint={showHint}
            hintMsg={hintMsg}
            onBlur={onBlur}
            onFocus={onFocus}
        />
    );
}



const myStyles = StyleSheet.create({
    input: {
        alignSelf: "stretch"
    },
    toggle: {
    },
    text: {
        color: "white"
    },
    container: {
        marginHorizontal: 20, 
    },
    row: {
        justifyContent: "space-between",
        flexDirection: "row",
        alignSelf: "stretch",
        marginVertical: 5,
        alignItems: "center"
    }
}); 