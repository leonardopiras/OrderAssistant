<script src="http://localhost:8097"></script>

import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, TextInput, Text, View, Pressable, NativeModules, FlatList
} from 'react-native';
import Animated, { ZoomInEasyUp, ZoomInEasyDown } from 'react-native-reanimated';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import OAInput from '@components/OAInput';
import OAButton from '@components/OAButton';

const { ManageConfigurationsModule } = NativeModules;


export default function OAFlatList({ 
    label, data, UIItem, ListFooterComponent,
    onPressBtn, sentenceBtn, imageBtn, style,
children}) {

    const [addBtnVisible, setAddBtnVisible] = useState(true);
    const focusSem = useRef(0);
    const flatListRef = useRef();


    useEffect(() => {
        onFocus();

    }, []);


    const onFocus = () => {
        const semValue = focusSem.current + 1;
        focusSem.current = semValue;
        setAddBtnVisible(true);
        setTimeout(() => {
            if (semValue === focusSem.current) {
                setAddBtnVisible(false);
                focusSem.current = 0;
            }
        }, 10000);
    }

    const onPressAddBtn = () => {
        if (onPressBtn());
            flatListRef.current.scrollToEnd();
    }

    return (
        <OAInput
        style={[myStyles.oaInputContainer, style]}
        childrenStyle={{flex: 1}}
        label={label}
      >
        <Pressable 
        onPress={onFocus}
        style={{padding: 10, flex: 1}}>
        {children}
        <FlatList
          style={myStyles.list}
          data={data}
          //stickyHeaderIndices={children ? [0] : []}
          //ListHeaderComponent={children}
          onScrollBeginDrag={onFocus}
          ItemSeparatorComponent={<View style={{ height: 3 }} />}
          ListFooterComponent={ListFooterComponent ? ListFooterComponent : <View style={{ height: 50, width: "100%" }} />}
          renderItem={({ item, index, separators }) => UIItem(item, index, separators)}
          ref={flatListRef}
        />
        </Pressable>

        {sentenceBtn && (addBtnVisible || data.length === 0) ? 
        <OAButton
          onPress={onPressAddBtn}
          title={sentenceBtn}
          isHorizontal={true}
          image={imageBtn ? imageBtn : require('@images/icons/plus.png')}
          entering={ZoomInEasyUp.delay(200)}
          exiting={ZoomInEasyDown}
          style={myStyles.addBtn}
          imageStyle={{ width: 20, height: 20 }}
        /> : null }
  
      </OAInput>
    );
}



const myStyles = StyleSheet.create({
    oaInputContainer: {
        flex: 1,
        width: "100%",
    },
    addBtn: {
        position: "absolute",
        bottom: 5,
        alignSelf: "center"
    },
    list: {
        flex: 1,
        paddingVertical: 10,
      },
});