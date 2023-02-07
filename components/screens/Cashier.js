<script src="http://localhost:8097"></script>
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text,
  View,
  NativeModules, FlatList, Animated, TextInput,
} from 'react-native';

import Swipeable from 'react-native-gesture-handler/Swipeable';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Header, {screens} from "@components/Header";
import OAButton from "@components/OAButton";
import OrderListItem from '@components/OrderListItem';
import { Toast } from 'react-native-toast-message/lib/src/Toast';


const { OAMainModule } = NativeModules;

let searchBarTimerRunning = false;

export default function Cashier({ navigation, route }) {

  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [filteredUnpaidOrders, setFilteredUnpaidOrders] = useState([]);
  const [searchBarText, setSearchBarText] = useState("");
  const [selectedOrders, _setSelectedOrders] = useState([]);
  const selectedOrdersRef = useRef(selectedOrders);
  const setSelectedOrders = data => {
    selectedOrdersRef.current = data;
    _setSelectedOrders(data);
  };  //const [searchBarTimerRunning, setsearchBarTimerRunning] = useState(false);
  const [sentences, setSentences] = useState({
    cashier: "Cassa",
    emptyList: "Nessun ordine da pagare",
    pay: "Paga",
    processed: "Processati",
    unprocessed: "In lavorazione",
    placeholder: "Cerca tavolo...",
    orderCorrectlyPaid: "Ordine pagato correttamente",
    unableToPay: "Errore nel pagamento dell'ordine",
    addOrder: "Nuovo ordine",
    search: "Cerca",
    join: "Unisci",
    edit: "Modifica",
    ordersJoinOk: "Ordini uniti correttamente",
    ordersJoinNotOk: "Impossibile unire gli ordini",
    ordersJoinNotOk1: "Assicurati che gli ordini riguardino lo stesso tavolo"
  });


  useEffect(() => {
    Header.initScreen(screens.Cashier, {
      onResume: handleOnResume,
      onUpdate: handleUpdate,
      onBackPress: handleBackButtonPress,
      headerProps: {
        title: sentences.cashier,
        canGoBack: true
      }
    });

    return () => {
      Header.removeScreen(screens.Cashier);
    }
  }, []);

  const handleBackButtonPress = () => {
    if (selectedOrdersRef.current.length > 0) {
      setSelectedOrders([]);
      return false;
    }
    return true;
  }

  const handleOnResume = () => {
    setSelectedOrders([]);
    NativeModules.OAMainModule.getOrderLists(handleListsUpdate);
  }

  const handleUpdate = (type) => {
      NativeModules.OAMainModule.getOrderLists(handleListsUpdate);
  }

  const handleListsUpdate = (lists) => {
    //setUnpaidProcessed(workService.unpaidProcessed);
    const unpaidUnprocessed = lists.unprocessed.filter(o => !o.isPaid);
    //setUnpaidUnprocessed(unpaidUnprocessed);
    const orders = [...lists.unpaidProcessed, ...unpaidUnprocessed];
    setUnpaidOrders(orders);
    filterOrders(searchBarText, orders);
  }

  useEffect(() => {
    Header.setSelected(selectedOrders.length, onPressSelected)
  }, [selectedOrders])

  const onPressSelected = () => {
    if (selectedOrders.length > 0) {
      if (selectedOrders.length === filteredUnpaidOrders.length) {
        setSelectedOrders(prev => { return [] });
      } else {
        setSelectedOrders(prev => { return filteredUnpaidOrders.map(el => { return el.id }) });
      }
    }
  }

  const filterOrders = (filterText, newUnpaidOrders) => {
    const orders = newUnpaidOrders ? newUnpaidOrders : unpaidOrders;
    if (filterText)
      setFilteredUnpaidOrders(orders.filter(ord => ord.table.includes(filterText)));
    else
      setFilteredUnpaidOrders(orders);
  }

  const onChangeTextSearchBar = (newText) => {
    setSearchBarText(newText);
    if (!searchBarTimerRunning) {
      searchBarTimerRunning = true;
      filterOrders(newText);
      setTimeout(() => {
        searchBarTimerRunning = false;
      }, 1000)
    }
  }

  const tryPayOrder = (direction, swipeableRef, order) => {
    if (direction === "left") {
      OAMainModule.payOrder(order.id, (good) => {
        Toast.show({
          type: good ? "success" : "error",
          text1: (good ? sentences.orderCorrectlyPaid : sentences.unableToPay) + " (" + order.id + ")",
        });
        if (good)
          NativeModules.OAMainModule.getOrderLists(handleListsUpdate);
        else
          swipeableRef.close();
      });
    }
    console.log("Devi pagare ordine");
  }

  const tryJoinSelectedOrders = () => {
    NativeModules.OAMainModule.joinOrders(selectedOrders, good => {
      Toast.show({
        type: good ? "success" : "error",
        text1: good ? sentences.ordersJoinOk : sentences.ordersJoinNotOk,
        text2: good ? "" : sentences.ordersJoinNotOk1
      });
      if (good)
        NativeModules.OAMainModule.getOrderLists(handleListsUpdate);
    });
  }

  const setOrderSelected = (order) => {
    setSelectedOrders(prev => {
      const newSelected = (!prev.includes(order.id));
      return newSelected ? [...prev, order.id] : prev.filter(id => id !== order.id);
    })
  }

  const goToEditOrder = (orderId) => {
    if (typeof orderId === "number") {
      navigation.navigate("EditOrder", { createMode: false, orderId: orderId });
    } else
      navigation.navigate("EditOrder", { createMode: true });
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
          { height: "100%", justifyContent: "center" }]}
        >
          <Text style={[styles.text, { color: "white", fontSize: 20 }]}
          >{sentences.pay}</Text>
        </Animated.View>
      </View>
    );
  };

  const UIListOrder = (order, index) => {
    const isSelected = selectedOrders ? selectedOrders.includes(order.id) : false;
    return (
      <Swipeable
        renderLeftActions={renderLeftActions}
        style={{ color: "blue" }}
        onSwipeableOpen={(direction, swipeableRef) => tryPayOrder(direction, swipeableRef, order)}
      >
        <OrderListItem
          navigation={navigation}
          order={order}
          key={order.id}
          canEdit={true}
          isSelected={isSelected}
          onLongPress={() => setOrderSelected(order)}
          invertPress={selectedOrders.length > 0}
        />
      </Swipeable>);
  }

  const UISearchBar = (
    <View style={myStyles.searchBar.container}>
      <TextInput
        style={[styles.text, myStyles.searchBar.textInput]}
        placeholder={sentences.placeholder}
        placeholderTextColor={"rgba(255,255,255, 0.5)"}
        onEndEditing={() => filterOrders(searchBarText)}
        value={searchBarText}
        onChangeText={(text) => onChangeTextSearchBar(text)}
      />
      <OAButton
        isHorizontal={true}
        title={sentences.search}
        icon={"magnify"}
        style={myStyles.searchBar.searchBtn}
        onPress={() => filterOrders(searchBarText)}
        iconProps={{ size: 12, style: { marginHorizontal: 5 } }}
      />
    </View>
  );

  const UIActionBtns = (selectedOrders && selectedOrders.length > 0) ?
    (
      <>
        <OAButton
          isHorizontal={true}
          title={sentences.join}
          icon={"vector-union"}
          style={myStyles.bottomBtns.btn}
          onPress={tryJoinSelectedOrders}
          iconProps={{ size: 20, style: { marginEnd: 5, paddingVertical: 5 } }}
        />
        {
          <OAButton
            title={sentences.edit}
            style={myStyles.bottomBtns.btn}
            icon={"pencil"}
            isHorizontal={true}
            iconProps={{ size: 20, style: { marginEnd: 5, paddingVertical: 5 } }}
            onPress={() => goToEditOrder(selectedOrders[0])}
            disabled={selectedOrders.length !== 1}
          />
        }
      </>
    ) : null;


  return (
    <View style={[myStyles.container]}>
      {UISearchBar}
      <FlatList
        title={sentences.processed}
        style={myStyles.list}
        data={filteredUnpaidOrders}
        ItemSeparatorComponent={<View style={{ height: 10 }} />}
        ListEmptyComponent={UIEmptyList}
        renderItem={({ item, index, separators }) => UIListOrder(item, index)}
      />


      <View style={myStyles.bottomBtns.container}>
        {UIActionBtns}
        <OAButton
          isHorizontal={true}
          title={sentences.addOrder}
          icon={"plus-thick"}
          style={myStyles.bottomBtns.btn}
          onPress={() => navigation.navigate("EditOrder", { createMode: true })}
          iconProps={{ size: 20, style: { marginEnd: 5, paddingVertical: 5 } }}
        />

      </View>
      <View style={{ flex: 100 }}></View>
    </View>
  );
}


const myStyles = StyleSheet.create({
  searchBar: {
    container: {
      alignSelf: "stretch",
      backgroundColor: colors.color_2,
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingBottom: 5,
    },
    textInput: {
      flex: 8,
      color: "white",
      backgroundColor: colors.transpBlack,
      borderRadius: 15,
      marginEnd: 10,
      paddingVertical: 0,
      paddingHorizontal: 15
    },
    searchBtn: {
    }
  },
  container: {
    alignItems: 'stretch',
    justifyContent: "flex-start",
    flex: 1
  },
  list: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  bottomBtns: {
    container: {
      flexWrap: "wrap",
      justifyContent: "space-evenly",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyItems: "space-evenly"
    },
    btn: {
      paddingHorizontal: 10,
      marginBottom: 10,
    }
  },
  textEmptyList: {
    color: colors.color_8,
    alignSelf: "center",
    padding: 20,
    fontSize: 20,
  },
  textHeader: {
    color: "white",
    alignSelf: "stretch",
    backgroundColor: colors.grey,
    borderRadius: 10,
    padding: 10
  }
});
