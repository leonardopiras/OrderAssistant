<script src="http://localhost:8097"></script>

import React, { useState, useEffect } from 'react';
import {
    StyleSheet, TextInput, Text, View, Pressable, NativeModules, FlatList
} from 'react-native';
import Animated, { ZoomInEasyUp, ZoomInEasyDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";




export default function OACheckbox({checked, onChange, children}) {

    const [sentences, setSentences] = useState({
       
    });



    return (
        <Pressable
            onPress={() => onChange(!checked)}
            style={myStyles.container}>
            <View style={myStyles.iconContainer}>
                <Icon
                    name={checked ? "check-square-o" : "square-o"}
                    color={colors.color_8}
                    size={18}
                    style={myStyles.icon}
                />
            </View>

            <View style={myStyles.children}>
                {children}
            </View>
        </Pressable>
    );

}



const myStyles = StyleSheet.create({
   container: {
    alignSelf: "stretch",
    justifyContent: "space-between",
    flexDirection: "row"
   },
   children: {
    flex: 1,
    alignSelf: "stretch"
   },
   icon: {
   },
   iconContainer: {
    width: 25,
    paddingTop: 2,
   }
});