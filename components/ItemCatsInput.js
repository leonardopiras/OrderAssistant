<script src="http://localhost:8097"></script>

import React, { useState, useEffect } from 'react';
import {
    StyleSheet, TextInput, Text, View, Pressable, NativeModules, FlatList
} from 'react-native';
import Animated, { ZoomInEasyUp, ZoomInEasyDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import OAInput from '@components/OAInput';
import OAButton from '@components/OAButton';

const { ManageConfigurationsModule } = NativeModules;


export default function ItemCatsInput({ itemCats, setItemCats, showError,
    errorMsg, showHint, hintMsg, style, label, sessionCats}) {


    const [allCats, setAllCats] = useState([]);
    const [newCatstext, setNewCatsText] = useState("");

    const [sentences, setSentences] = useState({
        categories: "Categorie",
        addCat: "Aggiungi",
        newCats: "Nuova categoria..."
    });


    useEffect(() => {
        NativeModules.ManageConfigurationsModule.loadItemCats((cats) => {
            const selCats = itemCats.map((el, index) => { return { name: el, selected: true } });
            let otherCats = (sessionCats && sessionCats.length > 0) ? sessionCats : [];
            if (cats && Array.isArray(cats)) {
                cats.forEach(cat => {
                    if (!otherCats.includes(cat))
                        otherCats.push(cat);
                });
                for(cat in cats){
                    
                }
            }
            if (itemCats && itemCats.length > 0)
                otherCats = otherCats.filter(el => !itemCats.includes(el))
            
            const othrCats = otherCats.map((el, indx) => {
                 return { name: el, selected: false };
            });

            const arr = [...selCats, ...othrCats];
            setAllCats(arr);
        });

    }, []);

    const addCat = (newCat) => {
        if (newCat !== "" && !allCats.find(el => el.name === newCat)) {
            const arr = [{ name: newCat, selected: true }, ...allCats];
            setAllCats(arr);
            setItemCats(prev => { return [...prev, newCat] });
            setNewCatsText("");
        }
    };

    const changeCatSelected = (cat) => {
        const cats = allCats.map((el) => {
            return { name: el.name, selected: (el.name === cat.name) ? !el.selected : el.selected }
        });
        setItemCats(cats.filter(el => el.selected).map(el => el.name));
        setAllCats(cats);
    }

    const UIAddCatsRow = (
        <View style={myStyles.catsInput.container}>
            <TextInput
                style={[myStyles.catsInput.input, styles.text]}
                placeholder={sentences.newCats}
                value={newCatstext}
                onChangeText={setNewCatsText}
            />
            <OAButton
                isHorizontal={true}
                //title={sentences.addCat}
                icon={"plus"}
                style={myStyles.catsInput.btn}
                onPress={() => addCat(newCatstext)}
                iconProps={{ size: 14, style: { marginHorizontal: 5 } }}
            />

        </View>

    );

    const UICheckListItem = (item) => {

        if (item) {
            return (
                <Pressable
                    onPress={() => changeCatSelected(item)}
                    style={myStyles.item.container}                >
                    <Icon
                        name={item.selected ? "check-square-o" : "square-o"}
                        color={colors.color_8}
                        size={18}
                    />
                    <Text style={[styles.text, myStyles.item.text]}>{item.name}</Text>

                </Pressable>
            );
        }
    };

    const UIItemSeparator = (
        <View style={{ width: "100%", height: 1, backgroundColor: colors.transpBlack, marginHorizontal: 5 }} />
    );

    return (
        <OAInput
            label={label ? label : sentences.categories}
            style={[{ width: "100%" }, style]}
            showError={showError}
            errorMsg={errorMsg}
            showHint={showHint}
            hintMsg={hintMsg}
        >
            <View style={myStyles.container}>

                {UIAddCatsRow}
                <FlatList
                    style={myStyles.flatList}
                    data={allCats}
                    ItemSeparatorComponent={UIItemSeparator}
                    renderItem={({ item, index, separators }) => UICheckListItem(item)}
                />
            </View>
        </OAInput>
    );
}



const myStyles = StyleSheet.create({
    container: {
        padding: 5,
        paddingTop: 14,
        height: "100%"
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
    flatList: {
        margin: 6,
        paddinTop: 6
    },
    item: {
        container: {
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingVertical: 6
        },
        text: {
            fontSize: 15,
            color: "white",
            marginStart: 4
        }
    },
    catsInput: {
        container: {
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            paddingHorizontal: 5
        },
        input: {
            flex: 6,
            backgroundColor: colors.transpBlack,
            padding: 1,
            paddingHorizontal: 5,
        },
        btn: {
            paddingHorizontal: 10,
            marginStart: 5,
        }
    }
});