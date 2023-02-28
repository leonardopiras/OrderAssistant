<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, ToastAndroid, NativeModules,
  Pressable, Text, RefreshControl, NativeEventEmitter,
  FlatList,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'


import styles from '@styles/DefaultStyles';
import TextInputDialog from '@components/TextInputDialog';
import Header, { screens } from "@components/Header";
import OAButton from '@components/OAButton';
import colors from "@styles/Colors";
import CreateRoomDialog from '@components/CreateRoomDialog';
import OAFullScreen from '@components/OAFullScreen';



const { UsernameModule, OAMainModule } = NativeModules;

const clientStartUpCode = {
  ALL_GOOD: 0,
  GENERIC_ERROR: 1,
  NAME_ALREADY_IN_USE: 2,
  PARSER_ERROR: 3,
  TIMER_EXCEDEED: 4,
  ECONNREFUSED: 5,
  ERROR_ON_CLOSE: 6,
  ERROR_WIFI: 7
}

const serverStartUpCode = {
  ALL_GOOD: 0,
  GENERIC_ERROR: 1,
  ERROR_DOUBLE_START: 2,
  ERROR_NSD: 3,
  ERROR_INFO_SERVER: 4,
  ERROR_WIFI: 5,
  ERROR_LOAD_PREVIOUS_WORKSERVICE: 6,
  ERROR_BUSY_PORT: 7
}

