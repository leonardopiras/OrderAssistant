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

public class ConfigPreferences implements Serializable, Writable {

    public boolean payOnStart;
    public boolean hasTables; 
    public boolean processOnStart;
    public double coverCharge;


    public static enum Fields {
        PAY_ON_START(0,"payOnStart"), 
        HAS_TABLES(1,"hasTables"),
        PROCESS_ON_START(2, "processOnStart"),
        COVER_CHARGHE(3, "coverCharge");

        public final String name;
        public final int value;
        Fields(int value, String name) {
            this.name = name;
            this.value = value;
        }
    }

    public ConfigPreferences(ReadableMap map) {
        this.payOnStart = map.getBoolean(Fields.PAY_ON_START.name);
        this.hasTables = map.getBoolean(Fields.HAS_TABLES.name);
        this.processOnStart = map.getBoolean(Fields.PROCESS_ON_START.name);
        this.coverCharge = map.getDouble(Fields.COVER_CHARGHE.name);
    }


    public ConfigPreferences(boolean payOnStart, boolean hasTables, boolean processOnStart, double coverCharge) {
        this.payOnStart = payOnStart;
        this.hasTables = hasTables;
        this.processOnStart = processOnStart;
        this.coverCharge = coverCharge;
    }



    @Override
    public WritableMap toWritableMap() {
        WritableMap map = new WritableNativeMap();
        map.putBoolean(Fields.PAY_ON_START.name, payOnStart);
        map.putBoolean(Fields.HAS_TABLES.name, hasTables);
        map.putBoolean(Fields.PROCESS_ON_START.name, processOnStart);
        map.putDouble(Fields.COVER_CHARGHE.name, coverCharge);
        return map;
    }

   
}
