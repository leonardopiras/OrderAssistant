package com.orderassistant.models;

import android.util.Log;

import java.io.Serializable;
import java.util.HashSet;
import java.util.LinkedList;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.ReadableArray;
import java.util.List;

import com.orderassistant.utils.WritableReadableUtils;


public class Order implements Serializable, Writable {
    public String comment;
    public String table;
    public LinkedList<Item> itemList;
    public String owner; 

    public LocalDateTime birthDate, processDate;
    public boolean isPaid;
    public boolean isProcessed;
    public int id;
    public int seats;
    public Double coverCharge;

    public static final String TAG = "OA_Order";
    public static final int UNSETTED_ID = -1;


    static DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");



    public enum Fields {
        COMMENT(0,"comment"), 
        TABLE(1,"table"),
        ITEM_LIST(2,"itemList"),
        OWNER(3,"owner"),
        BIRTH_DATE(4, "birthDate"),
        PROCESS_DATE(5, "processDate"),
        IS_PAID(6, "isPaid"),
        IS_PROCESSED(7, "isProcessed"),
        SEATS(8, "seats"),
        COVER_CHARGE(9, "coverCharge"),
        ID(10, "id");

        public final String name;
        public final int value;

        Fields(int value, String name) {
            this.name = name;
            this.value = value;
        }
    }

    public Order(ReadableArray itemLst, String comment, String table, String owner,
            boolean isPaid, boolean isProcessed, int seats, Double coverCharge) {
        this(itemLst, comment, table, owner, isPaid, isProcessed, seats, coverCharge, UNSETTED_ID);
    }

    public Order(ReadableArray itemLst, String comment, String table, String owner,
            boolean isPaid, boolean isProcessed, int seats, Double coverCharge, int orderId) {

        this(itemLst, comment, table, owner, isPaid, isProcessed, seats, coverCharge,
                LocalDateTime.now(), null, orderId);
    }

    public Order(ReadableArray itemLst, String comment, String table, String owner,
            boolean isPaid, boolean isProcessed, int seats, Double coverCharge,
            String birthDate, String processDate, int orderId) {
        this(itemLst, comment, table, owner, isPaid, isProcessed, seats, coverCharge, getDate(birthDate),
                getDate(processDate), orderId);
    }

    public Order(ReadableArray itemLst, String comment, String table, String owner,
            boolean isPaid, boolean isProcessed, int seats, Double coverCharge, LocalDateTime birthDate, LocalDateTime processDate, int orderId) {
        this.itemList = new LinkedList<>();
        for (int i = 0; i < itemLst.size(); i++) {
            this.itemList.add(new Item(itemLst.getMap(i)));
        }
        this.comment = comment;
        this.table = table;
        this.owner = owner;
        this.isPaid = isPaid;
        this.id = orderId;
        this.isProcessed = isProcessed;
        this.seats = seats;
        this.coverCharge = coverCharge;
        this.birthDate = birthDate;
        this.processDate = processDate;
    }

    @Override
    public WritableMap toWritableMap() {
        WritableMap map = new WritableNativeMap();
        map.putString(Fields.COMMENT.name, comment);
        map.putString(Fields.TABLE.name, table);
        map.putArray(Fields.ITEM_LIST.name, itemListToWritableArray());
        map.putString(Fields.OWNER.name, owner);
        map.putString(Fields.BIRTH_DATE.name, formatDate(birthDate));
        map.putString(Fields.PROCESS_DATE.name, formatDate(processDate));
        map.putInt(Fields.SEATS.name, seats);
        map.putDouble(Fields.COVER_CHARGE.name, coverCharge);
        map.putBoolean(Fields.IS_PAID.name, isPaid);
        map.putBoolean(Fields.IS_PROCESSED.name, isProcessed);
        map.putInt(Fields.ID.name, id);
        return map;
    }

    public WritableArray itemListToWritableArray() {
        return WritableReadableUtils.writableListToWritableArray(itemList);
    }

    public void setId(int id) {
        this.id = id;
    }

    public void setIsProcessed(boolean isProcessed) {
        this.isProcessed = isProcessed;
        if (isProcessed && processDate == null)
            processDate = LocalDateTime.now();        
    }

    public void setIsPaid(boolean isPaid) {
        this.isPaid = isPaid;
    }

    public List<String> getOrderCats() {
        HashSet<String> set = new HashSet<>();
        for (Item item : itemList) {
            set.addAll(item.itemType.itemCats);
        }
        return new LinkedList<String>(set);
    }

    public boolean containsCats(List<String> cats) {
        for (Item item : itemList) {
            if (item.containsCats(cats))
                return true;
        }
        return false;
    }
    
    public boolean containsCatsExcludeCompleted(List<String> cats) {
        for (Item item : itemList) {
            if (item.containsCatsAndNotCompleted(cats))
                return true;
        }
        return false;
    }

    public void setItemCompleted(int itemId, boolean completed) {
        Item item = itemList.stream().filter(it -> it.id == itemId).findFirst().orElse(null);
        if (item != null)
            item.completed = completed; 
        else 
            Log.e(TAG, "item with id " + itemId + " not found");
    }

    public void addItems(List<Item> newItems) {
        int indx = itemList.size();
        for(Item item : newItems)
            item.setId(indx++);
        itemList.addAll(newItems);
    }

    public boolean isPaid() {
        return isPaid; 
    }

    public boolean isProcessed() {
        return isProcessed;
    }

    public boolean isUnprocessed() {
        return !isProcessed();
    }

    public boolean isUnpaidProcessed() {
        return !isPaid() && isProcessed(); 
    }

    @Override
    public String toString() {
        return "{" +
            " comment='" + comment + "'" +
            ", table='" + table + "'" +
            ", owner='" + owner + "'" +
            ", birthDate='" + birthDate + "'" +
            ", isPaid='" + isPaid() + "'" +
            ", isProcessed='" + isProcessed() + "'" +
            ", id='" + id + "'" +
            "}";
    }

    public void adjustPrices(ItemTypeConfiguration config) {
        itemList.stream().forEach(item -> item.adjustPrices(config));
        this.coverCharge = config.preferences.coverCharge;
    }

    @Override
    public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof Order)) {
            return false;
        }
        Order order = (Order) o;
        return id == order.id && birthDate.equals(order.birthDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(birthDate, id);
    }

    protected static String formatDate(LocalDateTime date) {
        try {
            return date.format(dateFormatter);
        } catch (Exception e) {}
        return "";
    } 
    protected static LocalDateTime getDate(String date) {
        try {
            return LocalDateTime.parse(date, dateFormatter);
        } catch (Exception e) {}
        return null;
    }

}
