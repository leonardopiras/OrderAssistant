<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  NativeModules, Pressable, Text, DeviceEventEmitter
} from 'react-native';

import Toast from 'react-native-toast-message';



import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Header, {screens} from "@components/Header";
import OAButton from "@components/OAButton";
import OAFlatList from "@components/OAFlatList";
import EditItem from '@components/EditItem';
import OATextInput from '@components/OATextInput';
import OAToggle from '@components/OAToggle';
import OAViewPager from '@components/OAViewPager';
import Item from '@components/Item';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import OAFullScreen from '@components/OAFullScreen';




const { OAMainModule } = NativeModules;

const priceFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });


export default function EditOrder({ route }) {

  const [createMode, setCreateMode] = useState(route.params.createMode);
  const [editOrder, setEditOrder] = useState({}); // Order if not in create mode

  const [itemTypeList, setItemTypeList] = useState({});
  const [itemList, setItemList] = useState([]);
  const [comment, setComment] = useState("");
  const [table, setTable] = useState("");
  const [editItemModal, setEditItemModal] = useState({ isOpen: false, editableItemType: null, isEdit: false });
  const [total, setTotal] = useState(0);
  const [selectedViewPagerIndx, setSelectedViewPagerIndx] = useState(0);
  const [preferences, setPreferences] = useState({payOnStart: false, hasTables: true});
  const [showErrorTable, setShowErrorTable] = useState(false);
  const [isPaid, setPaid] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false); 
  const [seats, setSeats] = useState("0");

  const [sentences, setSentences] = useState({
    newOrder: "Nuovo ordine",
    editOrder: "Modifica ordine",
    addItem: "Nuovo item",
    item: "Item",
    total: "Tot",
    comment: "Commento",
    table: "Tavolo",
    save: "Salva",
    continue: "Continua",
    goBack: "Indietro",
    cancel: "Annulla",
    orderSuccessFullyAdded: "Ordine aggiunto con successo",
    orderNotAdded: "Errore nell'aggiunta dell'ordine",
    tableNotValid: "Tavolo non valido",
    payment: "Pagamento",
    paid: "Pagato",
    confirm: "Conferma",
    deleteOrderTitle: "Attenzione",
    deleteOrderDescription: "Sei sicuro di voler rimuovere quest'ordine?",
    orderSuccessFullyUpdated: "Ordine aggiornato correttamente",
    orderNotUpdated: "Errore nell'aggiornamento dell'ordine",
    orderDeletedBySomeone: "Ordine cancella da qualcun'altro",
    state: "Stato",
    completed: "Completato",
    orderSuccessFullyDeleted: "Ordine cancellato correttamente",
    orderNotDeleted: "Errori nella cancellazione dell'ordine",
    confirmPay: "Sei sicuro di voler pagare l'ordine?",
    confirmUnpay: "Sei sicuro di voler rimuovere il pagamento dall'ordine?",
    confirmProcess: "Sei sicuro di voler processare l'ordine? Così facendo non arriverà alle postazioni",
    confirmUnprocess: "Sei sicuro di voler riprocessare l'ordine? Le postazioni potrebbero averlo già preparato in precedenza",
    confirmDelete: "Sei sicuro di voler eliminare l'ordine?",
    pay: "Paga",
    seats: "Coperto",
  });

  useEffect(() => {
   
    Header.initScreen(screens.EditOrder, {
      onUpdate: handleUpdate,
      onResume: handleResume,
      headerProps: {
        title: createMode ? sentences.newOrder : sentences.editOrder,
      }
    });

    return () => {
      Header.removeScreen(screens.EditOrder);
    }
  }, []);

  useEffect(() => {
      const num = getTotal();
      setTotal(num);
    
  }, [itemList, seats]);

  const handleResume = () => {
    NativeModules.OAMainModule.getCurrentConfiguration(config => {
      if (config) {
        setItemTypeList(config.itemTypeList);
        setPreferences(config.preferences);
        if (createMode) {
          setPaid(config.preferences.payOnStart);
          setIsProcessed(config.preferences.processOnStart);
        }
      }
    });

    if (!createMode)
      fetchOrder(route.params.orderId)
        .then(order => fillForm(order, false))
        .catch(() => Header.goBack());

  }


  const fetchOrder = (orderId) => {
    return new Promise((resolve, reject) => {
      NativeModules.OAMainModule.getOrder(orderId, order => {
        if (order)
          resolve(order);
        else {
          Toast.show({
            type: 'error',
            text1: sentences.orderDeletedBySomeone
          });
          reject("Order deleted");
        }
      });
    });
  }

  const handleUpdate = (type) => {
    if (!createMode) {
      const orderId = (editOrder && editOrder.id) ? editOrder.id : route.params.orderId;
      if (typeof orderId === "number" && orderId >= 0)
        fetchOrder(orderId)
          .then(order => fillForm(order, true))
          .catch(() => Header.goBack());
    }
  }


  const fillForm = (order, isFromEvent) => {
    setEditOrder(JSON.parse(JSON.stringify(order)));
    if (isFromEvent)
      safeUpdateItemList(order.itemList);
    else
      setItemList(order.itemList);
    if (!isFromEvent) {
      setComment(order.comment);
      setTable(order.table.toString());
    }
    setPaid(order.isPaid);
    setIsProcessed(order.isProcessed);
    setSeats(order.seats.toString());
  }


  const safeUpdateItemList = (newItemList) => {
    setItemList(prev => {
      if (newItemList.length > prev.length) {
        // If newList has more items maybe it's a join result from 2 orders: 
        // there might be information loss if we dont overwrite prev
        // Note: If we overwrite items in every workservice update user cant edit them
        return newItemList; 
      } else {
        return prev.map((el, indx) => {
          const newItem = newItemList.find(e => e.id === el.id);
          return {
            ...el, completed: newItem ? newItem.completed : el.completed
          };
        })
      }
    })
  }

  useEffect(() => {
    setRight(selectedViewPagerIndx === 0);
  }, [selectedViewPagerIndx])


  const setRight = (firstScreen) => {
    Header.setRight(
        <OAButton
          onPress={firstScreen ? openEdiItemModal : deleteOrder}
          icon={firstScreen ? "plus-thick" : "delete-outline"}
          askConfirm={!firstScreen}
          description={sentences.confirmDelete}
          style={{ backgroundColor: "rgba(0,0,0,0)", borderWidth: 0 }}
          iconProps={{ size: 27, style: {} }}
        />
    )
  };

  const openEdiItemModal = (editItem) => {
    setEditItemModal({
      isOpen: true,
      isEdit: (editItem) ? true : false,
      editableItem: editItem ? editItem : null
    });
  }

  const closeEditItemModal = (reopen) => {
    setEditItemModal(prev => { return { ...prev, isOpen: false } });
    if (typeof reopen === "boolean" && reopen)
      setTimeout(() => {
        openEdiItemModal();
      }, 1000)
  }

  const saveItem = (selectedItemType, quantity, comment, id) => {
    const isItemUpdate = (typeof id === "number");
    if (!isItemUpdate && quantity <= 0)
      return;
    setItemList(prev => {
      if (isItemUpdate) { // Existing item has to be updated
        if (quantity <= 0)
          return prev.filter(el => el.id !== id);
        return prev.map((el, indx) => {
          return (el.id === id) ?
            {
              quantity: quantity,
              itemType: selectedItemType,
              comment: comment,
              completed: el.completed,
              id: id
            }
            : el
        });
      }
      else // New Item has to be added
        return [...prev,
          {
          quantity: quantity,
          itemType: selectedItemType,
          comment: comment,
          completed: false,
          id: prev.length
        }];
    });
  }

  const getTotal = () => {
    let num = 0;
    if (itemList && itemList.length > 0)
      num = itemList.reduce((partialSum, el) => partialSum + (el.itemType.price * el.quantity), 0);
    const seatsNum = parseFloat(seats);
    if (!isNaN(seatsNum) && seatsNum > 0)
      num += (seats * (createMode ? preferences.coverCharge : editOrder.coverCharge));
    return num.toString();
  }

  const tryPayAndExit = () => {
    trySaveAndExit(true);
  }

  const trySaveAndExit = (overWritePayment) => {
    if (itemList && itemList.length > 0) {
      if (preferences.hasTables && checkTableAndSeats()) {
        OAFullScreen.setLoading(true);
        if (createMode)
          addOrderAndExit();
        else 
          updateOrderAndExit(overWritePayment);
      }
    }
    else
      openDeleteOrderModal();
  }

  const checkTableAndSeats = () => {
    const tableNumber = parseInt(table);
    if (isNaN(tableNumber)) {
      setShowErrorTable(true);
      return false;
    } else {
      setShowErrorTable(false);
      
      return !isNaN(parseInt(seats));
    }
  }

  const updateOrderAndExit = (overWritePayment) => {
    const paid = typeof overWritePayment === "boolean" ? overWritePayment : isPaid;
    OAMainModule.updateOrder(itemList, comment, table, paid, isProcessed,
      parseInt(seats), editOrder.coverCharge,
      editOrder.id, editOrder.birthDate, editOrder.processDate, (good) => {
        OAFullScreen.setLoading(false);
        if (good) {
          Toast.show({
            type: 'success',
            text1: sentences.orderSuccessFullyUpdated
          });
          Header.goBack();
        } else {
          Toast.show({
            type: 'error',
            text1: sentences.orderNotUpdated
          });
        }
      });
  }

  const addOrderAndExit = () => {
    OAMainModule.addOrder(itemList, comment, table, isPaid, 
      isProcessed, parseInt(seats), preferences.coverCharge, (good) => {
        OAFullScreen.setLoading(false);

      if (good) {
        Toast.show({
          type: 'success', 
          text1: sentences.orderSuccessFullyAdded
        });
        Header.goBack();
      } else {
        Toast.show({
          type: 'error', 
          text1: sentences.orderNotAdded
        });
      }
    });
  }

  const deleteOrder = () => {
    if (createMode)
      Header.goBack();
    else {
      OAMainModule.deleteOrder(route.params.orderId, good => {
        if (good) {
          Toast.show({
            type: 'success',
            text1: sentences.orderSuccessFullyDeleted
          });
          Header.goBack();
        } else {
          Toast.show({
            type: 'error',
            text1: sentences.orderNotDeleted
          });
        }
      });
    }
  }

  const UIEditItemModal = (editItemModal && editItemModal.isOpen) ? (
    <EditItem
      itemTypeList={itemTypeList}
      editableItem={editItemModal.editableItem}
      onRequestClose={closeEditItemModal}
      isEdit={editItemModal.isEdit}
      saveItemFun={saveItem}
    />
  ) : null;

  const UIListItem = (item) => {
    return (
      <Item
        name={item.itemType.shortName}
        quantity={item.quantity}
        price={item.itemType.price}
        comment={item.comment}
        completed={item.completed}

        showStatus={!createMode}
        onPress={() => openEdiItemModal(item)}
      />
    );
  };

  const UIOrderSeats = preferences.hasTables && parseInt(seats) > 0 ? (
    <View
      style={{ marginVertical: 10 }}
    >
      <Item
        name={sentences.seats}
        quantity={seats}
        price={preferences.coverCharge}
        showStatus={!createMode}
        onPress={null}
        isSeats={true}
      />
    </View>) : null;

  const UIOrderInfo = (!createMode) ? (
    <View style={myStyles.orderInfo.container}>
      <View
        style={[myStyles.orderInfo.item, myStyles.orderInfo.iconTextWrapper]}
      >
        <Text style={[styles.text, myStyles.orderInfo.text]}>#</Text>
        <Text style={[styles.text, myStyles.orderInfo.text]}>
          {editOrder.id}
        </Text>
      </View>
      { preferences.hasTables ?
       ( <View
        style={[myStyles.orderInfo.item, myStyles.orderInfo.iconTextWrapper]}
      >
        <Icon
          name={"table-chair"}
          color={colors.grey1}
          size={20}
        />
        <Text style={[styles.text, myStyles.orderInfo.text]}>
          {editOrder.table}
        </Text>
      </View>) : null
      }
      <Icon
        name={isPaid ? "cash-check" : "cash-remove"}
        color={colors.grey1}
        size={20}
        style={myStyles.orderInfo.item}
      /> 
      <Icon
      name={isProcessed ? "check-all" : "close"}
      color={colors.grey1}
      size={20}
      style={myStyles.orderInfo.item}
    />
      


    </View>
  ) : null; 

  const UIFirstScreen = true ? (
    <View style={myStyles.viewPgrChild}>
            {UIOrderInfo}
      <OAFlatList
        label={sentences.item}
        data={itemList}
        UIItem={UIListItem}
        style={myStyles.itemList.list}
        onPressBtn={() => openEdiItemModal()}
        sentenceBtn={sentences.addItem}
        ListFooterComponent={UIOrderSeats}
      />
      <View style={myStyles.total.container}>
        {!createMode && !isPaid ? (
          <OAButton
          title={sentences.pay}
          isHorizontal={true}
          onPress={tryPayAndExit}
          icon={"cash-fast"}
          style={{ backgroundColor: colors.greenBtn, paddingHorizontal: 15}}
          iconProps={{ size: 27, style: {marginEnd: 10} }}
        />
        ) : null}
        <Text style={[styles.text, myStyles.total.text]}>{sentences.total}:  </Text>
        <Text style={[styles.text, myStyles.total.text]}>{priceFormatter.format(total)}</Text>
      </View>

    </View>
  ) : null;


  const UISecondScreen = true ? (
    <View style={myStyles.viewPgrChild}>
      <OATextInput
        value={comment}
        setValue={setComment}
        label={sentences.comment}
        showError={false}
        errorMsg={false}
        multiline={true}
        style={[myStyles.inputs]}
      />
      {preferences && preferences.hasTables ?
        <View
          style={{flexDirection: "row", marginVertical: 5}}
        >
          <OATextInput
            value={table}
            setValue={setTable}
            label={sentences.table}
            keyboardType={"decimal-pad"}
            showError={showErrorTable}
            errorMsg={sentences.tableNotValid}
            style={{flex: 1, marginRight: 3}}
          />
          <OATextInput
            value={seats}
            setValue={setSeats}
            label={sentences.seats}
            keyboardType={"decimal-pad"}
            showError={false}
            errorMsg={false}
            style={{flex: 1}}
            showSigns={false}
          />
        </View>
        : null
      }
      <OAToggle
        value={isPaid}
        setValue={setPaid}
        label={sentences.state}
        showError={false}
        mainMsg={sentences.paid}
        value1={isProcessed}
        setValue1={setIsProcessed}
        mainMsg1={sentences.completed}
        askConfirm={true}
        getWarningMessage={(paid) => paid ? sentences.confirmPay : sentences.confirmUnpay}
        getWarningMessage1={processed => processed ? sentences.confirmProcess : sentences.confirmUnprocess}
        style={{}}
      />
    </View>

  ) : null;

 
  


  return (
    <View style={[myStyles.container]}>
      {UIEditItemModal}
      <OAViewPager
        showIndicator={true}
        UI_1={UIFirstScreen}
        UI_2={UISecondScreen}
        numOfPages={2}
        selectedIndx={selectedViewPagerIndx}
        setSelectedIndx={setSelectedViewPagerIndx}
        showBtns={true}
        trySaveAndExit={trySaveAndExit}
        goBack={Header.goBack}
      />
    </View>
  );
}


