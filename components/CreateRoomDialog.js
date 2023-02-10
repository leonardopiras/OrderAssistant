
<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View,
  NativeModules, Pressable, Text, LogBox, FlatList,
} from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'


import styles from '@styles/DefaultStyles';
import colors from '@styles/Colors';
import CustomDialog from '@components/CustomDialog';
import OATextInput from '@components/OATextInput';
import OAInput from '@components/OAInput';
import OAButton from '@components/OAButton';

const { ManageConfigurationsModule } = NativeModules;

export default function CreateRoomDialog({
  onConfirmRoom, onRequestClose, isVisible, goToManageConfiguration
}) {

  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [configList, setConfigList] = useState();
  const [selectedConfig, setSelectedConfig] = useState(0);

  const [sentences, setSentences] = useState({
    confirm: "Conferma",
    createRoom : "Crea stanza",
    cancel: "Annulla",
    roomName: "Nome stanza",
    emptyField: "Nome stanza vuoto",
    configuration: "Configurazione",
    chooseRoomNameWarning: "Devi scegliere un nome per la stanza",
    uHaveToChooseConfig: "Devi scegliere una configurazione",
    configurationNotFound: "Configurazione non trovata",
    createConfig: "Crea configurazione"
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

  const changeSelectedConfig = (configName) => {
    setSelectedConfig(configName);
    if (roomName === "")
      setRoomName(configName);
  }

  const onPressPrimaryBtn = () => {
    if (roomName && roomName.length > 0) {
      if (selectedConfig && selectedConfig.length > 0) {
        NativeModules.ManageConfigurationsModule.configurationExist(selectedConfig, exist => {
          if (exist) {
            onRequestClose();
            onConfirmRoom({ roomName: roomName, configurationName: selectedConfig });
          } else
            setError(sentences.configurationNotFound);
        });
      } else
        setError(sentences.uHaveToChooseConfig);
    } else
      setError(sentences.chooseRoomNameWarning);
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

  const handlePressEmptyBtn = () => {
    onRequestClose();
    goToManageConfiguration();
  }

  const UIEmptyList = () => {
    return (
      <OAButton
      onPress={handlePressEmptyBtn}
      title={sentences.createConfig}
      isHorizontal={true}
      style={[{ alignSelf: "center", paddingEnd: 13 }]}
      icon={"plus-thick"}
      iconProps={{ size: 20, style: { marginRight: 5 } }}
    />
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
              ListEmptyComponent={UIEmptyList}
            />

          </OAInput>
          <Text style={[styles.text, {color: "red", flex: 1, height: 50, textAlignVertical: "center"}]}>
            {error}
          </Text>



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