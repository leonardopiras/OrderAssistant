
<script src="http://localhost:8097"></script>
import React, {  useState, Component } from 'react';
import {
  StyleSheet, View, 
   Pressable, Text, LogBox, ActivityIndicator,
} from 'react-native';



import styles from '@styles/DefaultStyles';
import colors from '@styles/Colors';

let instance = null;

export default class OAFullScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            diagVisible: false,
            title: "",
            description: "",
            description1: "",
            primaryBtn: "",
            secondaryBtn: "",
            ternaryBtn: "",
            onPressPrimaryBtn: null,
            onPressSecondaryBtn: null,
            onPressTernaryBtn: null,
            type: "", 
            sentences: {
                confirm: "Conferma",
                cancel: "Annulla",
                warning: "Attenzione",
                error: "Errore",
                iUnderstand: "Ho capito"
            },
            loading: false,
            showScreen: false,
        }
    }
    componentDidMount(){
        instance = this;
    }

    componentDidUpdate(){
        instance = this;
    }

    componentWillUnmount() {
        instance = null;
    }


    static setLoading = (loading) => {
        if (instance === null || typeof instance !== "object")
            return;
        instance.setState({loading: loading});
    }

    static showWarning = (description) => {
        OAFullScreen.showDialog({type: "warning", description: description});
    }


    static showDialog = ({ title,
        description,
        description1,
        primaryBtn,
        secondaryBtn,
        ternaryBtn,
        onPressPrimaryBtn,
        onPressSecondaryBtn,
        onPressTernaryBtn,
        type,
     }) => {
        if (instance === null || typeof instance !== "object") {
            console.error("unable to get modal");
            if (instance !== null)
                console.error(instance);
            return; 
        }
        if (typeof type === "string") {
            if (type === "confirmAction") {
                title = title ? title : instance.state.sentences.warning;
                primaryBtn = instance.state.sentences.confirm;
                secondaryBtn = instance.state.sentences.cancel;
            } else if (type === "error") {
                title = title ? title : instance.state.sentences.error;
                primaryBtn = instance.state.sentences.iUnderstand;
            } else if (type === "warning") {
                title = title ? title : instance.state.sentences.warning;
                primaryBtn = instance.state.sentences.iUnderstand;
            } else
                console.error("unknown type in OAFullScreen " + type);
        }

        instance.setState({diagVisible: true, title: title, description: description, description1: description1,
            primaryBtn: primaryBtn, secondaryBtn: secondaryBtn, ternaryBtn: ternaryBtn, 
            onPressPrimaryBtn: onPressPrimaryBtn, onPressSecondaryBtn: onPressSecondaryBtn,
            onPressTernaryBtn: onPressTernaryBtn, type: type });
    }

    static showBlackScreen = (show) => {
        if (instance === null || typeof instance !== "object")
            return;
        instance.setState({showScreen: show});
    }

    closeDialog = () => {
        this.setState({diagVisible: false, title: "", description: "",
            primaryBtn: "", secondaryBtn: "", ternaryBtn: "", 
            onPressPrimaryBtn: null, onPressSecondaryBtn: null, onPressTernaryBtn: null,
            type: "" });
    }

    handlePrimary = () => {
        if (typeof this.state.onPressPrimaryBtn === "function")
            this.state.onPressPrimaryBtn();
        if (["confirmAction", "error", "warning"].includes(this.state.type))
            this.closeDialog();
    }

    handleSecondary = () => {
        if (typeof this.state.onPressSecondaryBtn === "function")
            this.state.onPressSecondaryBtn();
        if (this.state.type === "confirmAction") 
            this.closeDialog();
    }

    handlePressOut = () => {
        this.closeDialog();
    }


    UIDialog = () => {
        const title = this.state.title;
        const description = this.state.description;
        const description1 = this.state.description1;
        const ternaryBtn = this.state.ternaryBtn;
        const secondaryBtn = this.state.secondaryBtn;
        const primaryBtn = this.state.primaryBtn;
        const onPressTernaryBtn = this.state.onPressTernaryBtn;
        return (
            <Pressable style={[myStyles.conteinerInternal, this.props.style]}>
            {title ? <Text style={[styles.text, myStyles.title]}>{title}</Text> : null}
            {description ? <Text style={[styles.text, myStyles.description]}>{description}</Text> : null}
            {description1 ? <Text style={[styles.text, myStyles.description1]}>{description1}</Text> : null}
            {(primaryBtn || secondaryBtn || ternaryBtn) ? (
                <View style={myStyles.btnContainer}>
                    {ternaryBtn ?
                        <Pressable style={[styles.button, myStyles.btn, myStyles.ternaryBtn]}
                            onPress={onPressTernaryBtn}>
                            <Text style={[styles.text, myStyles.text]}>{ternaryBtn}</Text>
                        </Pressable> : null}
                    {secondaryBtn ?
                        <Pressable style={[styles.button, myStyles.btn, myStyles.secondaryBtn]}
                            onPress={this.handleSecondary}>
                            <Text style={[styles.text, myStyles.text]}>{secondaryBtn}</Text>
                        </Pressable> : null}
                    {primaryBtn ?
                        <Pressable style={[myStyles.btn, myStyles.primaryBtn]}
                            onPress={this.handlePrimary}>
                            <Text style={[styles.text, myStyles.text]}>{primaryBtn}</Text>
                        </Pressable> : null}
                    </View>
                ) : null}
            </Pressable>
        );
    }

    UIIndicator = () => {
        return (
            <ActivityIndicator
                style={{
                    position: "absolute", alignSelf: "center",
                    backgroundColor: "white", borderRadius: 30,
                    zIndex: 200,
                }}
                color={colors.color_2}
                size={'large'}
            />);
    }

  

    render() {
        if (!this.state.diagVisible && !this.state.loading && !this.state.showScreen)
            return;

        return (
            <Pressable
            onPress={this.handlePressOut} 
            style={myStyles.containerExternal}>
               {this.state.diagVisible ? this.UIDialog() : null}
               {this.state.loading ? this.UIIndicator() : null}   
               {this.state.customChildren ? this.state.customChildren : null}

            </Pressable>
        );
    }
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
    description1: {
        color: "black",
        fontSize: 14,
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
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        zIndex: 2,
        width: "100%", 
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.7)",
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
        elavation: 30,
        zIndex: 102
    },
    
});