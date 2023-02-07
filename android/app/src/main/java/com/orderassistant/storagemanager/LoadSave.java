package com.orderassistant.storagemanager;
import com.orderassistant.models.*;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileInputStream;
import java.io.ObjectInputStream;
import java.util.Arrays;
import org.apache.commons.io.FilenameUtils;


import android.content.Context;
import android.util.Log;

public class LoadSave {
    
    protected static Context context;
    public static final String TAG = "OA_LoadSave";
    public static final String CSV_EXTENSION = ".csv";
    public static final String WORKSTATION_FILE = "Workstations";
    public static final String ITEM_TYPE_LIST_FILE = "Items";
    public static final String CONFIGURATION_PREFERENCES_FILE = "Preferences";
    public static final String JSON_EXTENSION = ".json";
    public static final String PREVIOUS_WORKSERVICE_FILE = "PrevWorkService";
    public static final String BIN_EXTENSION =  ".bin";


    public static void initLoadSave(Context context) {
        LoadSave.context = context;
    }

    public static boolean isPreviousWorkservicePresent() {
        File dir = getDir(DirType.WORKSERVICES);
        File fileInDir = new File(dir, PREVIOUS_WORKSERVICE_FILE + BIN_EXTENSION);
        return fileInDir.exists();
    }

    public static String[] getItemTypeConfigurations() {
        File dir = getDir(DirType.CONFIGURATIONS);
        if (dir.exists() && dir.isDirectory()) 
            return Arrays.stream(dir.list())
                    .map(n -> FilenameUtils.getBaseName(n))
                    .toArray(size -> new String[size]);
        return new String[0];
    }

    public static boolean configurationExist(String configName) {
        String[] configs = getItemTypeConfigurations();
        return (configs != null) ? Arrays.stream(configs).anyMatch(el -> configName.equals(el)) : false;
    }

    public static boolean changeConfigurationName(String oldName, String newName) {
        if (newName.isEmpty())
            return false;
        if (oldName.equals(newName) || oldName.isEmpty())
            return true; // all good on equals name

        File oldDir = getOrCreateDir(getDir(DirType.CONFIGURATIONS), oldName); 
        File newDir = getOrCreateDir(getDir(DirType.CONFIGURATIONS), newName);
        if (!oldDir.exists())
            return true; // it will be created later on configuration save
        if (newDir.exists())
            return false; 
            
        return oldDir.renameTo(newDir);
    }

    public static File getITEM_TYPE_LIST_FILE(String configName) {
        File dir = getOrCreateDir(getDir(DirType.CONFIGURATIONS), configName); 
        return new File(dir, ITEM_TYPE_LIST_FILE + CSV_EXTENSION);
    } 

    public static File getItemTypeWORKSTATION_FILE(String configName) {
        File dir = getOrCreateDir(getDir(DirType.CONFIGURATIONS), configName); 
        return new File(dir, WORKSTATION_FILE + CSV_EXTENSION);
    }  
    
    public static File getItemTypePreferenceFile(String configName) {
        File dir = getOrCreateDir(getDir(DirType.CONFIGURATIONS), configName); 
        return new File(dir, CONFIGURATION_PREFERENCES_FILE + JSON_EXTENSION);
    }

    public static File getBaseDir() {
        return context.getDir("OA", Context.MODE_PRIVATE);
    }

    public static File getOrCreateDir(File parent, String dirName) {
        File dir = new File(parent, dirName);
        if (!dir.exists())
            if (!dir.mkdirs())
                Log.e(TAG, "Unable to create dir \"" + dirName + "\"");
        return dir;
    } 
    

    public static File getDir(DirType type) {
        switch (type) {
            case BASE_DIR: 
                return getBaseDir();
            case WORKSERVICES:
                return getOrCreateDir(getBaseDir(), "Workservices");
            case CONFIGURATIONS: 
                return getOrCreateDir(getBaseDir(), "Configurations");   
            
        }
        return null;
    }

    public static File getFile(FileType type) {
        switch (type) {
            case ITEM_CAT: 
                return new File(getBaseDir(), "Categories.json");
            case PREVIOUS_WORKSERVICE:
                return new File(getDir(DirType.WORKSERVICES), PREVIOUS_WORKSERVICE_FILE + BIN_EXTENSION);
            
        }
        return null;
    }

    public enum DirType { BASE_DIR, WORKSERVICES, CONFIGURATIONS };
    public enum FileType { ITEM_CAT, PREVIOUS_WORKSERVICE }
}


