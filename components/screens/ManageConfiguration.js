<script src="http://localhost:8097"></script>
import React, { PureComponent, useState, useEffect } from 'react';

import { StyleSheet, View, NativeModules, Text, Pressable, DeviceEventEmitter } from 'react-native';

import Animated, { useAnimatedStyle, ZoomInEasyUp, ZoomIn, withTiming } from 'react-native-reanimated';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Toast } from 'react-native-toast-message/lib/src/Toast';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";
import Header, {screens} from "@components/Header";
import OATextInput from '@components/OATextInput';
import OAFlatList from '@components/OAFlatList';
import EditWorkStationDialog from "@components/EditWorkStationDialog";
import OAViewPager from '@components/OAViewPager';
import OAToggle from '@components/OAToggle';
import OAFullScreen from '@components/OAFullScreen';





const { ManageConfigurationsModule, OAMainModule } = NativeModules;

const priceFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default function ManageConfiguration({ route, navigation }) {


  const [itemTypeList, setItemTypeList] = useState([]);
  const [workStations, setWorkStations] = useState({});
  const [payOnStart, setPayOnStart] = useState(false);
  const[hasTables, setHasTables] = useState(true);
  const [processOnStart, setProcessOnStart] = useState(false);
  const [coverCharge, setCoverCharge] = useState("0");

  const [configurationName, setConfigurationName] = useState(route.params.configurationName);


  const [createMode, setCreateMode] = useState(route.params.behaviour && route.params.behaviour == "create");
  const [isOnWS, setIsOnWS] = useState(route.params.isOnWS);
  const [errorName, setErrorName] = useState({ show: false, msg: "" });
  const [workStationDialogInfo, setWorkStationDialogInfo] = useState({ isOpen: false, workStationName: "", affectedCats: [] });
  const [sessionCats, setSessionCats] = useState([]);
  const [selectedViewPagerIndx, setSelectedViewPagerIndx] = useState(route.params.isOnWS ? 2 : 0);

  const [sentences, setSentences] = useState({
    createConfiguration: "Crea configurazione",
    editConfiguration: "Modifica configurazione",
    name: "Nome",
    shortName: "Nome breve",
    description: "Descrizione",
    addItem: "Aggiungi item",
    save: "Salva",
    cancel: "Annulla",
    emptyField: "Campo nome vuoto",
    errNameExist: "Configurazione già presente in memoria",
    errorCannotSaveMsg: "Configurazione non salvata",
    errorItem: "Item non corretto",
    item: "Item",
    workStations: "Postazioni",
    addWorkStation: "Aggiungi postazione",
    workStation: "Postazione",
    payment: "Pagamento",
    payOnStart: "Paga all'inizio",
    payOnStartHint: "Quando l'ordine viene creato, si considera gia pagato.  (Es. scontrino alla cassa)",
    tables: "Tavoli",
    hasTables: "Tavoli presenti",
    hasTablesHint: "In caso di assenza di tavoli un'ordine puo essere fatto senza specificarne uno",
    processOnStartLabel: "Completamento",
    processOnStart: "Completa all'inizio",
    processOnStartHint: "Completando all'inizio l'ordine non passerà per per le postazioni",
    coverCharge: "Costo coperto",
    configurationCorrectlySaved: "Configurazione salvata correttammente"
  });

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("seItemTypeList", setItemTypeList);
    Header.initScreen(screens.ManageConfiguration, {
      onResume: handleResume,
         headerProps: {
          title:  createMode ? sentences.createConfiguration : sentences.editConfiguration
         }
    })
    
    return () => {
      Header.removeScreen(screens.ManageConfiguration);
    }
  }, []);

  const handleResume = (firstInit) => {
    if (firstInit && !createMode)
      loadItemTypeConfiguration(route.params.configurationName);
  }

  useEffect(() => {
    if (itemTypeList && itemTypeList.length > 0) {
      const sesnCats = []
      itemTypeList.forEach(el => {
        el.itemCats.forEach(cat => {
          if (!sesnCats.includes(cat))
            sesnCats.push(cat);
        });
      });
      setSessionCats(sesnCats);
    }
  }, [itemTypeList]);


  const loadItemTypeConfiguration = (confName) => {
    if (route.params.isOnWS)
      NativeModules.OAMainModule.getCurrentConfiguration(fillForm);
    else
      NativeModules.ManageConfigurationsModule.loadItemTypeConfiguration(confName, fillForm)
  }

  const fillForm = (config) => {
      if (config.itemTypeList)
        setItemTypeList(config.itemTypeList);
      if (config.workStations)
        setWorkStations(config.workStations);
      if (config.name)
        setConfigurationName(config.name);

      if (typeof config.preferences === "object") {
        setPayOnStart(config.preferences.payOnStart);
        setHasTables(config.preferences.hasTables);
        setProcessOnStart(config.preferences.processOnStart);
        setCoverCharge(config.preferences.coverCharge.toFixed(2).toString());
      }
  }

  const addItem = () => {
    let newItem = {
      name: "Item " + (itemTypeList.length + 1),
      shortName: "",
      description: "",
      price: 0,
      id: itemTypeList.length,
      itemCats: [],
      available: true, 
      comment: "",
      newItem: true,
    };
    setItemTypeList([...itemTypeList, newItem]);
    return true;
  };

  const goToEditItemType = (itemIndx) => {
    const item = JSON.parse(JSON.stringify(itemTypeList[itemIndx]));
    navigation.navigate("EditItemType", { itemType: item, 
      itemTypeList: itemTypeList,
       sessionCats: sessionCats, isOnWS: isOnWS });
  };

  const checkItemTypeList = () => {
    let allGood = true;
    const newList = itemTypeList.map((el, indx) => {
      if (el.newItem) {
        allGood = false;
        return { ...el, hasErrors: true }
      }
      return el;
    })
    if (!allGood)
      setItemTypeList(newList);
    return allGood;
  }

  const trySaveAndExit = () => {
    const nameIsGood = (configurationName && configurationName.length > 0);
    const itemTypeListGood = checkItemTypeList();
    const coverChargeGood =  !isNaN(parseFloat(coverCharge));

    if (!nameIsGood)
      setErrorName({ show: true, msg: sentences.emptyField });
    if (nameIsGood && itemTypeListGood && coverChargeGood) {
      if (isOnWS)
        saveOnWSAndExit();
        else
      NativeModules.ManageConfigurationsModule.changeConfigurationName(
        route.params.configurationName, configurationName, (allGood) => {
          if (allGood)
            saveAndExit()
          else
            setErrorName({ show: true, msg: sentences.errNameExist })
        }
      );
    }
  }

  const saveOnWSAndExit = () => {
    const preferences = {
      payOnStart,
      hasTables,
      processOnStart,
      coverCharge: parseFloat(coverCharge)
    };
    NativeModules.OAMainModule.updateConfiguration(
      itemTypeList, workStations, preferences, handleSaveResponse
    )

  }

  const saveAndExit = () => {
    const preferences = {
      payOnStart,
      hasTables,
      processOnStart,
      coverCharge: parseFloat(coverCharge)
    };
    NativeModules.ManageConfigurationsModule.saveItemTypeConfiguration(
      configurationName, itemTypeList, workStations, preferences,
      handleSaveResponse
    );
  }

  const handleSaveResponse = (good) => {
    if (good) {
      Toast.show({
        type: "success",
        text1: sentences.configurationCorrectlySaved,
      });
      Header.goBack();
    }
    else
      OAFullScreen.showDialog({
        type: "errror",
        description: sentences.errorCannotSaveMsg,
        onPressPrimaryBtn: () => setValFun(newVal),
      });
  }

  const addWorkStation = () => {
    setWorkStations(prev => {
      const newArray = JSON.parse(JSON.stringify(prev));
      const num = Object.keys(newArray).length + 1;
      newArray[sentences.workStation + " " + num] = [];
      return newArray;
    });
    return true;
  }

  const openWorkStationDialog = (workStationName) => {
    setWorkStationDialogInfo({
      isOpen: true,
      workStationName: workStationName, affectedCats: workStations[workStationName]
    })
  }

  const onConfirmWorkStationDialog = (workStationName, affectedCats) => {
    setWorkStations(prev => {
      const neww = JSON.parse(JSON.stringify(prev));
      if (affectedCats && affectedCats.length > 0)
        neww[workStationName] = affectedCats;
      else
        delete neww[workStationName];
      return neww;
    });
    setWorkStationDialogInfo({ ...workStationDialogInfo, isOpen: false });
  }

  const UIItemTypeListItem = (item, index, separators) => {
    const hasErrors = item.hasErrors;
    const color = item.available ? "white" : colors.transpBlack;
    return (
      <Animated.View
        entering={ZoomIn}
        style={[myStyles.itemTypeList.item.container,
        {
          borderColor: hasErrors ? colors.redBtn : colors.transpBlack,
          borderWidth: 2
        }
        ]}
      >
        <Pressable
          onPress={() => goToEditItemType(item.id)}
          //onLongPress={() => handleItemTypeLongPress(item.id)}
          style={myStyles.itemTypeList.item.pressable}
        >
          <View style={myStyles.itemTypeList.item.row_1}>
            <Text style={[styles.text, { flex: 5, color }]}>{item.name}</Text>
            <Text style={[styles.text, { flex: 3, color }]}>
              {priceFormatter ? priceFormatter.format(item.price) : "vuoto"}</Text>
            <Text style={[styles.text, { flex: 4, color }]}>{item.shortName}</Text>
          </View>
          <View style={myStyles.itemTypeList.item.catsContainer}>
            {item.itemCats.map((el, indx) => {
              return (<Text key={el}
                style={[styles.text, myStyles.itemTypeList.text,
                myStyles.itemTypeList.item.cat]}>{el}</Text>);
            })}
          </View>
          {isOnWS && item.comment ? (
            <Text style={[styles.text, {}]}>{item.comment}</Text>
          ) : null}

        </Pressable>
      </Animated.View>
    );
  }

  const UIWorkstationListItem = (workStationName, index, separators) => {
    const affectedCats = workStations[workStationName];
    const hasErrors = false;
    return (
      <Animated.View
        entering={ZoomIn}
        style={[myStyles.workStationList.item.container,
        {
          borderColor: hasErrors ? colors.redBtn : colors.transpBlack,
          borderWidth: 2
        }
        ]}
      >
        <Pressable
          onPress={() => openWorkStationDialog(workStationName)}
          style={myStyles.workStationList.item.pressable}
        >
          <Text style={[styles.text, myStyles.workStationList.text]}>
            {workStationName}</Text>
          <View style={myStyles.workStationList.item.catsContainer}>
            {affectedCats.map((el, indx) => {
              return (<Text key={el}
                style={[styles.text, myStyles.workStationList.item.cat]}>{el}</Text>);
            })}
          </View>


        </Pressable>
      </Animated.View>
    );
  }

  const UIEditWorkStationDialog = workStationDialogInfo.isOpen ? (
    <EditWorkStationDialog
      onConfirm={onConfirmWorkStationDialog}
      workStationInfo={workStationDialogInfo}
      onRequestClose={() => setWorkStationDialogInfo(prev => { return { ...prev, isOpen: false } })}
      isVisible={workStationDialogInfo.isOpen}
      sessionCats={sessionCats}
    />
  ) : null;


  const UIScreen1 = () => {
    return (
      <>
        <OATextInput
          label={sentences.name}
          value={configurationName}
          setValue={setConfigurationName}
          showError={errorName.show}
          errorMsg={errorName.msg}
        />
        <OAFlatList
          label={sentences.workStations}
          data={workStations ? Object.keys(workStations) : []}
          UIItem={UIWorkstationListItem}
          onPressBtn={addWorkStation}
          sentenceBtn={sentences.addWorkStation}
        />
      </>
    );
  }

  const UIScreen2 = () => {
    return (
      <>
        <OAToggle
          value={payOnStart}
          setValue={setPayOnStart}
          label={sentences.payment}
          showError={false}
          showHint={true}
          hintMsg={sentences.payOnStartHint}
          mainMsg={sentences.payOnStart}
          style={{}}
        />
        <OAToggle
          value={processOnStart}
          setValue={setProcessOnStart}
          label={sentences.processOnStartLabel}
          showError={false}
          showHint={true}
          hintMsg={sentences.processOnStartHint}
          mainMsg={sentences.processOnStart}
          style={{}}
        />
      </>
    );
  }

  const UIScreen3 = () => (
    <>
     <OAToggle 
      value={hasTables} 
      setValue={setHasTables} 
      label={sentences.tables} 
      showError={false}
      showHint={true} 
        hintMsg={sentences.hasTablesHint}
        mainMsg={sentences.hasTables}
        style={{}}
      />
      <OATextInput
        value={coverCharge}
        setValue={setCoverCharge}
        label={sentences.coverCharge}
        keyboardType={"decimal-pad"}
        showError={false}
        errorMsg={false}
        style={{}}
      />

    </>
  );

  const UIScreen4 = () => (
    <OAFlatList
      label={sentences.item}
      data={itemTypeList}
      UIItem={UIItemTypeListItem}
      onPressBtn={addItem}
      sentenceBtn={sentences.addItem}
    />
  );


  return (
    <View style={[myStyles.container]}>
      {UIEditWorkStationDialog}
      <OAViewPager
        pageStyle={{padding: 10}}
        showIndicator={true}
        UI_1={isOnWS ? UIScreen2() : UIScreen1()}
        UI_2={isOnWS ? UIScreen3() : UIScreen2()}
        UI_3={isOnWS ? UIScreen4() : UIScreen3()}
        UI_4={isOnWS ? null : UIScreen4()}
        numOfPages={4}
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
  itemTypeList: {
    item: {
      container: {
        backgroundColor: colors.transpBlack,
        borderRadius: 30,
        width: "100%",
      },
      row_1: {
        flexDirection: "row",
        justifyContent: "space-between"
      },
      catsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
      },
      cat: {
        borderRadius: 30,
        backgroundColor: colors.transpBlack,
        paddingHorizontal: 10,
        borderwidth: 1,
        borderColor: colors.transpBlack,
        fontSize: 10,
        marginEnd: 10,
        color: "rgba(255,255,255,0.7)"
      },
      pressable: {
        width: "100%",
        paddingHorizontal: 20,
        paddingVertical: 5,
        justifyContent: "center"
      }
    },
  },
  workStationList: {
    item: {
      container: {
        backgroundColor: colors.transpBlack,
        borderRadius: 30,
        width: "100%",

      },
      pressable: {
        width: "100%",
        paddingHorizontal: 20,
        paddingVertical: 5,
        flexDirection: "row",
        justifyContent: "space-between"
      },
      text: {
        flex: 1,
        color: "white",
      },
      catsContainer: {
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        paddingLeft: 10,
        alignItems: "center",

      },
      cat: {
        borderRadius: 30,
        backgroundColor: colors.transpBlack,
        paddingHorizontal: 10,
        borderwidth: 1,
        fontSize: 10,
        marginEnd: 10,
        color: "rgba(255,255,255,0.7)",
        marginBottom: 5,
      },
    }
  },
  container: {
    width: "100%",
    height: "100%"
  },
});