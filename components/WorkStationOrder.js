<script src="http://localhost:8097"></script>
import React, { PureComponent, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  NativeModules, FlatList, Pressable, Text
} from 'react-native';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Animated, {color, FadeInDown} from 'react-native-reanimated';
import OACheckbox from '@components/OACheckbox';
import OAFullScreen from '@components/OAFullScreen';
import { Toast } from 'react-native-toast-message/lib/src/Toast';



const { OAMainModule } = NativeModules;


export default function WorkStationOrder({order}) {
   
    const [isExpanded, setExpanded] = useState(false);
    const [date, setDate] = useState("");
  const [sentences, setSentences] = useState({
    errorComplete: "Impoossibile completare l'ordine"
  });

  useEffect(() => {
    const { DateTime } = require("luxon");
    const newDate = DateTime.fromSQL(order.birthDate).toLocaleString(DateTime.TIME_24_SIMPLE);
    setDate(newDate);
    
  },[]);

  const UITextIcon = (iconName, color, size, text, leftText) => {
    return (
      <View style={{ flexDirection: leftText ? "row" : 'row-reverse' }}>
        <Text style={[styles.text, myStyles.text]}>{text}</Text>
        <View style={{width:10}}></View>
        <Icon
          name={iconName}
          color={color}
          size={size}
        />
      </View>
    );
  }

  const setItemCompleted = (item) => {
    OAFullScreen.setLoading(true);
    OAMainModule.setItemCompleted(order.id, item.id, !item.completed, good => {
        OAFullScreen.setLoading(false);
        if (!good) {
            Toast.show({
                type: "error",
                text1: sentences.errorComplete
              });
        }
    });
  }

    const UICheckboxItem = (item, index) => {
        return (

            <OACheckbox
                checked={item.completed}
                onChange={() => setItemCompleted(item)}                
            >
                    <View style={myStyles.row}>
                        <Text style={[styles.text, myStyles.checkBoxText]}>{item.itemType.shortName}</Text>
                        <Text style={[styles.text, myStyles.checkBoxText]}>x {item.quantity} </Text>                        
                    </View>
                    {item.comment ?
                        <Text style={[styles.text, myStyles.comment]}>{item.comment} </Text>
                        : null}
            </OACheckbox>

        );
    }

    const UIChipList = !isExpanded ?
        (<View style={myStyles.chipList}>
            {order.itemList.map((item, indx) => {
                return (
                    <View
                        key={item.id}
                        style={myStyles.chipText}>
                        <Text style={[styles.text, myStyles.text]}>{item.quantity} </Text>
                        <Text style={[styles.text, myStyles.text]}>{item.itemType.shortName}</Text>
                    </View>);
            })}
        </View>) : null;

    return (
        <Animated.View
            style={myStyles.container}
        >
            <Pressable
                onPress={() => setExpanded(!isExpanded)}
            >
                <View style={myStyles.row}>

                    {UITextIcon("music-accidental-sharp", "rgba(255,255,255,1)", 18, order.id, false)}
                    {UITextIcon("table-chair", "rgba(255,255,255,1)", 18, order.table, true)}
                </View>
                <View style={myStyles.row}>
                    {UITextIcon("account", "rgba(255,255,255,1)", 18, order.owner, false)}
                    {UITextIcon("clock-outline", "rgba(255,255,255,1)", 18, date, true)}
                </View>
                {order.comment ?
                    <Text style={[styles.text]}>{order.comment}</Text>
                    : null
                }
                {UIChipList}
            </Pressable>
            {isExpanded ?
              <FlatList
              style={myStyles.checkBoxList}
              data={order.itemList}
              ItemSeparatorComponent={<View style={{ height: 1, backgroundColor: colors.transpBlack, marginVertical: 10 }} />}
              renderItem={({ item, index, separators }) => UICheckboxItem(item, index)}
            />
                : null}
        </Animated.View>
    );
}


const myStyles = StyleSheet.create({
    container: {
        borderRadius: 30,
        backgroundColor: colors.grey,
        alignSelf: "stretch",
        paddingVertical: 10,
        paddingHorizontal: 20
    },
    text: {
        color: "white"
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignSelf: "stretch", 
        flex: 1,
    },
    chipList: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignContent: "space-around",
    },
    chipText: {
        backgroundColor: colors.transpBlack,
        borderRadius: 30,
        marginEnd: 10,
        paddingHorizontal: 7,
        paddingVertical: 1,
        marginVertical: 2,
        flexDirection: "row"
    },
    checkBoxList: {
        padding: 10,
        backgroundColor: colors.transpBlack,
        borderRadius: 10,
        marginTop: 5,
    },
    checkBoxItem: {
    },
    checkBoxText: {
        color: "white",
    },
    comment: {
        width: "100%",
    }
}); 