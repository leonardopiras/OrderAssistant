package com.orderassistant;

import android.util.Log;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.ReadableArray;
import android.content.Context;
import com.orderassistant.storagemanager.*;
import com.orderassistant.utils.*;

import com.orderassistant.models.*;

import java.util.List;
import java.util.stream.Collector;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedList;

public class ManageConfigurationsModule extends ReactContextBaseJavaModule {

    public static String TAG = "OA";// "WSServerModule";
    protected Context context;
    protected Save save;
    protected Load load;

    public ManageConfigurationsModule(ReactApplicationContext context) {
        super(context);
        this.context = context;
    }

    @ReactMethod
    public void getItemTypeConfigurations(Callback cb) {
        String[] confArr = LoadSave.getItemTypeConfigurations();
        
        cb.invoke(WritableReadableUtils.writablefromStringArr(confArr));
    }

    @ReactMethod
    public void loadItemCats(Callback cb) {
        String[] itemCats =(String[]) Load.loadItemCats();
        if (itemCats != null)
            cb.invoke(WritableReadableUtils.writablefromStringArr(itemCats));
        else 
            cb.invoke("error");
    }


    @ReactMethod
    public void loadItemTypeConfiguration(String configName, Callback cb) {
        ItemTypeConfiguration config = Load.loadItemTypeConfiguration(configName);
        cb.invoke(config.toWritableMap());
    }


    @ReactMethod
    public void changeConfigurationName(String oldName, String newName, Callback cb) {
        Boolean allGood = LoadSave.changeConfigurationName(oldName, newName);
        cb.invoke(allGood);
    }

    @ReactMethod
    public void saveItemTypeConfiguration(String configurationName,
     ReadableArray itemTypeList, ReadableMap workstations, ReadableMap preferences, Callback cb) {
       ItemTypeConfiguration conf = new ItemTypeConfiguration(itemTypeList, configurationName, workstations, preferences);
       Boolean res = Save.saveItemTypeConfiguration(conf);
       cb.invoke(res);
    }

    

    @Override
    public String getName() {
        return "ManageConfigurationsModule";
    }

}
