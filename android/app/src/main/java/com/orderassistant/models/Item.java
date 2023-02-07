package com.orderassistant.models;

import java.io.Serializable;

import com.orderassistant.utils.WritableReadableUtils;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableMap;
import android.util.Log;
import java.util.List;


public class Item implements Serializable, Writable {
    
    public int quantity;
    public ItemType itemType;
    public String comment;
    public int id;
    public boolean completed;

    public static final String TAG = "Item";


    protected static enum Fields {
        QUANTITY(0, "quantity"),
        ITEM_TYPE(1, "itemType"),
        COMMENT(2, "comment"),
        ID(3, "id"),
        COMPLETED(4, "completed");

        public final int value;
        public final String name;

        Fields(int value, String name) {
            this.value = value;
            this.name = name;
        }
    }


    public Item(Integer quantity, ItemType itemType, String comment, int id, boolean completed) {
        this.quantity = quantity;
        this.itemType = itemType;
        this.comment = comment;
        this.id = id;
        this.completed = completed;
    }

    public Item(ReadableMap map) {
        quantity = map.getInt(Fields.QUANTITY.name);
        itemType = new ItemType(map.getMap(Fields.ITEM_TYPE.name));
        comment = map.getString(Fields.COMMENT.name);
        id = map.getInt(Fields.ID.name);
        completed = map.getBoolean(Fields.COMPLETED.name);
    } 

    @Override
    public WritableMap toWritableMap() {
        WritableMap map = new WritableNativeMap();
        map.putInt(Fields.QUANTITY.name, quantity);
        map.putMap(Fields.ITEM_TYPE.name, itemType.toWritableMap()); 
        map.putString(Fields.COMMENT.name, comment);
        map.putInt(Fields.ID.name, id);
        map.putBoolean(Fields.COMPLETED.name, completed);
        return map;
    }


    public boolean containsCats(List<String> cats) {
        return itemType.itemCats.stream().anyMatch(cat -> cats.contains(cat));
    }

    public boolean containsCatsAndNotCompleted(List<String> cats) {
        return !completed && containsCats(cats);
    }

    public void setId(int id) {
        this.id = id;
    }

    public void adjustPrices(ItemTypeConfiguration config) {
        int myId = itemType.id; 
        ItemType newItmType = config.itemTypeList.stream().filter(itmType -> itmType.id == myId).findFirst().orElse(null);
        if (newItmType != null)
            this.itemType = newItmType;
        else 
            Log.e(TAG, "Cannot find item with id " + myId +" in newConfiguration");
    }


    @Override
    public String toString() {
        return itemType.toString() + " " + quantity;
    }

   
    @Override
    public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof Item)) {
            return false;
        }
        Item item = (Item) o;
        return quantity == item.quantity 
         && comment.equals(item.comment) 
         && itemType.equals(item.itemType)
         && id == item.id;
    }    
}

  
