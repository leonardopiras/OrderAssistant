package com.orderassistant.utils;

import com.orderassistant.models.*;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.ObjectOutputStream;

import android.content.Context;
import android.util.Log;
import org.apache.commons.io.FilenameUtils;
import com.google.gson.Gson;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;

import com.opencsv.CSVWriter;
import com.opencsv.CSVWriterBuilder;
import com.opencsv.ICSVWriter;
import java.io.FileWriter;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeMap;



public class WritableReadableUtils {

    public static WritableArray writablefromStringArr(String[] stringArr) {
        WritableArray arr = new WritableNativeArray();
        Arrays.stream(stringArr).forEach((el) -> arr.pushString(el));
        return arr;
    }

    public static String[] stringArrFromReadbleArray(ReadableArray readableArr) {
        return readableArr.toArrayList().toArray(new String[0]);
    } 
    
    public static ArrayList<Integer> intListFromReadbleArray(ReadableArray readableArr) {
        ArrayList<Integer> list = new ArrayList();
        for(int i = 0; i < readableArr.size(); i++) {
            list.add(readableArr.getInt(i));
        }
        return list;
    }

    public static <T extends Writable> WritableArray writableListToWritableArray(List<T> list){
        WritableArray arr = new WritableNativeArray();
        for (T el : list) {
            arr.pushMap(el.toWritableMap());
        }
        return arr;
    }

    public static <T> WritableMap hashMapToWritable(HashMap<String, T> hmap) {
        WritableMap map = new WritableNativeMap();
        hmap.forEach((k, v) -> {
           if (v instanceof Integer) {
                map.putInt(k, (Integer) v);
           } 
        });
        return map; 
    }


    
}
