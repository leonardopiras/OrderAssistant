
<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, LogBox, DeviceEventEmitter
} from 'react-native';


import styles from '@styles/DefaultStyles';
import OATextInput from '@components/OATextInput';
import ItemCatsInput from '@components/ItemCatsInput';
import Header, {screens} from '@components/Header'
import OAButton from '@components/OAButton';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import OAViewPager from '@components/OAViewPager';
import OAToggle from '@components/OAToggle';


export default function EditItemType({
    navigation, route
}) {
    const [name, setName] = useState(route.params.itemType.name);
    const [shortName, setShortName] = useState(route.params.itemType.shortName);
    const [description, setDescription] = useState(route.params.itemType.description);
    const [price, setPrice] = useState("");
    const [itemCats, setItemCats] = useState(route.params.itemType.itemCats);
    const [available, setAvailable] = useState(route.params.itemType.available);
    const [comment, setComment] = useState(route.params.itemType.comment);
    const [isOnWS, setIsOnWS] = useState(route.params.isOnWS);
    
    const [selectedViewPagerIndx, setSelectedViewPagerIndx] = useState(route.params.isOnWS ? 1 : 0);

    const [otherItems, setOtherItems] = useState([])
    const [errors, setErrorsArr] = useState({})
    const [sentences, setSentences] = useState({
        cancel: "Annulla",
        editItem: "Modifica item",
        save: "Salva",
        name: "Nome",
        shortName: "Nome breve",
        description: "Descrizione",
        price: "Prezzo",
        cancel: "Annulla",
        errEmptyField: "Campo vuoto",
        errFieldExist: "Questo campo è gia presente",
        errPrice: "Prezzo non valido",
        comment: "Commento",
        availableLab: "Disponibilità",
        availableMsg: "Item disponibile",
    });

    useEffect(() => {
        //const sessionCats = route.params.sessionCats;
        Header.initScreen(screens.EditItemType, {
            onResume: handleResume,
            headerProps: {
                title: sentences.editItem
            }
          });
        return () => {
            Header.removeScreen(screens.EditItemType);
        }
    }, []);

    const handleResume = () => {
        const price = route.params.itemType.price; 
        setPrice(price ? price.toFixed(2).toString() : "");
        setOtherItems(route.params.itemTypeList.filter(el => el.name !== route.params.itemType.name));
    }


    const setError = (errorFieldName, isError, msg) => { 
        setErrorsArr(prev => {
            let newErrs = {};
            if (prev)
                newErrs = JSON.parse(JSON.stringify(prev));
            newErrs[errorFieldName] = {show: isError, msg: msg};
            return newErrs;
        });
        return isError;
    }

    const checkErrorsName = () => {
        if (!name)
            return setError("name", true, sentences.errEmptyField);
        else if (otherItems.find(el => el.name === name))
            return setError("name", true, sentences.errFieldExist);
        else 
            return setError("name", false, "");
    }

    const checkErrorsPrice = () => {
        if (!price || price === "")
            return setError("price", true, sentences.errEmptyField);
        else if (!checkEmptyField(price, "price")) 
            return setError("price", isNaN(parseFloat(price)), sentences.errPrice);
        else 
            return setError("price", false, "");

    }

     const checkEmptyField = (field, fieldName) => {
        return setError(fieldName,  (!field || field === ""), sentences.errEmptyField);
    }

    const trySaveAndExit = () => {
        const nameOnError = checkErrorsName();
        const shortNameOnError = checkEmptyField(shortName, "shortName");
        const descriptionOnError = checkEmptyField(description, "description");
        const priceOnError = checkErrorsPrice();


        if (!(nameOnError || shortNameOnError || descriptionOnError || priceOnError))
            saveAndExit();
    }

    const saveAndExit = () => {
        const newItemType =  {
            name: name,
            shortName: shortName,
            description: description,
            price: parseFloat(price),
            id: route.params.itemType.id,
            itemCats: itemCats,
            available: typeof available === "boolean" ? available : true, 
            comment: comment ? comment : "",
        }
        DeviceEventEmitter.emit("seItemTypeList", (prev => {
            return prev.map((el,indx) => {return (el.id == newItemType.id) ? newItemType : el});
        }));
        Header.goBack();
    }

    const shouldIShowError = (fieldName) => {
        return (errors && fieldName in errors) ? errors[fieldName].show : false;
    }

    const getMsgError = (fieldName) => {
        return (errors && typeof errors[fieldName] !== "undefined") ? errors[fieldName].msg : "";
    }

    const UIScreen1 = (
<KeyboardAwareScrollView style={myStyles.content} 
            >
                <OATextInput
                    value={name}
                    setValue={setName}
                    label={sentences.name}
                    showError={shouldIShowError("name")}
                    errorMsg={getMsgError("name")}
                    style={myStyles.inputs}
                />
                <OATextInput
                    value={shortName}
                    setValue={setShortName}
                    label={sentences.shortName}
                    showError={shouldIShowError("shortName")}
                    errorMsg={getMsgError("shortName")}
                    style={myStyles.inputs}

/>
                <OATextInput
                    value={description}
                    setValue={setDescription}
                    label={sentences.description}
                    showError={shouldIShowError("description")}
                    errorMsg={getMsgError("description")}
                    multiline={true}
                    style={[myStyles.inputs, myStyles.flexShrink]}
                />
                <OATextInput
                    value={price}
                    setValue={setPrice}
                    label={sentences.price}
                    keyboardType={"decimal-pad"}
                showError={shouldIShowError("price")}
                errorMsg={getMsgError("price")}
                style={myStyles.inputs}
            />

            <ItemCatsInput
                itemCats={itemCats}
                setItemCats={setItemCats}
                style={[myStyles.inputs, myStyles.flexGrow, { flex: 1 }]}
                sessionCats={route.params.sessionCats}

            />
        </KeyboardAwareScrollView>
    );

    const UIScreen2 = isOnWS ? (
        <>
            <OATextInput
                value={comment}
                setValue={setComment}
                label={sentences.comment}
                showError={false}
                multiline={true}
                style={[myStyles.inputs, myStyles.flexShrink]}
            />
            <OAToggle
                value={available}
                setValue={setAvailable}
                label={sentences.availableLab}
                showError={false}
                mainMsg={sentences.availableMsg}
                style={{}}
            />

        </>
    ) : null;

    return (

        <View style={myStyles.container}
        >
            <OAViewPager
                pageStyle={{ padding: 10 }}
                showIndicator={isOnWS}
                UI_1={UIScreen1}
                UI_2={UIScreen2}
                numOfPages={isOnWS ? 2 : 1}
                selectedIndx={selectedViewPagerIndx}
                setSelectedIndx={setSelectedViewPagerIndx}
                showBtns={true}
                trySaveAndExit={trySaveAndExit}
                goBack={Header.goBack}
            />
        </View>
    );

}

const myStyles = StyleSheet.create({
    bottomBtns: {
        container: {
            flexDirection: "row",
            height: 45,
            padding: 6,
            justifyContent: "flex-end",
        },
        primaryBtn: {
            backgroundColor: colors.greenBtn,
            marginEnd: 10
        },
        secondaryBtn: {
            backgroundColor: colors.redBtn,
            marginEnd: 10,
        },
    },
    flexShrink: {
        flexShrink: 2
    },
    flexGrow: {
        flexGrow: 2
    },
    inputs: {
        marginBottom: 6
    },
    container: {
        height: "100%",
        flex: 1,
    },
    content: {
        marginHorizontal: 10,
        flex: 1,
        height: "100%",
        paddingTop: 5
    }
});