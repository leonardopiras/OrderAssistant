<script src="http://localhost:8097"></script>

import React, { useState, useEffect } from 'react';
import {
    StyleSheet, TextInput, Text, View, Pressable
} from 'react-native';
import Animated, { ZoomInEasyUp, ZoomInEasyDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import OAInput from '@components/OAInput';
import OAButton from '@components/OAButton';


export default function OAFileInput({ fileName, onEndUpload, label, showError,
    errorMsg, showHint, hintMsg, style }) {


    const [sentences, setSentences] = useState({
        upload: "Carica",
        chooseFont: "Carica da..",
        gallery: "Galleria",
        camera: "Fotocamera"
    });



    const Upload = async (from) => {
        let res = null;
        const option = { mediaType: "photo" }
        if (from === "gallery")
            res = await launchImageLibrary(option);
        else if (from === "camera")
            res = await launchCamera(option);
        if (!res.didCancel && !res.errorCode && res.assets.length === 1) {
            onEndUpload( res.assets[0].uri.replace("file://", ""));
        }
    };

    const UIRow_2 = (
        <View style={myStyles.row_2}>
            {fileName ?
                (<>
                    <Icon
                        size={12}
                        name="check"
                        color={colors.greenBtn}
                    />
                    <Text style={[styles.text, myStyles.fileName]}>{fileName}</Text>
                </>) : null}
        </View>
    );

    const UIRow_1 = (
        <Animated.View style={myStyles.row_1}
            entering={ZoomInEasyUp}
        >
            <OAButton
                isHorizontal={true}
                title={sentences.gallery}
                icon={"image"}
                style={myStyles.btn}
                onPress={() => Upload("gallery")}
                iconProps={{ size: myStyles.icon.iconSize, style: myStyles.icon }}
            />
            <OAButton
                isHorizontal={true}
                title={sentences.camera}
                icon={"camera"}
                style={myStyles.btn}
                onPress={() => Upload("camera")}
                iconProps={{ size: myStyles.icon.iconSize, style: myStyles.icon }}
            />
        </Animated.View>
    );

    return (
        <OAInput
            label={label}
            style={[{ width: "100%" }, style]}
            showError={showError}
            errorMsg={errorMsg}
            showHint={showHint}
            hintMsg={hintMsg}
        >
            <View style={myStyles.container}>
                {UIRow_1}
                {UIRow_2}
            </View>
        </OAInput>
    );
}



const myStyles = StyleSheet.create({
    container: {
        padding: 5,
        paddingTop: 14,
    },
    row_1: {
        flexDirection: "row",
    }
    ,
    row_2: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 5,
        height: 12
    },
    btn: {
        height: 30,
        paddingHorizontal: 5,
        marginStart: 10,
        marginBottom: 5
    },
    icon: {
        marginEnd: 5,
        iconSize: 15
    },
    fileName: {
        marginStart: 5,
        marginEnd: 10,
        padding: 0,
        marginBottom: 0,
        fontSize: 10

    }

});