package com.orderassistant.models;

import java.io.Serializable;
import java.util.List;
import java.util.Objects;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import com.orderassistant.utils.WritableReadableUtils;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableMap;

import com.orderassistant.utils.WritableReadableUtils;

public class ItemTypeConfiguration implements Serializable, Writable {
    
   
    public String name;
    public ArrayList<ItemType> itemTypeList;
    public HashMap<String, String[]> workStations;  
    public ConfigPreferences preferences; 

    public static ItemTypeConfiguration currentConfig;



    public static enum Fields {
        NAME(0,"name"), 
        ITEM_TYPE_LIST(1,"itemTypeList"),
        WORKSTATIONS(2,"workStations"),
        PREFERENCES(3, "preferences");
        

        public final String name;
        public final int value;
        Fields(int value, String name) {
            this.name = name;
            this.value = value;
        }
    }



    public ItemTypeConfiguration(ReadableArray itemTypeList, 
    String configurationName, ReadableMap workStationsMap, ReadableMap preferencesMap) {
        super();
        this.itemTypeList = new ArrayList<>();
        for(int i = 0; i<itemTypeList.size(); i++) {
            this.itemTypeList.add(new ItemType(itemTypeList.getMap(i)));
        }
        this.name = configurationName;

        this.workStations = new HashMap<>();
        String[] workStationsKeys = workStationsMap.toHashMap().keySet().toArray(new String[0]);
        for(String key : workStationsKeys) {
            ReadableArray arr = workStationsMap.getArray(key);
            String[] affectedCats = WritableReadableUtils.stringArrFromReadbleArray(arr);
            this.workStations.put(key, affectedCats);
        }
        this.preferences = new ConfigPreferences(preferencesMap);
    }

    public ItemTypeConfiguration(List<String[]> itemTypeListEntries,
    List<String[]> workstationEntries, String name, ConfigPreferences preferences) {
        this.itemTypeList = itemTypeListFromCsvEntries(itemTypeListEntries);
        this.workStations = workStationsFromCsvEntries(workstationEntries);
        this.name = name;
        this.preferences = preferences;
        setCurrentConfig(this);
    }

    private ArrayList<ItemType> itemTypeListFromCsvEntries(List<String[]> itemTypeListEntries) {
        ArrayList<ItemType> list = new ArrayList<>();
        for (String[] entry : itemTypeListEntries) {
            ItemType itemType = new ItemType(entry);
            list.add(itemType);
        }
        return list;
    }

    private HashMap<String, String[]> workStationsFromCsvEntries(List<String[]> workstationEntries) {
        HashMap<String, String[]> workStationsMap = new HashMap<>();
        for (String[] entry : workstationEntries) {
            if (entry.length > 0) {
                String[] appliedCats = new String[entry.length-1];
                for (int i = 1; i < entry.length; i++) {
                    appliedCats[i-1] = entry[i];
                }
                workStationsMap.put(entry[0], appliedCats);
            }
        }
        return workStationsMap;
    }

    public ArrayList<String[]> workStationsToListOfEntries() {
        ArrayList<String[]> entries = new ArrayList<>();
        workStations.forEach((workStationName, cats) -> {
            ArrayList<String> entry = new ArrayList<>();
            entry.add(workStationName);
            entry.addAll(Arrays.asList(cats)); 
            entries.add(entry.toArray(new String[0]));
        });
        return entries;
    }

    @Override
    public WritableMap toWritableMap() {
        WritableMap map = new WritableNativeMap();
        map.putString(Fields.NAME.name,  name);
        map.putArray(Fields.ITEM_TYPE_LIST.name, WritableReadableUtils.writableListToWritableArray(itemTypeList));
        map.putMap(Fields.WORKSTATIONS.name, workStationsToWritableMap());
        map.putMap(Fields.PREFERENCES.name, preferences.toWritableMap());
        return map;
    }

    public WritableMap workStationsToWritableMap() {
        WritableMap map = new WritableNativeMap();
        workStations.forEach((workStationName, cats) -> {
            map.putArray(workStationName, WritableReadableUtils.writablefromStringArr(cats));
        });
        return map;
    }

    public static ItemTypeConfiguration getCurrentConfig() {
        return currentConfig;
    }

    public static ItemTypeConfiguration setCurrentConfig(ItemTypeConfiguration curr) {
        currentConfig = curr;
        return currentConfig;
    }
}