const myStyles = StyleSheet.create({
  orderInfo: {
    container: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      margin: 0,
      padding: 0,
    },
    item: {
      marginEnd: 20,
    },
    text: {
      color: colors.grey1,
      fontSize: 18,
      paddingLeft: 5,
    },
    iconTextWrapper: {
      flexDirection: "row",
      alignItems: "center"
    },
  },
  container: {
    width: "100%",
    height: "100%",
  },
  itemList: {
    list: {
      width: "100%",
    },
    itm: {
      pressable: {
        width: "100%",
        backgroundColor: colors.transpBlack,
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "stretch",
        marginBottom: 10,
      },
      text: {
        color: "white"
      },
      description: {
        paddingHorizontal: 10,
      }
    }
  },
  viewPgrChild: {
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 10
  },
  total: {
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignSelf: "stretch",
      padding: 10,
      paddingEnd: 30,
    },
    text: {
      color: colors.color_2,
      fontSize: 20,
    }
  },
  swipePay: {
    container: {
      flex: 1,
      marginEnd: 10,
    },
  },
  bottomBtns: {
    container: {
      alignSelf: "stretch",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      flexDirection: "row",
      height: 50,
      marginHorizontal: 30
    },
    btn: {
      marginStart: 10
    }
  },



}); 
