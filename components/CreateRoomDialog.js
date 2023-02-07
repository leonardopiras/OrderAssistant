
<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View,
  NativeModules, Pressable, Text, LogBox, FlatList,
} from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'



import { Radio, RadioGroup } from '@ui-kitten/components';

import styles from '@styles/DefaultStyles';
import colors from '@styles/Colors';
import CustomDialog from '@components/CustomDialog';
import OATextInput from '@components/OATextInput';
import OAInput from '@components/OAInput';

const { ManageConfigurationsModule } = NativeModules;

export default function CreateRoomDialog({
  onConfirmRoom, onRequestClose, isVisible
}) {

  const [roomName, setRoomName] = useState("");
  const [errRoomName, setErrRoomName] = useState(false);
  const [configList, setConfigList] = useState();
  const [selectedConfig, setSelectedConfig] = useState(0);

  const [sentences, setSentences] = useState({
    confirm: "Conferma",
    createRoom : "Crea stanza",
    cancel: "Annulla",
    roomName: "Nome stanza",
    emptyField: "Nome stanza vuoto",
    configuration: "Configurazione"
  });

  useEffect(() => {
    loadConfigurationList();

  }, []);

  const loadConfigurationList = () => {
    NativeModules.ManageConfigurationsModule.getItemTypeConfigurations(res => {
      if (res) {
        if (typeof (res) == "string")
          res = [res];
        if (Array.isArray(res))
          setConfigList(res);
      }
    });
  }

  const changeSelectedConfig =(configName) => {
    setSelectedConfig(configName);
    if (roomName === "")
      setRoomName(configName);
  }

  const onPressPrimaryBtn = () => {
    const roomNameOk = roomName && roomName.length > 0;
    const configOk = selectedConfig && selectedConfig.length > 0;
    if (roomNameOk && configOk)
      onRequestClose();
      onConfirmRoom({roomName: roomName, configurationName: selectedConfig});
  }

  const UIListItem = (item) => {
    const selected = selectedConfig === item;

    const selectedStyle = {
      backgroundColor: selected ? colors.transpBlack : null
    }
    return (
      <Pressable onPress={() => changeSelectedConfig(item)}>
        <Text style={[styles.text,myStyles.configList.item, selectedStyle]}>{item}</Text>
      </Pressable>
    );
  }

  
    return (
      <CustomDialog
        title={sentences.createRoom}
        primaryBtn={sentences.confirm}
        secondaryBtn={sentences.cancel}
        onPressPrimaryBtn={onPressPrimaryBtn}
        onPressSecondaryBtn={onRequestClose}
        isVisible={isVisible}
        onRequestClose={onRequestClose}
      >
        <KeyboardAwareScrollView
          behavior='padding'
        >
          <OATextInput
            value={roomName}
            setValue={setRoomName}
            label={sentences.roomName}
            showError={errRoomName}
            errorMsg={sentences.emptyField}
            style={null}
          />

          <OAInput
            label={sentences.configuration}
            showError={false}
            errorMsg={""}
            style={{height: 400,  alignSelf: "stretch", marginTop: 10}}
            onFocus={null}
          >
            <FlatList
              style={myStyles.configList.list}
              data={configList}
              ItemSeparatorComponent={<View style={{ margin: 5, backgroundColor: colors.transpBlack }} />}
              renderItem={({ item, index, separators }) => UIListItem(item)}
            />

          </OAInput>



        </KeyboardAwareScrollView>

      </CustomDialog>
    );

}

const myStyles = StyleSheet.create({
    configList: {
      list: {
        height: 300,
        padding: 10,
        paddingTop: 15
      },
      item: {
        //backgroundColor: colors.transpBlack
        color: "white",
        padding: 8,
        borderRadius: 10
      }
    },
});