<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';

import { StyleSheet, View, NativeModules, Text, Pressable, FlatList, RefreshControl, DeviceEventEmitter } from 'react-native';
import styles from '@styles/DefaultStyles';

import OAButton from "@components/OAButton";
import Header, {screens} from "@components/Header";


export default function ConfigurationList({navigation}) {
   
  const [itemTypeConfigurations, setItemTypeConfigurations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sentences, setSentences] = useState({
    manageConfigurations: "Gestisci configurazioni",
    createConfiguration: "Crea configurazione"
  });

  useEffect(() => {
    Header.initScreen(screens.ConfigurationList, {
      onResume: getItemTypeConfigurations,
      headerProps: {
        title: sentences.manageConfigurations, 
        }

    });
    return () => {
      Header.removeScreen(screens.ConfigurationList);
    }
  },[]);

  const getItemTypeConfigurations = () => {
    setRefreshing(true);
    NativeModules.ManageConfigurationsModule.getItemTypeConfigurations(res => {
      if (res) {
        if (typeof(res) === "string")
          res = [res];
        if (Array.isArray(res))
          setItemTypeConfigurations(res);
      }
      setRefreshing(false);
    })
  }

  const goToNewConfiguration = () => {
    navigation.navigate("ManageConfiguration", {behaviour: "create", configurationName: ""});
  }
  const goToEditConfiguration = (confName) => {
    navigation.navigate("ManageConfiguration", {behaviour: "edit", configurationName: confName});
  }

  const UIDivider = () => {
    return (<View style={myStyles.configurationList.divider}/>);
  }

  const UIListItem = (itm) => {
    return(<Pressable 
            onPress={() => goToEditConfiguration(itm)}
              style={myStyles.configurationList.item}>
              <Text style={[styles.text, myStyles.configurationList.text]}>{itm}</Text>
            </Pressable>);
  }


  return (
    <View style={[styles.container, myStyles.container]}>
        <View style={myStyles.configurationList.container}>
        <FlatList
          style={myStyles.configurationList.list}
          data={itemTypeConfigurations}
          ItemSeparatorComponent={UIDivider}
          refreshControl={<RefreshControl
            refreshing={refreshing}
            onRefresh={getItemTypeConfigurations} />}
          renderItem={({ item, index, separators }) => UIListItem(item)}
        />
      </View>

      <View style={myStyles.bottomBtns}>
        <OAButton
          style={{flex: 1}}
          onPress={goToNewConfiguration}
          title={sentences.createConfiguration}
          image={require('@images/icons/plus.png')}
          imageStyle={{width: 30, height: 30}}
        />
      </View>
    </View>
  );

}


  const myStyles = StyleSheet.create({
    container: {
      justifyContent: "space-between"
    },
    configurationList: {
      container: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        width: "100%",
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 20,
      },
      list: {
        width: "100%",
        paddingHorizontal: 10,
      },
      item: {
        marginVertical: 14,
      },
      text: {
        color: "rgba(255,255,255,1)"
      },
      divider:{
        color: "red",
        backgroundColor: "rgba(255,255,255,0.3)",
        height: 1,
      },
    }, 
    bottomBtns: {
      marginTop: 15,
      height: 100,
      width: "100%",
      flexDirection: "row",
      bottom: 0
     },  
  }); 