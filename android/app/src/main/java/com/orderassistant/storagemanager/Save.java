package com.orderassistant.storagemanager;
import com.orderassistant.models.*;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.ObjectOutputStream;

import android.content.Context;
import android.util.Log;
import org.apache.commons.io.FilenameUtils;
import com.google.gson.Gson;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import com.opencsv.CSVWriter;
import com.opencsv.CSVWriterBuilder;
import com.opencsv.ICSVWriter;
import java.io.FileWriter;



public class Save {

    public static final String TAG = "OA_Save";
    
    /*****************************************
     * WorkService
     *****************************************/

    public static Boolean saveWorkService(WorkService workService) {
        if (workService == null)
            return false;
        File workServicesDir = LoadSave.getDir(LoadSave.DirType.WORKSERVICES);
        File workServiceFile = null;
        if (workService.isCompleted()) {
            String workServiceName = workService.closeWorkservice();
            workServiceFile = createFile(workServicesDir, workServiceName + LoadSave.BIN_EXTENSION);
        } else {
            workServiceFile = new File(workServicesDir, LoadSave.PREVIOUS_WORKSERVICE_FILE + LoadSave.BIN_EXTENSION);
        }
        
        return saveObject(workService, workServiceFile);
    }

  


    /*****************************************
     * ItemTypeConfiguration
     *****************************************/

    public static Boolean saveItemTypeConfiguration(ItemTypeConfiguration configuration) {
        Boolean catsGood = saveItemTypeCats(configuration.itemTypeList);
        Boolean listGood = saveItemTypeConfigFile(configuration);
        Boolean workStationGood = saveWorkstations(configuration);
        Boolean preferencesGood = savePreferences(configuration);

        return (listGood && catsGood && workStationGood && preferencesGood);
    }

    private static boolean savePreferences(ItemTypeConfiguration configuration) {
        File file = LoadSave.getItemTypePreferenceFile(configuration.name);
        String json = new Gson().toJson(configuration.preferences);
        return saveJson(json, file, false);
    }

    private static Boolean saveItemTypeConfigFile(ItemTypeConfiguration configuration) {
        File file = LoadSave.getITEM_TYPE_LIST_FILE(configuration.name);
        try {
            try (CSVWriter writer = (CSVWriter) new CSVWriterBuilder(
                    new FileWriter(file, false))
                    .build()) {
                writer.writeNext(ItemType.getFields());
                configuration.itemTypeList.stream().forEach((ItemType el) -> 
                                        writer.writeNext(el.toStringArray()));
                return true;
        }
        } catch (Exception e) {
            Log.e(TAG, "Unable to save "+ file.getName() + " ." + e.getMessage());
        } 
        return false;
    }

    private static Boolean saveWorkstations(ItemTypeConfiguration configuration) {
        File file = LoadSave.getItemTypeWORKSTATION_FILE(configuration.name);
        try {
            try (CSVWriter writer = (CSVWriter) new CSVWriterBuilder(
                    new FileWriter(file, false))
                    .build()) {
                    configuration.workStationsToListOfEntries()
                                .forEach(entry -> writer.writeNext(entry));   
                return true;
        }
        } catch (Exception e) {
            Log.e(TAG, "Unable to save "+ file.getName() + " ." + e.getMessage());
        } 
        return false;
    }

    private static Boolean saveItemTypeCats(List<ItemType> itemTypes) {
        List<String> prevCats = new ArrayList(Arrays.asList(Load.loadItemCats()));
        for (ItemType item : itemTypes) {
            for(String newCat : item.itemCats) {
                if (!prevCats.contains(newCat))
                    prevCats.add(newCat);
            }
        }
        return saveItemCatsFile(prevCats);
    }

    protected static Boolean saveItemCatsFile(List<String> cats) {
        String json = new Gson().toJson(cats);
        File catsFile = LoadSave.getFile(LoadSave.FileType.ITEM_CAT);
        return saveJson(json, catsFile, false);
    }



    /*****************************************
     * Utils
     *****************************************/
    private static Boolean saveJson(String json, File file, Boolean append) {
        try {
            try (FileOutputStream fos = new FileOutputStream(file, append)) {
                fos.write(json.getBytes());
            }
        } catch (Exception e) {
            Log.e(TAG, "Unable to save "+ file.getName() + " ." + e.getMessage());
            return false;
        }
        return true;
    }

    private static Boolean saveObject(Object obj, File fileInDir) {
        try {
            try (FileOutputStream fos = new FileOutputStream(fileInDir)) {
                try (ObjectOutputStream oos = new ObjectOutputStream(fos)) {
                    oos.writeObject(obj);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Unable to save file \"" + fileInDir.toString() +"\" ", e);
            return false;
        }
        return true;
    }

    private static File createFile(File parentDir, String filename) {
        String base = FilenameUtils.getBaseName(filename);
        String ext = "." + FilenameUtils.getExtension(filename);
        File fileInDir = new File(parentDir, base + ext);
        Integer count = 1;
        while (fileInDir.exists() && count < 100) {
            fileInDir = new File(parentDir, base + "_" + count + ext);
            count++;
        }
        if (count > 100)
            Log.e(TAG, "Unable to create a new file " + filename + ". Found too many files with the same name");
        return fileInDir;
    } 
}
