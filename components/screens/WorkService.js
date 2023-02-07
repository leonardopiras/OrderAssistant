<script src="http://localhost:8097"></script>
import React, { PureComponent, useState, useEffect } from 'react';
import {
  StyleSheet,
  View, NativeEventEmitter,
  NativeModules, Pressable, Text, Alert, DeviceEventEmitter
} from 'react-native';

import { CommonActions } from '@react-navigation/native';



import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Header, {screens} from "@components/Header";
import OAButton from "@components/OAButton";
import OAFlatList from "@components/OAFlatList";
import OAFullScreen from '@components/OAFullScreen';
import { Toast } from 'react-native-toast-message/lib/src/Toast';


const { OAMainModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(NativeModules.OAMainModule);

export default function WorkService({navigation, route}) {
   
  const [workStations, setWorkStations] = useState({});
  const [workStationsRemainingOrders, setWorkStationsRemaining] = useState({});
  const [unprocessed, setUnprocessed] = useState([]);

  const [sentences, setSentences] = useState({
    addOrder: "Nuovo ordine",
    pending: "Postazioni",
    completed: "Completati",
    all: "Tutti",
    cashRegister: "Cassa",
    editConfig: "Modifica configurazione",
    stopWorkService: "Interrompi servizio",
    confirmStop: "Sei sicuro di volere interrompere il servizio? Potrebbero esserci ordini in sospeso",
    askTakeTheLead: "Il server risulta irraggiungibile. Vuoi ospitare il servizio in una nuova stanza?",
    leadOk: "Stai ospitando il servizio",
    leadNotOk: "Impossibile ospitare il servizio",
    cancel: "Annulla"
  });

  useEffect(() => {
    Header.initScreen(screens.WorkService, {
      onResume: handleResume,
      onUpdate: handleUpdate,
      headerProps: {
        title: "",
        menuData: [
          { title: sentences.completed, fun: goToProcessedOrders },
          {
            title: sentences.editConfig,
            fun: () => navigation.navigate("ManageConfiguration", { isOnWS: true })
          },
          { title: sentences.stopWorkService, fun: stopService }
        ]
      }
    });
    const serverLostSub = eventEmitter.addListener("serverLost", handleServerLost);
    const serviceUnboundSub = eventEmitter.addListener("serviceUnbound", handleServiceUnbound);

    return () => {
      serverLostSub.remove();
      serviceUnboundSub.remove();
      Header.removeScreen(screens.WorkService);
    }
  }, []);

  const handleResume = (isFirst) => {
    if (isFirst) {
      NativeModules.OAMainModule.checkConnection(good => {
        if (good) {
          getData();
        } else
          Alert.alert("Connection not good! Please restart the app");
      });
    } else
      getData();
  }

  const handleUpdate = (type) => {
      getData();
  }

  const handleServiceUnbound = () => {
    console.log("Service unbound");
    goToWaitRoomResetNavigation();
  }

  const handleServerLost = () => {
    OAFullScreen.showDialog({
      type: "confirmAction",
      description: sentences.askTakeTheLead,
      secondaryBtn: sentences.cancel,
      onPressPrimaryBtn: () => {
        OAFullScreen.setLoading(true);
        NativeModules.OAMainModule.taketheLead(
          good => {
            OAFullScreen.setLoading(false);
            Toast.show({
              type: good ? "success" : "error",
              text1: good ? sentences.leadOk : sentences.leadNotOk,
            });
          });
      },
      onPressSecondaryBtn: goToWaitRoomResetNavigation,
    });
  }

  const goToWaitRoomResetNavigation = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { name: "WaitRoom" }
        ]
      })
    );
  };

  const getData = () => {
    OAMainModule.getRemainingOrdersGroupByWorkStation(result => {
      setWorkStationsRemaining(result);
    });
    NativeModules.OAMainModule.getWorkService(workService => {
      setUnprocessed(workService.unprocessed);
      setWorkStations(workService.configuration.workStations)
    });
  }

  const stopService = () => {
    OAFullScreen.showDialog({
      type: "confirmAction",
      description: sentences.confirmStop,
      onPressPrimaryBtn: () => {
        NativeModules.OAMainModule.stopWorkService();
        goToWaitRoomResetNavigation();
      }
  });
  }

  const goToWorkStation = (workStationName) => {
    console.log("going to " + workStationName);
    navigation.navigate("WorkStation", {workStationName})
  }

  const goToNewOrder = () => {
    navigation.navigate("EditOrder", {createMode: true});
  }

  const gotToCashier = () => {
    navigation.navigate("Cashier"); 
  }

  const goToProcessedOrders = () => {
    navigation.navigate("ProcessedOrders");
  }

  const UIWorkStationListItem = (key) => {
    const affectedCats = workStations[key];
    const remaining = workStationsRemainingOrders && workStationsRemainingOrders[key] ? workStationsRemainingOrders[key] : 0;
    return (
      <Pressable
        onPress={() => goToWorkStation(key)}
        style={myStyles.workStationsList.itm.pressable}
      >
        <Text style={[styles.text, myStyles.workStationsList.itm.text]}>{key}</Text>
        <Text style={[styles.text, myStyles.workStationsList.itm.text]}>({remaining})</Text>
      </Pressable>
    );
  }

  const UIWorkStationsFooter = () => {
    return (
      <Pressable
        onPress={() => goToWorkStation()}
        style={[myStyles.workStationsList.itm.pressable, {marginTop: 10}]}
      >
        <Text style={[styles.text, myStyles.workStationsList.itm.text]}>{sentences.all}</Text>
        <Text style={[styles.text, myStyles.workStationsList.itm.text]}>({unprocessed.length})</Text>
      </Pressable>
    );
  }

  

  return (
    <View style={[styles.container, myStyles.container]}>
      <OAFlatList
        style={myStyles.workStationsList.list}
        data={workStations ? Object.keys(workStations) : null}
        UIItem={UIWorkStationListItem}
        label={sentences.pending}
        ListFooterComponent={UIWorkStationsFooter}
      />
      <View style={myStyles.bottomBtns.container}>
      <OAButton
        onPress={() => goToNewOrder()}
        title={sentences.addOrder}
        style={myStyles.bottomBtns.btn}
        isHorizontal={true}
        icon={"plus-thick"}
        iconProps={{ size: 20, style: { marginHorizontal: 5 } }}

      />
      {/* {<OAButton
      onPress={() => OAMainModule.testThread()}
      title={"Debug button"}
      style={[myStyles.bottomBtns.btn]}
      isHorizontal={true}
      icon={"plus-thick"}
      iconProps={{ size: 20, style: { marginHorizontal: 5 } }}
    />} */}
        <OAButton
          isHorizontal={true}
          title={sentences.cashRegister}
          icon={"cash-register"}
          style={myStyles.bottomBtns.btn}
          onPress={gotToCashier}
          iconProps={{ size: 20, style: { marginHorizontal: 5 } }}
        />
      </View>
    </View>
  );
}


const myStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    justifyContent: 'space-evenly'
    },
    workStationsList: {
      list:{
        width: "100%",
        marginTop: 10
      },
      itm: {
        pressable: {
          width: "100%",
          height: 50,
          backgroundColor: colors.transpBlack,
          borderRadius: 30,
          paddingVertical: 10,
          paddingHorizontal: 20,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          flexDirection: "row"
        },
        text: {
          color: "white"
        }
      }
    },
    bottomBtns: {
      container: {
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "space-between",
        flexDirection: "row"
      },
      btn: {
        padding: 10,
        marginTop: 10
      }
    }
});
