
<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, TextInput, Text, LogBox
} from 'react-native';


import styles from '@styles/DefaultStyles';
import CustomDialog from '@components/CustomDialog';


export default function TextInputDialog({
    title, 
    inputName,
    inputVar,
    setInputVarState,
    description,
    onConfirm, 
    animationType,
    isVisible,
    height,
    isAnUpdate,
    placeholder,
    checkErrorList,  // [{isError: () => bool, sentence: string }]
    checkEmptyField,
    closeFun,
    mandatoryField,  // prevents dialog from closing if empty field  
    primaryBtn
}) {


  const [startInputVar, setStartInputVar] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [sentences, setSentences] = useState({
    placeholder: "Scrivi qui...",
    insert: "Inserisci ",
    update: "Aggiorna ",
    value: "valore",
    confirm: "Conferma",
    defaultError: "Fai attenzione",
    emptyField: "Campo vuoto",
    mandatoryField: "Campo obbligatorio, premi conferma per continuare",
    clearField: "Pulisci",
    cancel: "Annulla"
  });

  useEffect(() => {
    setStartInputVar(inputVar);
  }, []);



  const hasErrors = async () => {
    const errors = [];
    if (checkEmptyField && inputVar.length == 0) {
      errors.push(sentences.emptyField);
    } else {

      for(el in checkErrorList)
      {
        if (await element.isError())
          errors.push(element.sentence);
      }
    }
    if (errors.length == 0) 
      return false; 
    else {
      setErrorList(errors);
      return true;
    }
  }

  const onRequestClose = async () => {
    if (mandatoryField) {
      const allGood = ! (await hasErrors());
      if (allGood)
        setErrorList([sentences.mandatoryField])
    }
    else {
      setInputVarState(startInputVar);
      closeFun();
    }
  }

  const onPressPrimaryBtn = async () => {
    const allGood = ! (await hasErrors());
      if (allGood) {
        onConfirm();
    }    
  }

  const getTitle = () => {
    if (title)
      return title;
    else
      return `${isAnUpdate ? sentences.update : sentences.insert}${inputName ? inputName : sentences.value}`;
  }

  const UIErrors = () => {
    return (
      <View style={myStyles.errorsContainer}>{
        errorList.map((e,ind) => {
          <Text style={myStyles.errorText}>{e}</Text>}
        )
      }
        
      </View>

    );
  }

    return (
<CustomDialog
        title={getTitle()}
        primaryBtn={primaryBtn ? primaryBtn : sentences.confirm}
        secondaryBtn={mandatoryField ? null : sentences.cancel}
        onPressPrimaryBtn={onPressPrimaryBtn}
        onPressSecondaryBtn={mandatoryField ? null : onRequestClose}
        isVisible={isVisible}
        onRequestClose={onRequestClose}
        height={height}
        description={description}
        animationType={animationType}
        ternaryBtn={sentences.clearField}
        onPressTernaryBtn={() => setInputVarState("")}
    >
      <View style={{marginVertical: 10}}>
        {UIErrors()}
        <TextInput
          style={[myStyles.textInput, styles.text]}
          onChangeText={setInputVarState}
          defaultValue={inputVar}
          placeholder={placeholder ? placeholder : sentences.placeholder}
          placeholderTextColor={"grey"}
        />
      </View>
    </CustomDialog>
    );

}

const myStyles = StyleSheet.create({
  textInputContainer: {
    flexDirection: "row"
  },
  textInput: {
    width: "100%",
    borderColor: 'gray',
    borderWidth: 1,
    color: 'black',
  },
  errorText: {
    color: "red",
    textSize: 15
  },
  errorsContainer: {
    flexBasis: 40
  }
});