package com.orderassistant.models;

import java.io.Serializable;
import java.util.List;
import java.util.Objects;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedList;
import com.orderassistant.utils.WritableReadableUtils;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableMap;

public class OrderLists implements Serializable, Writable {

   
    public static final String TAG = "OA_OrderLists";

    public LinkedList<Order> unprocessed;
    public LinkedList<Order> unpaidProcessed;
    public LinkedList<Order> processed;

    public static enum Fields {
        UNPROCESSED(0, "unprocessed"),
        UNPAID_PROCESSED(1, "unpaidProcessed"),
        PROCESSED(2,"processed");
    
        public final String name;
        public final int value;
        Fields(int value, String name) {
            this.name = name;
            this.value = value;
        }

    }

    public OrderLists(LinkedList<Order> unprocessed, 
        LinkedList<Order> unpaidProcessed, LinkedList<Order> processed) {
           this.unprocessed = unprocessed;
           this.unpaidProcessed = unpaidProcessed;
           this.processed = processed;
       }

       @Override
       public WritableMap toWritableMap() {
           WritableMap map = new WritableNativeMap();
           map.putArray(Fields.UNPROCESSED.name, WritableReadableUtils.writableListToWritableArray(unprocessed));
           map.putArray(Fields.PROCESSED.name, WritableReadableUtils.writableListToWritableArray(processed));
           map.putArray(Fields.UNPAID_PROCESSED.name, WritableReadableUtils.writableListToWritableArray(unpaidProcessed));   
           return map;
       }

    
     
}
