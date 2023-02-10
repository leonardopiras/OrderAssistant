
<script src="http://localhost:8097"></script>
import React, {  useEffect, useState } from 'react';
import {
  StyleSheet, View, 
   Pressable, Text, LogBox, Modal
} from 'react-native';


import styles from '@styles/DefaultStyles';
import colors from '@styles/Colors';

export default function CustomDialog({
    title, 
    description,
    children,  
    primaryBtn, 
    secondaryBtn, 
    ternaryBtn,
    onPressPrimaryBtn, 
    onPressSecondaryBtn,
    onPressTernaryBtn,
    animationType,
    isVisible,
    onRequestClose, 
    height,
}) {

        return (
            <Modal
            animationType={animationType ? animationType : "fade"}
            transparent={true}
            visible={isVisible}
            onRequestClose={onRequestClose}
        >       
           {getDialog(title,
            description,
            children,
               primaryBtn,
               secondaryBtn,
               ternaryBtn,
               onPressPrimaryBtn,
               onPressSecondaryBtn,
               onPressTernaryBtn,
               height, null)}

            </Modal>

        );
}

export const getDialog = (title,
    description,
    children,
    primaryBtn,
    secondaryBtn,
    ternaryBtn,
    onPressPrimaryBtn,
    onPressSecondaryBtn,
    onPressTernaryBtn,
    height, style) => {
    return (
        <View style={[myStyles.containerExternal]}>
        <View style={[myStyles.conteinerInternal, { height }]}>
            {title ? <Text style={[styles.text, myStyles.title]}>{title}</Text> : null}
            {description ? <Text style={[styles.text, myStyles.description]}>{description}</Text> : null}
            {children ? children : null}
            {(primaryBtn || secondaryBtn || ternaryBtn) ? (
                <View style={myStyles.btnContainer}>
                    {ternaryBtn ?
                        <Pressable style={[styles.button, myStyles.btn, myStyles.ternaryBtn]}
                            onPress={onPressTernaryBtn}>
                            <Text style={[styles.text, myStyles.text]}>{ternaryBtn}</Text>
                        </Pressable> : null}
                    {secondaryBtn ?
                        <Pressable style={[styles.button, myStyles.btn, myStyles.secondaryBtn]}
                            onPress={onPressSecondaryBtn}>
                            <Text style={[styles.text, myStyles.text]}>{secondaryBtn}</Text>
                        </Pressable> : null}
                    {primaryBtn ?
                        <Pressable style={[myStyles.btn, myStyles.primaryBtn]}
                            onPress={onPressPrimaryBtn}>
                            <Text style={[styles.text, myStyles.text]}>{primaryBtn}</Text>
                        </Pressable> : null}
                </View>
            ) : null}
        </View>
        </View> 

        );


}

const myStyles = StyleSheet.create({
    text: {
        color: "white",
    },
    title: {
        color: "black",
        fontSize: 22,
        marginBottom: 10,
    },
    description: {
        color: "black",
        fontSize: 18,
    },
    btn: {
        borderRadius: 18,
        paddingHorizontal: 15,
        paddingVertical: 10
    },
    primaryBtn: {
        backgroundColor: colors.greenBtn,
    },
    secondaryBtn: {
        backgroundColor: colors.redBtn, 
        marginEnd: 10
    },
    ternaryBtn: {
        backgroundColor: colors.color_3,
        position: "absolute",
        left: 0
    },
    btnContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 15,
    },
    containerExternal: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 1
    },
    conteinerInternal: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "white",
        width: "85%",
        justifyContent: "space-between",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'grey',
        zIndex: 100,
    },
    
});