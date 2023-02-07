<script src="http://localhost:8097"></script>
import React, { useState, useEffect, Component } from 'react';
import {
    StyleSheet, View, Image, NativeModules,
    Pressable, Text, LogBox, NativeEventEmitter, BackHandler,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createNavigationContainerRef } from '@react-navigation/native';
import { MenuItem, OverflowMenu } from '@ui-kitten/components';


LogBox.ignoreLogs(['new NativeEventEmitter', "VirtualizedLists"]);

import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";


export const naviRef = createNavigationContainerRef()
let instance = null;
let backHandlerSub = undefined;

export const screens = {
    Home: 1,
    WaitRoom: 2,
    WorkService: 3,
    WorkStation: 4,
    EditOrder: 5,
    ConfigurationList: 6,
    ManageConfiguration: 7,
    EditItemType: 8,
    Cashier: 9,
    ProcessedOrders: 10
};

let backPressCbs = {};
let resumeCbs = {};
let updateCbs = {};
let propsMap = {};

export default class Header extends Component {

    constructor(props) {
        super(props);
        this.state = {
            title: "",
            profilePic: false,
            canGoBack: false,
            right: null,
            selected: 0,
            onPressSelected: null,
            sentences: {
                selected: "Selezionati"

            },
            menuData: undefined,
            menuVisible: false,
        }
    }

    static handleBackPress =(self) => {
        console.log("backpress");
        Header.goBack();
        return true;
    }

    componentDidMount() {
        instance = this;
        console.log("Header mount");
        const eventEmitter = new NativeEventEmitter(NativeModules.OAMainModule);
        eventEmitter.addListener("update", this.handleUpdateEvent);
    }

    componentDidUpdate() {
        instance = this;
    }

    componentWillUnmount() {
        instance = null;
     }

  

    handleUpdateEvent({type}) {
        if (naviRef.isReady()) {
            const navState = naviRef.current.getState();
            const curr = Header.parseScreen(navState.routes[navState.index].name);
            if (typeof updateCbs[curr] === "function") {
                console.log("update " + type + navState.routes[navState.index].name);
                updateCbs[curr](type);
            }
        } else
            console.error("update with naviref not ready");
    }

    // const appStateSub = AppState.addEventListener("change", nextAppState => {
    //     if (nextAppState === "active") {
    //       onResume();
    //     }
    //   });

    static initScreen = (curr, {onResume, onUpdate, onBackPress, headerProps}) => {
        console.log("init " + Header.parseScreenConst(curr));
        console.log({onResume, onUpdate, onBackPress, headerProps});
        onResume(true);
        resumeCbs[curr] = onResume;
        updateCbs[curr] = onUpdate;
        backPressCbs[curr] = onBackPress;
        propsMap[curr] = headerProps;
        if (typeof headerProps === 'object') 
            Header.setHeader(headerProps);
        if (typeof backHandlerSub !== "undefined") {
            backHandlerSub.remove();
            backHandlerSub = undefined;
        }
        backHandlerSub = BackHandler.addEventListener('hardwareBackPress', Header.handleBackPress);   
    }

    static removeScreen = (curr) => {
        console.log("remove " + Header.parseScreenConst(curr));
        resumeCbs[curr] = undefined;
        updateCbs[curr] = undefined;
        backPressCbs[curr] = undefined;    
        propsMap[curr] = undefined;
    }

    static goBack = () => {
        if (naviRef.isReady()) {
            const navState = naviRef.current.getState();
            if (navState.index > 0) {
                const curr = Header.parseScreen(navState.routes[navState.index].name);
                const next = Header.parseScreen(navState.routes[(navState.index-1)].name);
                if (typeof backPressCbs[curr] !== "function" || backPressCbs[curr]()) {
                    if (typeof resumeCbs[next] === "function") {
                        console.log("triggering onResume " + navState.routes[(navState.index-1)].name);
                        resumeCbs[next](false);
                    }
                    if (typeof propsMap[next] === "object")
                        Header.setHeader(propsMap[next]);
                   naviRef.goBack();
                }
            }
        } else
            console.log("Naviref not ready");
    }

    static parseScreen(str) {
        if (str === "Home")
            return screens.Home;
        else if (str === "WaitRoom")
            return screens.WaitRoom;
        else if (str === "WorkService")
            return screens.WorkService;
        else if (str === "WorkStation")
            return screens.WorkStation;
        else if (str === "EditOrder")
            return screens.EditOrder;
        else if (str === "ConfigurationList")
            return screens.ConfigurationList;
        else if (str === "ManageConfiguration")
            return screens.ManageConfiguration;
        else if (str === "EditItemType")
            return screens.EditItemType;
        else if (str === "Cashier")
            return screens.Cashier;
        else if (str === "ProcessedOrders")
            return screens.ProcessedOrders;
        return -1;
    } 
    