export default function WaitRoom({ navigation, route }) {

  const [serverList, setServerList] = useState([{ Address: "192.165.1.1", Port: 1234, Name: "Gigi" }, { Address: "192.165.1.2", Port: 1234, Name: "Gino" }]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [createRoomDialogIsOpen, setRoomDialogOpen] = useState(false);
  const [modalUserNameInfo, setModalUsernameInfo] = useState({ isOpen: false, firstSetUp: true });
  const [isWifiGood, setWifiIsGood] = useState(true);
  const [serversDetails, setServersDetails] = useState({});
  const [isWorkServiceRunning, setWorkServiceRunning] = useState(false);
  const [isPreviousWorkServicePresent, setPreviousWorkServicePresent] = useState(false);

  const [sentences, setSentences] = useState({
    showModalUsernameErrors: "Inserisci uno username per continuare",
    modalUsernameTitleNew: "Scegli uno username",
    modalUsernameTitleUpdate: "Cambia username",
    confirm: "Conferma",
    modalServerRoomTitle: "Nome stanza",
    wifiDialogTitle: "Rete wifi non trovata",
    wifiDialogDescription: "Connetti a una rete wifi per accedere al servizio",
    understand: "Ho capito",
    cancel: "Annulla",
    createRoom: "Crea servizio",
    noRoom_1: "Nessuna stanza trovata",
    reload: "Aggiorna",
    chooseRoom: "Scegli stanza",
    clientSuccessfullyStarted: "Connessione stabilita",
    workService: "Servizio",
    clientNotStartedError: "Impossibile connettersi alla stanza",
    serverSuccessfullyStarted: "inizializzato correttamente",
    serverNotStarted: "Impossibile creare la stanza",
    clientErrorName: "Il nome scelto è gia stato utilizzato",
    resumeWorkService: "Riprendi servizio...",
    clientErrorParser: "Non è possibile decifrare i messaggi del server",
    clientErrorTimer: "Il server ci ha messo troppo tempo a rispondere",
    clientErrorConnRefused: "Può essere che il server non stia nella tua stessa rete",
    serverErrorWifi: "Problemi con la rete wifi",
    doUWantStoreConfiguration: "Vuoi salvare la configurazione?",
    loadService: "Carica servizio in sospeso",
    serverErrorLoadPrevWS: "Il servizio non è stato salvato correttamente",
    errorClientOnClose: "Il server non ha accettato la richiesta di connessione"
  });

  useEffect(() => {
    Header.initScreen(screens.WaitRoom, {
      onResume: handleResume,
      headerProps: {
        profilePic: true,
        right: (UIRightHeader()),
        onPressProfilePic: () => setModalUsernameInfo({ isOpen: true, firstSetUp: false })
      }
    });
    checkUsername();


    return () => {
      Header.removeScreen(screens.WaitRoom);
    }
  }, []);

  useEffect(() => {
    if (!isWifiGood)
      OAFullScreen.showWarning(sentences.wifiDialogDescription);
  }, [isWifiGood])

  const handleResume = () => {
    OAMainModule.isWifiGood(good => {
      setWifiIsGood(good);
      if (good) {
        findServers();
        OAMainModule.isWorkServiceRunning(running => {
          setWorkServiceRunning(running);
        });
        OAMainModule.isPreviousWorkServicePresent(isPresent => {
          setPreviousWorkServicePresent(isPresent);
        });
      }
      else {
        setTimeout(() => {
          handleResume();
        }, 3000);
      }
    });
  };


  const checkUsername = async () => {
    UsernameModule.loadUsername(value => {
      if (!value) {
        setModalUsernameInfo({ isOpen: true, firstSetUp: true });
      } else {
        setUsername(value);
      }
    });
  };

  const log = (mes, length) => {
    console.log(mes);
    ToastAndroid.show(mes, length ? length : ToastAndroid.LONG);
  };

  const openRoomNameDialog = () => {
    setRoomDialogOpen(true);
  };

  const onConfirmRoom = (roomInfo) => {
    OAMainModule.startServer(roomInfo.roomName, username,
      roomInfo.configurationName, handleWorkServiceCreationReturn);
  };

  const startServerPreviousWorkService = () => {
    OAFullScreen.setLoading(true);
    OAMainModule.startServerPreviousWorkService(handleWorkServiceCreationReturn);
  }

  const handleWorkServiceCreationReturn = (good, exitCode) => {
    OAFullScreen.setLoading(false);
    if (good) {
      goToWorkStationsRoom();
    } else {
      OAFullScreen.showDialog({
        type: "error",
        description: sentences.serverNotStarted,
        description1: getServerErrorCauseStartUp(exitCode)
      });
    }
  }

  const goToWorkStationsRoom = () => {
    navigation.navigate("WorkService")
  }

  const startClientFromServerInfo = (serverInfo) => {
    const address = serverInfo.Address;
    const port = serverInfo.Port;
    const roomName = serverInfo.Name;
    const infoPort = serverInfo.InfoPort;
    OAFullScreen.setLoading(true);
    OAMainModule.connectToServer(address, port, roomName, username, infoPort,
      (good, exitCode) => {
        console.log(good);
        console.log(exitCode);
        OAFullScreen.setLoading(false);
        if (good) {
          askSaveConfiguration();
          goToWorkStationsRoom();
        } else {
          OAFullScreen.showDialog({
            type: "error",
            description: sentences.clientNotStartedError,
            description1: getClientErrorCauseStartUp(exitCode)
          });
        }
      });
  }

  const askSaveConfiguration = () => {
    OAMainModule.isConfigurationSaved(isStored => {
      if (!isStored) {
        OAFullScreen.showDialog({
          type: "confirmAction",
          description: sentences.doUWantStoreConfiguration,
          onPressPrimaryBtn: () => OAMainModule.saveConfiguration()
        });
      }
    })
  }

  const getClientErrorCauseStartUp = (code) => {
    if (code === clientStartUpCode.NAME_ALREADY_IN_USE)
      return sentences.clientErrorName;
    else if (code === clientStartUpCode.PARSER_ERROR)
      return sentences.clientErrorParser;
    else if (code === clientStartUpCode.TIMER_EXCEDEED)
      return sentences.clientErrorTimer;
    else if (code === clientStartUpCode.ECONNREFUSED)
      return sentences.clientErrorConnRefused;
    else if (code === clientStartUpCode.ERROR_ON_CLOSE)
      return sentences.errorClientOnClose;
    else if (code === clientStartUpCode.ERROR_WIFI)
      return sentences.serverErrorWifi;
  }

  const getServerErrorCauseStartUp = (code) => {
    if (code === serverStartUpCode.ERROR_WIFI)
      return sentences.serverErrorWifi;
    if (code === serverStartUpCode.ERROR_LOAD_PREVIOUS_WORKSERVICE)
      return sentences.serverErrorLoadPrevWS;
    else
      return "code: " + code;
  }


  const findServers = async () => {
    setServerList(prev => { return [] });
    setServersDetails(prev => { return {} });
    setRefreshing(true);
    const eventEmitter = new NativeEventEmitter(NativeModules.OAMainModule);
    const serverFoundListener = eventEmitter.addListener("NewServerFound", (serverInfo) => {
      log(serverInfo.Address + ":" + serverInfo.Port);
      setServerList(prev => { return [...prev, serverInfo] });
    });
    const serverDetailsListener = eventEmitter.addListener("NewServerDetails", (det) => {
      const roomName = det.roomName;
      setServersDetails(prev => { return { ...prev, [roomName]: det } });
    });
    OAMainModule.findServers(5000, () => {
      serverFoundListener.remove();
      serverDetailsListener.remove();
      setRefreshing(false);
    });
  }

  const onConfirmUsernameModal = () => {
    if (username.length > 0) {
      UsernameModule.saveUsername(username);
      setModalUsernameInfo(prev => { return { ...prev, isOpen: false }; })
    }
  }

  const UIRightHeader = () => {
    return (
      <View style={{ flexDirection: "row" }}>
        {/* <Pressable
      >
         <Icon
          name={"reload"}
          color={"white"}
          size={25}
          style={{alignSelf: "center"}}
        />
      </Pressable>
      <View style={{width: 10}}/> */}
        <Pressable
          onPress={() => navigation.navigate("ConfigurationList")}
        >
          <Icon
            name={"file-cog-outline"}
            color={"white"}
            size={25}
            style={{ alignSelf: "center" }}
          />
        </Pressable>
      </View>
    );
  }

  const UITextIcon = (iconName, color, size, text, leftText) => {
    return (
      <View style={{ flexDirection: leftText ? "row" : 'row-reverse' }}>
        <Text style={[styles.text, myStyles.text]}>{text}</Text>
        <View style={{ width: 10 }}></View>
        <Icon
          name={iconName}
          color={color}
          size={size}
          style={{ alignSelf: "center" }}
        />
      </View>
    );
  }

  const UIEmptyList = () => {
    return (
      <Text style={[styles.text, { alignSelf: "center", color: "white", fontSize: 20, margin: 10 }]}>{sentences.noRoom_1}</Text>
    )
  }

  const UIServerListItem = (serverListItem) => {
    if (typeof serverListItem !== "object")
      return null;
    const name = serverListItem.Name;
    let details = serversDetails ? serversDetails[name] : undefined;
    const hasDetails = typeof details === "object";
    return (
      <Pressable
        key={serverListItem.Address}
        style={myStyles.serverListItem.container}
        onPress={() => startClientFromServerInfo(serverListItem)}>
        <View style={myStyles.serverListItem.row}>
          {UITextIcon("room-service-outline", "white", 20, serverListItem.Name, false)}
          {hasDetails ? UITextIcon("account-tie", "white", 20, details.owner, true) : null}
        </View>
        <View style={myStyles.serverListItem.row}>
          {hasDetails ?
            <View style={{ flexWrap: "wrap", flexDirection: "row", justifyContent: "center" }}>
              {details.clients.map((el, indx) => {
                return (<Text
                  key={el}
                  style={[styles.text, { flexBasis: "50%" }]}>{el}</Text>);
              })}
            </View>
            : null}
        </View>
      </Pressable>
    );
  }

  const UIModalUsername = modalUserNameInfo.isOpen ? (
    <TextInputDialog
      title={modalUserNameInfo.firstSetUp ? sentences.modalUsernameTitleNew : sentences.modalUsernameTitleUpdate}
      inputVar={username}
      setInputVarState={setUsername}
      placeholder={"Mario, John, Hanna..."}
      primaryBtn={sentences.confirm}
      onConfirm={onConfirmUsernameModal}
      checkEmptyField={modalUserNameInfo.firstSetUp}
      closeFun={() => setModalUsernameInfo(prev => { return { ...prev, isOpen: false }; })}
      mandatoryField={modalUserNameInfo.firstSetUp}
      isAnUpdate={!modalUserNameInfo.firstSetUp}
      isVisible={modalUserNameInfo.isOpen}
    />) : null;

  const UICreateRoomDialog = createRoomDialogIsOpen ? (
    <CreateRoomDialog
      onConfirmRoom={onConfirmRoom}
      onRequestClose={() => setRoomDialogOpen(false)}
      isVisible={createRoomDialogIsOpen}
      goToManageConfiguration={() => navigation.navigate("ConfigurationList")}      
    />) : null;


  return (
    <>
      {UICreateRoomDialog}
      {UIModalUsername}
      <View style={styles.container}>
        <View
          style={myStyles.serverList}
        >
          <FlatList
            style={{ flex: 1 }}
            data={serverList}
            ItemSeparatorComponent={<View style={{ margin: 5, alignSelf: "stretch", height: 1, backgroundColor: colors.transpBlack }} />}
            ListEmptyComponent={() => UIEmptyList()}
            renderItem={({ item, index, separators }) => UIServerListItem(item)}
            refreshControl={<RefreshControl
              refreshing={refreshing}
              onRefresh={findServers} />}
          />
          {
            isWorkServiceRunning ? (
              <Pressable
                style={{
                  position: "absolute", top: 0, bottom: 0, right: 0, left: 0, borderRadius: 20,
                  backgroundColor: colors.transpBlack, justifyContent: "flex-end", alignItems: "center"
                }}
              >


                <OAButton
                  onPress={() => navigation.navigate("WorkService")}
                  title={sentences.resumeWorkService}
                  isHorizontal={true}
                  style={[{ paddingHorizontal: 20, paddingVertical: 20, margin: 40 }]}
                  icon={"play"}
                  iconProps={{ size: 20, style: { marginRight: 5 } }}
                />
              </Pressable>
            ) : null
          }
        </View>

        {
          isPreviousWorkServicePresent ? (
            <OAButton
              onPress={() => startServerPreviousWorkService()}
              title={sentences.loadService}
              isHorizontal={true}
              style={[myStyles.bottomBtns.btn, { paddingHorizontal: 50, paddingVertical: 20, }]}
              icon={"file-upload"}
              iconProps={{ size: 20, style: { marginRight: 5 } }}
            />
          ) : null
        }
        <View style={myStyles.bottomBtns}>
          <OAButton
            onPress={openRoomNameDialog}
            title={sentences.createRoom}
            image={require('@images/icons/plus.png')}
            imageStyle={{ width: 25, height: 25 }}
            isHorizontal={true}
            style={myStyles.bottomBtns.btn}
          />
          {/* <OAButton
                onPress={findServers}
                title={sentences.reload}
                image={require('@images/icons/reload.png')}
                imageStyle={{ width: 25, height: 25 }}
                isHorizontal={true}
                style={myStyles.bottomBtnsBtn}

              /> */}
        </View>
      </View>
    </>
  );
}


const myStyles = StyleSheet.create({
  bottomBtns: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignSelf: "stretch",
    flexWrap: "wrap",
    marginTop: 10,
  },
  bottomBtnsBtn: {
    paddingHorizontal: 10,
    marginTop: 5,
  },
  textNoRoom: {
    textAlign: "center"
  },
  text: {
    color: "white",
    fontSize: 16
  },
  serverList: {
    backgroundColor: colors.transpBlack,
    borderRadius: 20,
    alignSelf: "stretch",
    paddingHorizontal: 20,
    marginBottom: 20,
    flex: 1
  },
  serverListItem: {
    container: {
      margin: 10,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignSelf: "stretch",
      flexWrap: "wrap"
    }
  },
  divider: {
    backgroundColor: "rgba(255,255,255,0.3)",
    height: 1
  },
});
