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


public class ItemType implements Serializable, Writable {
    
    public String name;
    public String shortName;
    public String description;
    public double price; 
    public int id;
    public List<String> itemCats;

    public boolean available;
    public String comment;

    public static enum Fields {
        NAME(0, "name"),
        SHORTNAME(1, "shortName"),
        DESCRIPTION(2, "description"),
        PRICE(3, "price"),
        ID(4, "id"),
        WORKSERVICE(5, "comment"),
        ITEMCATS(6, "itemCats"),
        AVAILABLE(7, "available"),
        COMMENT(8, "comment");

        public final int value;
        public final String name;

        Fields(int value, String name) {
            this.value = value;
            this.name = name;
        }
    }

    public ItemType(String name, String shortName, String description, 
    double price, List<String> itemCats, Integer id) {
        this.name = name;
        this.shortName = shortName;
        this.description = description;
        this.price = price;
        this.id = id;
        this.itemCats = itemCats;
    }

    
    public ItemType(String name, String shortName, String description, 
    double price, String[] itemCats, Integer id) {
        this(name, shortName, description, price, Arrays.asList(itemCats), id);
    }

    public ItemType(String[] csvEntry) {
        name = csvEntry[Fields.NAME.value];
        shortName = csvEntry[Fields.SHORTNAME.value];
        description = csvEntry[Fields.DESCRIPTION.value];
        price = Double.parseDouble(csvEntry[Fields.PRICE.value]);
        id = Integer.parseInt(csvEntry[Fields.ID.value]);

        int itemCatsIndx = Fields.ITEMCATS.value;
        itemCats = new ArrayList<>();
        while (itemCatsIndx < csvEntry.length) {
            if (!csvEntry[itemCatsIndx].isEmpty())
                itemCats.add(csvEntry[itemCatsIndx]);
            itemCatsIndx++;
        }

        available = true; 
        comment = "";
    }

    public ItemType(ReadableMap map) {
        name = map.getString(Fields.NAME.name);
        shortName = map.getString(Fields.SHORTNAME.name); 
        description = map.getString(Fields.DESCRIPTION.name);
        price = map.getDouble(Fields.PRICE.name);
        id = map.getInt(Fields.ID.name);

        List<Object> catsObject = map.getArray(Fields.ITEMCATS.name).toArrayList();
        itemCats =   Arrays.asList(catsObject.toArray(new String[catsObject.size()]));

        available = map.hasKey(Fields.AVAILABLE.name) ? map.getBoolean(Fields.AVAILABLE.name) : true;
        comment = map.hasKey(Fields.COMMENT.name) ? map.getString(Fields.COMMENT.name) : "";
    }


    public String[] toStringArray() {
        String[] arr = new String[Fields.values().length + itemCats.size() - 1];
        arr[Fields.NAME.value] = name;
        arr[Fields.SHORTNAME.value] = shortName;
        arr[Fields.DESCRIPTION.value] = description;
        arr[Fields.PRICE.value] = String.valueOf(price);
        arr[Fields.ID.value] = String.valueOf(id);

        if (!itemCats.isEmpty()){
            int counter = Fields.ITEMCATS.value;
            for(String itemCategory : itemCats) {
                arr[counter] = itemCategory;
                counter++;       
            }
        }
        
        return arr;
    }
    
    @Override
    public WritableMap toWritableMap() {
        WritableMap map = new WritableNativeMap();
        map.putString(Fields.NAME.name, name);
        map.putString(Fields.SHORTNAME.name, shortName); 
        map.putString(Fields.DESCRIPTION.name, description);
        map.putDouble(Fields.PRICE.name, price);
        map.putInt(Fields.ID.name, id);
        WritableArray arr =  WritableReadableUtils.writablefromStringArr(itemCats.toArray(new String[0]));
        map.putArray(Fields.ITEMCATS.name, arr);
        map.putBoolean(Fields.AVAILABLE.name, available);
        map.putString(Fields.COMMENT.name, comment);
        return map;
    }

    @Override
    public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof ItemType)) {
            return false;
        }
        ItemType itemType = (ItemType) o;
        return name.equals(itemType.name) && id == itemType.id
        && price == itemType.price;
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, price, itemCats);
    }
    

    public static String[] getFields() {
        return Arrays.stream(Fields.values())
        .map(f -> f.name).toArray(size -> new String[size]);
    }
}
