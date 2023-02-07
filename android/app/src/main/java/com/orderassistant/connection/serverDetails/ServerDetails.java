package com.orderassistant.connection.serverDetails;

import java.io.Serializable;
import java.util.Arrays;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableArray;

import com.orderassistant.utils.WritableReadableUtils;
import com.orderassistant.connection.server.ServerService;
import com.orderassistant.models.*;


public class ServerDetails implements Serializable, Writable {

    public String[] clients;
    public String owner; 
    public ItemTypeConfiguration config;
    public String roomName;

    public static enum Fields {
        CLIENTS(0, "clients"),
        OWNER(1, "owner"),
        CONFIG(2, "configuration"),
        ROOM_NAME(3, "roomName");
       
        public final int value;
        public final String name;

        Fields(int value, String name) {
            this.value = value;
            this.name = name;
        }
    }

    public ServerDetails(String[] clients, String ownername, ItemTypeConfiguration config, String roomName) {
        this.clients = clients;
        this.owner = ownername;
        this.config = config;
        this.roomName = roomName;
    }

    @Override
    public String toString(){
        String clients = "No clients";
        if (clients != null && clients.length() > 0)
            Arrays.asList(clients).stream().reduce("", (tot, client) -> tot = tot + client + "-");
        return  "Owner " + owner + ". clients " + clients + ". roomName " + roomName;
    }

    public boolean isUsernamePresent(String username) {
        String result = null;
        if (clients != null)
            result = Arrays.stream(clients)
            .filter(c -> c.equals(username))
            .findFirst()
            .orElse(null);
        
        return (result != null) ? true : username.equals(owner);
    }



    @Override
    public WritableMap toWritableMap() {
        WritableMap map = new WritableNativeMap();
        WritableArray arr =  WritableReadableUtils.writablefromStringArr(clients);
        map.putArray(Fields.CLIENTS.name, arr);
        map.putString(Fields.OWNER.name, owner);
        map.putMap(Fields.CONFIG.name, config.toWritableMap()); 
        map.putString(Fields.ROOM_NAME.name, roomName);
        return map;
    }
    
}
