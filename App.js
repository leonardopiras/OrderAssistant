<script src="http://localhost:8097"></script>
import React, { PureComponent, useState, useEffect } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';
import Toast, {BaseToast, ErrorToast, InfoToast, SuccessToast} from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';



import colors from "@styles/Colors"
import styles from '@styles/DefaultStyles';
import Home from '@screens/Home';
import WorkService from '@screens/WorkService';
import WaitRoom from '@screens/WaitRoom';
import ManageConfiguration from '@screens/ManageConfiguration';
import ConfigurationList from '@screens/ConfigurationList';
import EditItemType from '@screens/EditItemType';
import WorkStation from '@screens/WorkStation';
import EditOrder from '@screens/EditOrder';
import Cashier from '@screens/Cashier';
import ProcessedOrders from '@screens/ProcessedOrders';
import OAFullScreen from '@components/OAFullScreen';
import {default as mapping } from "./mapping.json";
import SplashScreen from "react-native-splash-screen"; //import SplashScreen


import Header, {naviRef} from "@components/Header";



const Stack = createNativeStackNavigator();

const toastConfig = {
  success:  (props) => (
   <SuccessToast
     {...props}
     text1Style={styles.text}
   />
 ),
 error: (props) => (
   <ErrorToast
     {...props}
     text1Style={styles.text}
     />
 ),
 info: (props) => (
   <InfoToast
   text1Style={styles.text}
   {...props}
   />
 ) 
};

export default function App() {

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <ApplicationProvider 
    customMapping={mapping}
    {...eva} theme={eva.light}>
      <GestureHandlerRootView 
      style={{ flex: 1 }}>
      <OAFullScreen />
      <Header />
      <NavigationContainer
        ref={naviRef}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false
          }}
        >
          {/* <Stack.Screen
            name="Home"
            component={Home}
          /> */}
          <Stack.Screen
            name="WaitRoom"
            component={WaitRoom}/>
          <Stack.Screen
            name="WorkService"
            component={WorkService}
          />

          <Stack.Screen
            name="WorkStation"
            component={WorkStation}
          />
          <Stack.Screen
            name="EditOrder"
            component={EditOrder}
            />

          <Stack.Screen
            name="ConfigurationList"
            component={ConfigurationList} />
          <Stack.Screen
            name="ManageConfiguration"
            component={ManageConfiguration}
          />
          <Stack.Screen
            name="EditItemType"
            component={EditItemType}
          /> 
          <Stack.Screen
          name="Cashier"
          component={Cashier}
        />
        <Stack.Screen
        name="ProcessedOrders"
        component={ProcessedOrders}
      />

        </Stack.Navigator>

      </NavigationContainer>
      </GestureHandlerRootView>
      <Toast
        config={toastConfig}
      />
    </ApplicationProvider>
  );
}


const myStyles = StyleSheet.create({
  OAIcon: {
    width: 60,
    height: 60,
    resizeMode: "center",
    margin: 10,
  }
});