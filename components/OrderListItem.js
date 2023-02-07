<script src="http://localhost:8097"></script>
import React, { PureComponent, useState, useEffect } from 'react';
import {
  StyleSheet,
  View, FlatList, Pressable, Text
} from 'react-native';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Header from "@components/Header";
import OAButton from "@components/OAButton";
import OAFlatList from "@components/OAFlatList";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Animated, {color, FadeInDown, proc} from 'react-native-reanimated';
import OACheckbox from '@components/OACheckbox';
import Item from '@components/Item';


const priceFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });



export default function OrderListItem({ navigation, order,
    canEdit, isSelected, onLongPress, invertPress}) {

    const [isExpanded, setExpanded] = useState(false);
    const [birthDate, setBirthDate] = useState("");
    const [processDate, setProcessDate] = useState("");
    const [sentences, setSentences] = useState({
        total: "Totale",
        edit: "Modifica",
        seats: "Coperto"
    });

    useEffect(() => {
        const { DateTime } = require("luxon");

        const birth = DateTime.fromSQL(order.birthDate).toLocaleString(DateTime.TIME_24_SIMPLE);
        let process = "U/A";
        if (order.processDate && typeof order.processDate == "string")
            process = DateTime.fromSQL(order.processDate).toLocaleString(DateTime.TIME_24_SIMPLE);
        
        setProcessDate(process);
        setBirthDate(birth);
  },[]);

  const goToEditOrder = () => {
    navigation.navigate("EditOrder", {createMode: false, orderId: order.id });
  }

  const onPress = () => {
    setExpanded(!isExpanded);
  }


  const handlePress = () => {
    if (invertPress)
        onLongPress();
    else 
        onPress();
  }

  const handleLongPress = () => {
    if (invertPress)
        onPress();
    else 
        onLongPress();
  }

  const UITextIcon = (iconName, color, size, text, leftText) => {
    return (
      <View style={{ flexDirection: leftText ? "row" : 'row-reverse', alignItems: "center" }}>
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

    const UIDetailedItem = (item, index) => {
        return (
                <Item
                name={item.itemType.shortName}
                quantity={item.quantity}
                price={item.itemType.price}
                comment={item.comment}
                completed={item.completed}
                    editable={false}
                    hidePrice={false}
                    showStatus={true}
                />
        )
    }

    const UIOrderSeats = order.seats > 0 ? (
     
          <Item
            name={sentences.seats}
            quantity={order.seats}
            price={order.coverCharge}
            onPress={null}
            editable={false}
            hidePrice={false}
            showStatus={true}
            isSeats={true}
          />
        ) : null;

    const UIDetailedList = () => {
        let num = order.itemList.reduce((partialSum, el) => partialSum + (el.itemType.price * el.quantity), 0);
        num += (order.seats * order.coverCharge)
        return (
            <View style={myStyles.checkOut}>
                <FlatList
                    style={myStyles.checkOutList}
                    data={order.itemList}
                    renderItem={({ item, index, separators }) => UIDetailedItem(item, index)}
                    ListFooterComponent={UIOrderSeats}
                />

                <View style={myStyles.checkOutTotal}>
                    { canEdit ? 
                        <OAButton
                        title={sentences.edit}
                        style={{}}
                        icon={"pencil"}
                        isHorizontal={true}
                        iconProps={{ size: 15, style: { marginEnd: 5 } }}
                        onPress={goToEditOrder}
                    /> : <View style={{flex: 1, }}/>
                    }
                    <Text style={[styles.text, myStyles.checkOutTotalText]}>{sentences.total}</Text>
                    <Text style={[styles.text, myStyles.checkOutTotalText]}>{priceFormatter.format(num)}</Text>
                </View>
            </View>
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
            style={[myStyles.container,
            { backgroundColor: isSelected ? colors.grey1 : colors.grey }]}
        >
            <Pressable
                onPress={handlePress}
                onLongPress={handleLongPress}
            >
                <View style={myStyles.row}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={[styles.text, myStyles.text, { width: 14, marginStart: 4 }]}>#</Text>
                        <View style={{ width: 10 }}></View>
                        <Text style={[styles.text, myStyles.text]}>{order.id}</Text>
                    </View>
                    {UITextIcon("account", "rgba(255,255,255,1)", 18, order.owner, false)}
                    {UITextIcon("table-chair", "rgba(255,255,255,1)", 18, order.table, true)}
                </View>
                <View style={myStyles.row}>
                    {UITextIcon("clock-in", "rgba(255,255,255,1)", 18, birthDate, false)}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={[styles.text, myStyles.text]}>x {order.seats}</Text>
                    </View>
                    {UITextIcon("clock-out", "rgba(255,255,255,1)", 18, processDate, true)}
                </View>
                {order.comment ?
                    <Text style={[styles.text]}>{order.comment}</Text>
                    : null
                }
                {UIChipList}
            </Pressable>
            {isExpanded ? UIDetailedList() : null}
        </Animated.View>
    );
}


const myStyles = StyleSheet.create({
    container: {
        borderRadius: 30,
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
        flexDirection: "row",
    },
    checkOutList: {
        borderRadius: 15,
        borderColor: "black",
        marginTop: 5,
        overflow: "hidden"
    },
    checkOutTotal: {
        alignSelf: "stretch",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        marginEnd: 20,
    },
    checkOutTotalText: {
        color: "white",
        marginStart: 10
    },
    comment: {
        width: "100%",
    }
}); 