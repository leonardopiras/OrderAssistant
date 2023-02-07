<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text,
  View,
  NativeModules, FlatList, Animated, ScrollView, TextInput, DeviceEventEmitter
} from 'react-native';

import Swipeable from 'react-native-gesture-handler/Swipeable';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Header, {screens} from "@components/Header";
import OAButton from "@components/OAButton";
import OrderListItem from '@components/OrderListItem';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

let searchBarTimerRunning = false;

export default function ProcessedOrders({navigation, route}) {
   
  const [processedOrders, setprocessedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchBarText, setSearchBarText] = useState("");  
  const [sentences, setSentences] = useState({
    processed: "Completati",
    emptyList: "Nessun ordine completato",
    search: "Cerca",
  });

  useEffect(() => {
    Header.initScreen(screens.ProcessedOrders, {
      onResume: handleResume,
      headerProps: {
        title: sentences.processed
      }
    });

    return () => {
      Header.removeScreen(screens.ProcessedOrders);
    }
  },[]);

  const handleResume = () => {
    NativeModules.OAMainModule.getOrderLists(handleListsUpdate);
  }

  const handleListsUpdate = (lists) => {
    setprocessedOrders(lists.processed);
    filterOrders(searchBarText, lists.processed);
  }
 


 
  const filterOrders = (filterText, newOrders) => {
    const orders = newOrders ? newOrders : processedOrders;
    if (filterText)
      setFilteredOrders(orders.filter(ord => ord.table.includes(filterText)));
    else 
      setFilteredOrders(orders);
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

  const UIEmptyList = () => {
    return (
      <Text style={[styles.text, myStyles.textEmptyList]}>{sentences.emptyList}</Text>
    );
    }

    const UIListOrder = (order, index) => {
        return (
            <OrderListItem
                navigation={navigation}
                order={order}
                key={order.id}
            />
        );
    }

  const UISearchBar = (
    <View style={myStyles.searchBar.container}>
    <TextInput
      style={[styles.text, myStyles.searchBar.textInput]}
      placeholder={sentences.placeholder}
      placeholderTextColor={"rgba(255,255,255, 0.5)"}
      onEndEditing={filterOrders}
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

  return (
    <View style={[myStyles.container]}>
     {UISearchBar}
      <FlatList
        title={sentences.processed}
        style={myStyles.list}
        data={filteredOrders}
        ItemSeparatorComponent={<View style={{ height: 10 }} />}
        ListEmptyComponent={UIEmptyList}
        ListFooterComponent={<View style={{ height: 50, width: "100%" }} />}
        renderItem={({ item, index, separators }) => UIListOrder(item, index)}
      />

      <View style={myStyles.bottomBtns.container}>
        
      </View>
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
    justifyContent: 'space-between',
      alignItems: 'stretch',
      flex: 1
    },
    list: {
      flex: 1,
      marginHorizontal: 10,
      marginVertical: 10
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
