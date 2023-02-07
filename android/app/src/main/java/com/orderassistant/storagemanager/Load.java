package com.orderassistant.storagemanager;
import com.orderassistant.models.*;
import com.orderassistant.storagemanager.LoadSave.FileType;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileInputStream;
import java.io.ObjectInputStream;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.InputStreamReader;

import android.content.Context;
import android.util.Log;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.util.List;
import java.util.LinkedList;


import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;





public class Load {

    public static final String TAG = "OA_Load";

    public static WorkService loadPreviousWorkService(){
        WorkService ws = loadWorkService(LoadSave.PREVIOUS_WORKSERVICE_FILE + LoadSave.BIN_EXTENSION);
        if (ws != null) {
            //deletePreviousWorkServiceFie();
        }
        return ws;  
    }

    public static void deletePreviousWorkServiceFie() {
        File file = LoadSave.getFile(FileType.PREVIOUS_WORKSERVICE);
        if (file.exists()) {
            try {
                file.delete();
            } catch (Exception e) {
                Log.e(TAG, "Unable to delete ", e);
            }
        }
    }


    public static WorkService loadWorkService(String filename) {
        File workServicesDir = LoadSave.getDir(LoadSave.DirType.WORKSERVICES);
        File fileInDir = new File(workServicesDir, filename);
        if (fileInDir.exists()) {
            try {
                try (FileInputStream fis = new FileInputStream(fileInDir)) {
                    try (ObjectInputStream ois = new ObjectInputStream(fis)) {
                        return (WorkService) ois.readObject();
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Unable to load file " + filename, e);
            }
        }  
        return null;
    }

    public static String[] loadItemCats() {
        File file = LoadSave.getFile(LoadSave.FileType.ITEM_CAT);
        
        if (file.exists()) {
            try {
                try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                    TypeToken<List<String>> t = new TypeToken<List<String>>() {};
                    List<String> cats = new Gson().fromJson(br, t.getType());
                    return cats.stream().toArray(s -> new String[s]);
                }
            } catch (Exception e) {
                Log.e(TAG, "Unable to load file \"" + file.getName() + "\" " + e.getMessage());
            }
        } else {
            Save.saveItemCatsFile(new LinkedList<String>());
            return new String[0];
        } 
        return null;
    }

    public static ItemTypeConfiguration loadItemTypeConfiguration(String configName) {
        List<String[]> itemTypeListEntries = loadItemTypeList(configName);
        List<String[]> workStationEntries = loadItemTypeWorkStations(configName);
        ConfigPreferences preferences = loadPreferences(configName);
        return new ItemTypeConfiguration(itemTypeListEntries, workStationEntries, configName, preferences);
    }

    public static ConfigPreferences loadPreferences(String configName) {
        File file = LoadSave.getItemTypePreferenceFile(configName);
        if (file != null && file.exists()) {
            try {
                try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                    ConfigPreferences prefs = new Gson().fromJson(br, ConfigPreferences.class);
                    return prefs; 
                }
            } catch (Exception e) {
                Log.e(TAG, "Unable to load file \"" + file.getName() + "\" " + e.getMessage());
            }
        } 
        return new ConfigPreferences(false, true, false, 1);
    }

    protected static List<String[]> loadItemTypeList(String configName) {
        File file = LoadSave.getITEM_TYPE_LIST_FILE(configName);
        return loadCsvEntries(file, true);
    }

    protected static List<String[]> loadItemTypeWorkStations(String configName) {
        File file = LoadSave.getItemTypeWORKSTATION_FILE(configName);
        return loadCsvEntries(file, false);
    }

    protected static List<String[]> loadCsvEntries(File file, boolean excludeHeader) {
        if (file.exists()) {
            try(CSVReader reader = new CSVReaderBuilder(new FileReader(file)).build()) {
                List<String[]> entries = reader.readAll();
                if (excludeHeader)
                    entries.remove(0); // Header remove
                return entries;
            } catch (Exception e) {
            }
        } 
        Log.e(TAG, "Unable to load " + file.getName() + " itemTypeConfiguration");
        return null;
    }

}
