<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View, Pressable, Text, Modal, TextInput
} from 'react-native';

import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Toast } from 'react-native-toast-message/lib/src/Toast';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Header from "@components/Header";
import OAButton from "@components/OAButton";
import OAFlatList from "@components/OAFlatList";
import OATextInput from "@components/OATextInput";
import { color } from 'react-native-reanimated';



const priceFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });


export default function EditItem({ itemTypeList, editableItem, onRequestClose, isEdit, saveItemFun }) {

    const [selectedItemType, setSelectedItemType] = useState({ name: "" });
    const [comment, setComment] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [iconCancel, setIconCancel] = useState(null);
    const [iconContinue, setIconContinue] = useState(null);
    const [filteredItemList, setFilteredItemList] = useState([]);



    const [sentences, setSentences] = useState({
        addOrder: "Nuovo ordine",
        comment: "Commento",
        quantity: "Quantità",
        new: "Nuovo item",
        edit: "Modifica item",
        cancel: "Annulla",
        type: "Tipo",
        save: "Salva",
        continue: "Continua",
        itemAdded: "Item aggiunto",
        itemUpdated: "Item aggiornato"
    });

    useEffect(() => {
        if (isEdit) {
            fillFields(editableItem);
        }


        Icon.getImageSource("cancel", 60, "white")
            .then(icon => setIconCancel(icon)).catch(() => setIconCancel(""));
        Icon.getImageSource("page-next-outline", 60, "white")
            .then(icon => setIconContinue(icon)).catch(() => setIconCancel(""));
    }, []);

    useEffect(() => {
        setFilteredItemList(itemTypeList);
    }, [itemTypeList])



    const fillFields = (item) => {
        setSelectedItemType(item.itemType);
            setComment(item.comment);
            setQuantity(item.quantity + "");
    }


    const checkFields = () => {
        const itemTypeGood = (selectedItemType ? selectedItemType.name.length > 0 : false);
        const quantityGood = (typeof parseInt(quantity) === "number");
        return itemTypeGood && quantityGood;
    }

    const trySaveAndExit = () => {
        if (checkFields()){
            saveItemFun(selectedItemType, parseInt(quantity), comment, (editableItem ? editableItem.id : null));
            onRequestClose(); // Reopen = false
        }
    }

    const trySaveAndContinue = () => {
        if (checkFields()){
            saveItemFun(selectedItemType, parseInt(quantity), comment,  (editableItem ? editableItem.id : null));
            onRequestClose(true); // Reopen = true
        }
    }


    const UIItemType = (itemType) => {
        const selectedStyle = (selectedItemType && itemType.name === selectedItemType.name) ?
            {
                backgroundColor: colors.transpBlack,
            } : null;
        
        const color = (itemType.available) ? "white" : colors.transpBlack;
        return (
            <>
                <Pressable
                    disabled={!itemType.available}
                    onPress={() => setSelectedItemType(itemType)}
                    style={[myStyles.item.container, selectedStyle]}>
                    <View style={myStyles.item.row}>
                        <Text style={[styles.text, { color }]}>{itemType.shortName}</Text>
                        <Text style={[styles.text, { color }]}>{priceFormatter.format(itemType.price)}</Text>
                    </View>
                    {itemType.comment ? (
                    <Text style={[styles.text, { color }]}>{itemType.comment}</Text>
                    ) : null}
                </Pressable>
            </>
        );
    };


    return (
        <Modal
            animationType='slide'
            transparent={true}
            onRequestClose={onRequestClose}
        >
            <View
                style={[myStyles.container, myStyles.borderRadius]}>
                <Text style={[myStyles.title, styles.text, myStyles.borderRadius]}>{isEdit ? sentences.edit : sentences.new}</Text>
                <View style={myStyles.containerInputs}>
                    <OATextInput
                        value={comment}
                        setValue={setComment}
                        label={sentences.comment}
                        showError={false}
                        errorMsg={false}
                        multiline={true}
                        style={[myStyles.inputs]}
                    />
                    <OATextInput
                        value={quantity}
                        setValue={setQuantity}
                        label={sentences.quantity}
                        keyboardType={"decimal-pad"}
                        showError={false}
                        errorMsg={false}
                        style={[myStyles.inputs]}
                        showSigns={true}
                    />

                        <OAFlatList
                            label={sentences.type}
                            data={filteredItemList}
                            UIItem={UIItemType}
                            style={{ flex: 1 }}
                        >
                            <TextInput
                                style={[styles.text, myStyles.textInput]}
                                value={selectedItemType ? selectedItemType.name : ""}
                            />
                        </OAFlatList>                    
                </View>

                <View style={myStyles.bottomBtns.container}>
                    <OAButton
                        isHorizontal={true}
                        title={sentences.cancel}
                        image={iconCancel}
                        style={myStyles.bottomBtns.secondaryBtn}
                        onPress={onRequestClose}
                        imageStyle={{ width: 20, height: 20, marginStart: 0 }}
                    />
                    <OAButton
                        isHorizontal={true}
                        title={sentences.save}
                        icon={"content-save-outline"}
                        style={myStyles.bottomBtns.primaryBtn}
                        onPress={trySaveAndExit}
                        iconProps={{ size: 14, style: { marginHorizontal: 5 } }}
                    />
                    <OAButton
                        isHorizontal={true}
                        title={sentences.continue}
                        image={iconContinue}
                        style={myStyles.bottomBtns.ternaryBtn}
                        imageStyle={{ width: 20, height: 20, marginEnd: 5 }}
                        onPress={trySaveAndContinue}
                    />
                </View>
            </View>
        </Modal>
    );
}


const myStyles = StyleSheet.create({
    container: {
        justifyContent: "space-between",
        alignItems: 'center',
        backgroundColor: "white",
        flex: 1,
        width: "100%",

    },
    containerInputs: {
        flex: 1,
        paddingHorizontal: 10,
        justifyContent: "space-between",
        width: "100%",
        paddingTop: 10
    },
    inputs: {
        marginBottom: 4,
    },
    title: {
        backgroundColor: colors.color_2,
        padding: 15,
        color: "white",
        alignSelf: "stretch"

    },
    borderRadius: {
        borderWidth: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,


    },
    textInput: {
        paddingVertical: 3,
        height: 35,
        paddingHorizontal: 10,
        marginBottom: 5,
        backgroundColor: "grey",
        color: "white",
        tintColor: "white",
    },

    item: {
        container: {
            alignSelf: "stretch",
            borderRadius: 30,
            borderWidth: 1,
            paddingVertical: 10,
            paddingHorizontal: 15,
            alignItems: "stretch"
        },
        row: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        }
    },

    bottomBtns: {
        container: {
            flexDirection: "row",
            justifyContent: "flex-end",
            alignSelf: "stretch",
            paddingHorizontal: 20,
            marginVertical: 10
        },
        primaryBtn: {
            backgroundColor: colors.greenBtn,
            marginEnd: 10
        },
        secondaryBtn: {
            backgroundColor: colors.redBtn,
            marginEnd: 10,
        },
        ternaryBtn: {
            backgroundColor: colors.color_3
        }
    },


});
