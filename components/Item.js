<script src="http://localhost:8097"></script>
import React, {  useState, useEffect } from 'react';
import {
  StyleSheet,
  View, Pressable, Text
} from 'react-native';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Animated, {FadeInDown} from 'react-native-reanimated';


const priceFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });


export default function Item({ showStatus, onPress, 
    name, quantity, price, comment, completed, isSeats,
}) {

    const [sentences, setSentences] = useState({
    });

    useEffect(() => {

    }, []);


    const UIContent = (
        <View style={myStyles.content}>
            <View style={myStyles.row}>
                <Text style={[styles.text, myStyles.text, myStyles.name]}>{name}</Text>
                <Text style={[styles.text, myStyles.text, myStyles.priceQuantity]}>{quantity > 1 ? price.toFixed(2) : ""}</Text>
                <Text style={[styles.text, myStyles.text, myStyles.quantity]}>x {quantity}</Text>
                <Text
                    style={[styles.text, myStyles.text, myStyles.price]}
                >{priceFormatter.format(price * quantity)}</Text>
            </View>
            {comment ?
                <Text style={[styles.text, myStyles.comment]}>{comment}</Text>
                : null}
        </View>
    );

    const UIIcon = showStatus ? (
        (isSeats ? (<View style={{width:20}}/>) : (
        <Icon
        style={{alignSelf: "center"}}
            name={completed ? "check" : "close"}
            color={completed ? colors.greenBtn : colors.redBtn}
            size={20}
        />))
    ) : null;

    return (
        <Pressable
            onPress={onPress}
            style={myStyles.container}>
            {UIIcon}
            {UIContent}
        </Pressable>
    );
}


const myStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.transpBlack,
        borderWidth: 0.5,
        alignSelf: "stretch",
        flexDirection: "row",
        paddingHorizontal: 5,
        paddingVertical: 5
    },
    content: {
        justifyContent: "space-between",
        alignItems: "stretch",
        alignSelf: "stretch",
        flex: 1
    },
    text: {
        color: "white"
    },
    row: {
        flexDirection: "row",
        alignSelf: "stretch",
        justifyContent: "space-between",
        alignItems: "center",
    },
    price: {
        textAlign: "right",
        paddingRight: 3,
        flex: 1, 
        flexGrow: 3
    },
    quantity: {
        flex: 1,
        flexGrow: 1,
    },
    priceQuantity: {
        flex: 1,
        flexGrow: 2
    },
    name: {
        flex: 1,
        flexGrow: 4
    },

    comment: {
        width: 200
    }
}); 