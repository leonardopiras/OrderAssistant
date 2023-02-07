package com.orderassistant; 

import android.util.Log;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Callback;
import java.util.Map;
import java.util.HashMap;
import org.java_websocket.server.WebSocketServer;
import android.net.nsd.NsdServiceInfo;

import com.orderassistant.connection.server.ServerService;
import com.orderassistant.connection.client.ClientService;
import com.orderassistant.utils.Utils;



import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.Context;



public class UsernameModule extends ReactContextBaseJavaModule {
   WebSocketServer wsServer;
   static final String usernamePreferenceFileKey = "UsernameFile";
   static final String usernameKey = "Username";
   

   public UsernameModule(ReactApplicationContext context) {
      super(context);
   }

 

   @ReactMethod
   public void loadUsername(Callback cb) {
      cb.invoke(getUsername(getReactApplicationContext()));
   }

   @ReactMethod
   public void saveUsername(String username) {
      getReactApplicationContext()
            .getSharedPreferences(usernamePreferenceFileKey, Context.MODE_PRIVATE)
            .edit()
            .putString(usernameKey, username)
            .apply();
   }

   public static String getUsername(ReactApplicationContext reactApplicationContext){
      SharedPreferences sp = reactApplicationContext
            .getSharedPreferences(usernamePreferenceFileKey, Context.MODE_PRIVATE);
      return sp.getString(usernameKey, "Not found");
   }



   @Override
   public String getName() {
      return "UsernameModule";
   }

}