    static parseScreenConst(str) {
        if (str === screens.Home)
        return "Home";
        if (str === screens.WaitRoom)
        return "WaitRoom";
        if (str === screens.WorkService)
        return "WorkService";
        if (str === screens.WorkStation)
        return "WorkStation";
        if (str === screens.EditOrder)
        return "EditOrder";
        if (str === screens.ConfigurationList)
        return "ConfigurationList";
        if (str === screens.ManageConfiguration)
        return "ManageConfiguration";
        if (str === screens.EditItemType)
        return "EditItemType";
        if (str === screens.Cashier)
        return "Cashier";
        if (str === screens.ProcessedOrders)
            return "ProcessedOrders";
        return "Not found";
    }




    /****************************************************
     * Set Header
     ****************************************************/

    static setHeader = ({ title,
        canGoBack,
        profilePic, onPressProfilePic,
        right,
        menuData
    }) => {
        if (Header.hasErrors())
            return;

        instance.setState({
            title: title,
            canGoBack: typeof canGoBack === "boolean" ? canGoBack : true,
            profilePic: profilePic, onPressProfilePic: onPressProfilePic,
            right: right,
            menuData: menuData
        })
    }

    static setRight = (right) => {
        if (Header.hasErrors())
            return;
        instance.setState({ right: right })
    }

    static setSelected = (quantity, onPressSelected) => {
        if (Header.hasErrors())
            return;
        instance.setState({selected: quantity, onPressSelected: onPressSelected});
    }

    static hasErrors = () => {
        const errors = instance === null;
        if (errors)
            console.error("Instance is null");
        return errors;
    }

    closeMenu = () => { this.setState({menuVisible: false}); }

    onItemSelect = (index) => {
        if (typeof this.state.menuData[index].fun === "function") {
            this.closeMenu();
            this.state.menuData[index].fun();
        }
    }

    UIProfilePic = () => {
        return (
            <Pressable 
            style={myStyles.profilePicPress} 
            onPress={this.state.onPressProfilePic}>
                <Icon
                    name={"account-edit-outline"}
                    color={"white"}
                    size={25}
                />
            </Pressable>
        );
    }

    UIMenuPlaceHolder = () => {
        return (
            <Pressable
                onPress={() => this.setState({ menuVisible: true })}
            >
                <Icon name="dots-vertical"
                    color={"white"}
                    size={30}></Icon>
            </Pressable>
        )
    }


    UIRight = () => {
        if (typeof this.state.menuData !== "undefined")
        return (
            <OverflowMenu
                anchor={this.UIMenuPlaceHolder}
                backdropStyle={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                visible={this.state.menuVisible}
                onSelect={info => this.onItemSelect(info.row)}
                onBackdropPress={this.closeMenu}>
                {this.state.menuData.map((el,indx) => {return (<MenuItem key={el.title} title={el.title} />)})}
            </OverflowMenu>
        );
        if (this.state.right)
            return this.state.right;
        if (this.state.selected)
            return (
                <Pressable
                    onPress={this.state.onPressSelected}
                >
                    <Text style={[styles.text, myStyles.textSelected]}>{this.state.sentences.selected} ({this.state.selected})</Text>
                </Pressable>
            );
    }
    UILeft = () => {
        if (this.state.profilePic)
            return this.UIProfilePic();
        if (this.state.canGoBack) return (
            <Pressable style={myStyles.backBtnPress}
                onPress={Header.goBack}>
                <Icon name="arrow-left-bold"
                    color={"white"}
                    size={30}></Icon>
            </Pressable>
        );
    }

    render() {
        return (
            <View style={myStyles.headerContainer}>
                <View style={myStyles.row1}>
                    <View style={myStyles.left}>
                        {this.UILeft()}
                    </View>
                    <View style={myStyles.center}>
                        <Image style={myStyles.OAIcon} source={require('@images/icons/oa_icon.png')} />
                    </View>

                    <View style={myStyles.right}>
                        {this.UIRight()}
                    </View>
                </View>
                <View style={myStyles.row2}>
                    {this.state.title ?
                        <Text style={[styles.text, myStyles.title]}>{this.state.title}</Text> :
                        <View style={{ height: 8 }} />}
                </View>
            </View>
            );
        
    }
}


const myStyles = StyleSheet.create({
    title: {
        color: "white",
        fontSize: 18,
        textAlign: "center",
        margin: 0,
        padding: 0,
        textAlignVertical: "top",
    },
    backBtn: {
        width: "100%",
        height: "100%"
    },
    backBtnPress: {
        width: 40,
        height: 30
    },
    left: {
        flex: 2,
    },
    center: {
        alignItems: "center",
        flex: 1,
        justifyContent: "flex-start",
    },
    right: {
        flex: 2,
        alignItems: "flex-end",
        justifyContent: "center"
    },
    OAIcon: {
        width: 35,
        height: 35,
        resizeMode: "center",
    },
    profilePic: {
        width: 30,
        height: 30,
        resizeMode: "center",
        borderRadius: 30,
        backgroundColor: "",
        borderWidth: 2,
        borderColor: "black",


    },
    headerContainer: {
        backgroundColor: colors.color_2,
        width: "100%",
        paddingHorizontal: 15,
        paddingTop: 5
    },
    row1: {
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
    },
    row2: {

    },
    textSelected: {
        color: "white",        
    }
});