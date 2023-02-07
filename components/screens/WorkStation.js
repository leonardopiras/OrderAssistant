<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text,
  View,
  NativeModules, FlatList, Animated
} from 'react-native';

import Swipeable from 'react-native-gesture-handler/Swipeable';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Header, {screens} from "@components/Header";
import OAButton from "@components/OAButton";
import WorkStationOrder from '@components/WorkStationOrder';
import { Toast } from 'react-native-toast-message/lib/src/Toast';


const { OAMainModule } = NativeModules;


export default function WorkStation({navigation, route}) {
   
  const [workStationName, setWorkStationName] = useState(route.params.workStationName);
  const [imServer, setimServer] = useState(route.params.imServer);
  const [orderQueue, setOrderQueue] = useState([]);
  const [sentences, setSentences] = useState({
    addOrder: "Nuovo ordine",
    pending: "Pendenti",
    completed: "Completati",
    all: "Tutti",
    emptyList: "Nessun ordine pendente",
    complete: "Finito",
    unableToComplete1: "Impossibile completare l'ordine",
    unableToComplete2: "Sono presenti uno o più item non completati",
    orderCorrectlyCompleted: "Ordine completato",
    editConfig: "Modifica configurazione",
  });

  useEffect(() => {
    Header.initScreen(screens.WorkStation, {
      onResume: handleResume,
      onUpdate: handleResume,
      headerProps: {
        title: route.params.workStationName, 
        menuData: [
          {title: sentences.editConfig, fun: () => navigation.navigate("ManageConfiguration", {isOnWS: true})}
        ]
      }
    });
 
    return () => {
      Header.removeScreen(screens.WorkStation);
    }
  },[]);

  const handleResume = () => {
    NativeModules.OAMainModule.getWorkStationOrders(workStationName, false, onGetOrderQueue);
  }

  const onGetOrderQueue  = (queue) => {
    setOrderQueue(queue);
  }
 
  const setHeader = (title) => {
    Header.setHeader();
  };

  const tryProcessOrder = (direction, swipeableRef, order) => {
    if (direction === "left" && order.itemList.filter(item => !item.completed).length === 0) {
      OAMainModule.processOrder(order.id, (good) => {
        Toast.show({
          type: good ? "success" : 'error',
          text1: (good ? sentences.orderCorrectlyCompleted : sentences.unableToComplete1) + " (" + order.id+")",
        });
        if (good)
          setOrderQueue(prev => prev.filter(ord => ord.id !== order.id));
        else
          swipeableRef.close();
      })
    } else {
      Toast.show({
        type: 'error',
        text1: sentences.unableToComplete1,
        text2: sentences.unableToComplete2
      });
      swipeableRef.close();
    }
  }

  const UIEmptyList = () => {
    return (
      <Text style={[styles.text, myStyles.textEmptyList]}>{sentences.emptyList}</Text>
    );
  }

  const renderLeftActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [-20, 10, 50],
      extrapolate: "clamp"
    });

    return (
      <View style={{
        color: colors.color_1,
        backgroundColor: colors.greenBtn,
        borderRadius: 30,
        paddingHorizontal: 10,
        flex: 1
      }}>
        <Animated.View
          style={[{ transform: [{ translateX: trans }] }, 
          {height: "100%", justifyContent: "center"}]}
        >
          <Text style={[styles.text, {color: "white", fontSize: 20}]}
          >{sentences.complete}</Text>
        </Animated.View>
      </View>
    );
  };

  const UIListOrder = (order, index) => {
    return (
      <Swipeable
        renderLeftActions={renderLeftActions}
        onSwipeableOpen={(direction, swipeableRef) => tryProcessOrder(direction, swipeableRef, order)}
      >
        <WorkStationOrder
          order={order}
          key={order.id}
        />
      </Swipeable>);
  }

    return (
      <View style={[styles.container, myStyles.container]}>
        <FlatList
          style={myStyles.list}
          data={orderQueue}
          ItemSeparatorComponent={<View style={{ height: 10 }} />}
          ListEmptyComponent={() => UIEmptyList()}
          ListFooterComponent={<View style={{ height: 50, width: "100%" }} />}
          renderItem={({ item, index, separators }) => UIListOrder(item, index)}
        />
        <View style={myStyles.bottomBtns.container}>
        {/* <OAButton
          title={sentences.completed}
          style={myStyles.bottomBtns.btn}
          onPress={null}
        />
        <OAButton
          isHorizontal={true}
          title={sentences.save}
          icon={"content-save-outline"}
          style={myStyles.bottomBtns.primaryBtn}
          onPress={null}
          iconProps={{ size: 14, style: { marginHorizontal: 5 } }}
        /> */}
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
    list: {
      flex: 1,
      alignSelf: "stretch"
    },
    bottomBtns: {
      container: {
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "space-between",
        flexDirection: "row"
      },
      btn: {
        padding: 10
      }
    },
    textEmptyList: {
      color: colors.color_8,
      alignSelf: "center",
      margin: 20,
      fontSize: 20
    }
});
