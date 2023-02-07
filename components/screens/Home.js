<script src="http://localhost:8097"></script>
import React, { PureComponent, useState, useEffect } from 'react';
import { StyleSheet, View, NativeModules, Text, Pressable } from 'react-native';

import styles from '@styles/DefaultStyles';


const { OAMainModule } = NativeModules;


export default function Home({ navigation }) {

  const [sentences, setSentences] = useState({
    toService: "Al servizio",
    manageConfigurations: "Gestisci configurazioni"
  });

  const goToDestination = (destination) => {
    switch (destination) {
      case "WaitRoom":
        goToWaitRoomOrWorkStations();
      default:
        navigation.navigate(destination);
    }
  }

  const goToWaitRoomOrWorkStations = () => {
    OAMainModule.isWorkServiceRunning(isRunning => {
      if (isRunning)
        navigation.navigate("WorkService");
      else 
        navigation.navigate("WaitRoom");
    });
  }


  const homeButton = (destination, destinationName) => {
    return (
      <Pressable style={[styles.button, myStyles.mainBtn]} onPress={() => goToDestination(destination)}>
        <Text style={[styles.text, myStyles.text]}>{destinationName}</Text>
      </Pressable>);
  }
  return (
    <View style={styles.container}>
      {homeButton("WaitRoom", sentences.toService)}
      {homeButton("ConfigurationList", sentences.manageConfigurations)}
    </View>
  );
}


const myStyles = StyleSheet.create({
  mainBtn: {
    alignSelf: "stretch",
    marginBottom: 10
  },
  text: {
    color: "white",
    fontSize: 19
  },
});