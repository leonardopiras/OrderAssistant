package com.orderassistant.models;

import android.util.Log;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Collection;
import java.util.stream.Stream;
import java.util.logging.LogManager;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import com.orderassistant.utils.WritableReadableUtils;



public class WorkService implements Serializable, Writable {
    
    public LocalDateTime birthDate, closeDate;

    public LinkedList<Order> unprocessed;
    public LinkedList<Order> unpaidProcessed;
    public LinkedList<Order> processed;

    public ItemTypeConfiguration configuration; 

    protected int orderCounter = 0;

    protected final String TAG = "OA_WorkService";

    static DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    


    public static enum Fields {
        BIRTH_DATE(0, "birthDate"),
        CLOSE_DATE(1, "closeDate"),
        UNPROCESSED(2, "unprocessed"),
        UNPAID_PROCESSED(3, "unpaidProcessed"),
        PROCESSED(4,"processed"),
        CONFIGURATION(5, "configuration");

        public final String name;
        public final int value;
        Fields(int value, String name) {
            this.name = name;
            this.value = value;
        }
    }


    public WorkService(LocalDateTime birthDate, LinkedList<Order> unprocessed,
     LinkedList<Order> processed, LinkedList<Order> unpaidProcessed, ItemTypeConfiguration configuration) {
        this.birthDate = birthDate;
        this.unprocessed = unprocessed;
        this.unpaidProcessed = unpaidProcessed;
        this.processed = processed;
        this.configuration = configuration;
    }


    public WorkService(ItemTypeConfiguration configuration) {
        this(LocalDateTime.now(), new LinkedList<>(), new LinkedList<>(), new LinkedList<>(), configuration);
    }


    @Override
    public WritableMap toWritableMap() {
        WritableMap map = new WritableNativeMap();
        map.putString(Fields.BIRTH_DATE.name, formatDate(birthDate));
        map.putString(Fields.CLOSE_DATE.name, formatDate(closeDate));
        map.putArray(Fields.UNPROCESSED.name, WritableReadableUtils.writableListToWritableArray(unprocessed));
        map.putArray(Fields.PROCESSED.name, WritableReadableUtils.writableListToWritableArray(processed));
        map.putArray(Fields.UNPAID_PROCESSED.name, WritableReadableUtils.writableListToWritableArray(unpaidProcessed));
        map.putMap(Fields.CONFIGURATION.name, configuration.toWritableMap());
        return map;
    }


	/*****************************************
	 * Add Order
	 *****************************************/

    public synchronized boolean addOrder(Order order) {
        return _addOrder(order);
    }

    protected boolean _addOrder(Order order) {
        if (order.id < 0)
            order.setId(orderCounter++);

        Log.d(TAG, "Adding new order " + order.toString());
        if (order.isUnprocessed()) {
            return addOrderToUnprocessed(order);
        } else if (order.isUnpaidProcessed()) {
            return addOrderToUnpaidProcessed(order);
        } else if (order.isProcessed()) {
            return addOrderToProcessed(order);
        }
        Log.e(TAG, "Adding order to unprocessed, cannot determine the state of order " + order.toString());
        return addOrderToUnprocessed(order); // Default adds in unprocessed
    }

    protected boolean safeAddOrderToList(Order order, LinkedList<Order> list) {
        Order ord = list.stream().filter(o -> o.id == order.id).findFirst().orElse(null);
        if (ord != null) {
            Log.e(TAG, "Trying to add order with existing id. New: " + order.toString() +
                        "Existing: " + ord.toString());
            return false;
        } else {
            return list.add(order);
        }
    } 

    protected boolean addOrderToUnprocessed(Order order) {
        order.setIsProcessed(false);
        boolean good = safeAddOrderToList(order, unprocessed);
        Log.d(TAG, "Added order " + order.id + " to unprocessed. Result: " + good);
        return good;
    }
    
    protected boolean addOrderToUnpaidProcessed(Order order) {
        order.setIsProcessed(true);
        order.setIsPaid(false);
        boolean good = safeAddOrderToList(order, unpaidProcessed);
        Log.d(TAG, "Added order " + order.id + " to unpaidProcessed. Result: " + good);
        return good;
    }
  
    protected boolean addOrderToProcessed(Order order) {
        order.setIsProcessed(true);
        order.setIsPaid(true);
        boolean good = safeAddOrderToList(order, processed);
        Log.d(TAG, "Added order " + order.id + " to processed. Result: " + good);
        return good;
    } 


	/*****************************************
	 * Get Order
	 *****************************************/

    public HashMap<String,Integer> getRemainingOrdersGroupByWorkStation() {
        HashMap<String,Integer> hmap = new HashMap<>();
        configuration.workStations.forEach((k,v) -> {
           hmap.put(k, getWorkStationOrders(k, true).size()); 
        });
        return hmap;
    }

    public List<Order> getWorkStationOrders(String workStationName, boolean excludeCompleted) {
        List<Order> orders = new LinkedList<>();
        
        if (workStationName == null || workStationName.isEmpty())
            return unprocessed;
        if (configuration.workStations.containsKey(workStationName)) {
            List<String> affectedCats = Arrays.asList(configuration.workStations.get(workStationName));
            if (excludeCompleted)
                orders = unprocessed.stream()
                        .filter(order -> order.containsCatsExcludeCompleted(affectedCats))
                        .collect(Collectors.toList());
            else
                orders = unprocessed.stream()
                        .filter(order -> order.containsCats(affectedCats))
                        .collect(Collectors.toList());
        } else {
            Log.e(TAG, "Workstation does not exist: " + workStationName);
        }
        return orders;
    }

    public List<Order> getOrders(List<Integer> orderIds) {
        if (orderIds == null)
            return new ArrayList<>();
        else
            return orderIds.stream()
                    .map((id) -> getOrder(id))
                    .collect(Collectors.toList());
    }

    public Order getOrder(int orderId) {
        Order ord = getUnprocessedOrder(orderId);
        if (ord == null) {
            ord = getUnpaidProcessedOrder(orderId);
            if (ord == null)
                ord = getProcessedOrder(orderId);
        }
        return ord;
    }

    public Order getUnprocessedOrUnpaidProcessedOrder(int orderId) {
        Order ord = getUnprocessedOrder(orderId);
        if (ord == null)
            ord = getUnpaidProcessedOrder(orderId);
        return ord;
    }

    protected Order getUnpaidProcessedOrder(int orderId) {
        return getOrderFromList(orderId, unpaidProcessed);
    }

    protected Order getUnprocessedOrder(int orderId) {
        return getOrderFromList(orderId, unprocessed);
    }

    protected Order getProcessedOrder(int orderId) {
        return getOrderFromList(orderId, processed);
    }

    protected Order getOrderFromList(int orderId, LinkedList<Order> orderList) {
        Order ord = null;
        ord = orderList.stream().filter(o -> o.id == orderId).findFirst().orElse(null);
        if (ord == null) 
            Log.d(TAG, "Cannot find order with id " + orderId + " in " + orderList.toString());
        return ord;
    }


	/*****************************************
	 * Update Order
	 *****************************************/

    public synchronized boolean updateOrder(Order order) {
        if (order == null)
            return false;
        Order oldOrder = getOrder(order.id);
        if (oldOrder != null) {
            if (oldOrder.isProcessed != order.isProcessed || oldOrder.isPaid != order.isPaid) {
                deleteOrder(oldOrder);
                return _addOrder(order);
            } else {
                if (oldOrder.isUnprocessed()) {
                    return updateOrderInList(oldOrder, order, unprocessed);
                } else if (oldOrder.isUnpaidProcessed()) {
                    return updateOrderInList(oldOrder, order, unpaidProcessed);
                } else if (oldOrder.isProcessed()) {
                    return updateOrderInList(oldOrder, order, processed);
                }
            }
        }
        return false;
    }

    protected boolean updateOrderInList(Order oldOrder, Order newOrder, LinkedList<Order> list) {
        int indx = list.indexOf(oldOrder);
        if (indx >= 0) {
            list.set(indx, newOrder);
            return true;
        } 
        Log.e(TAG, "Unable to find order " + oldOrder.toString() + " during update");
        return false;
    }


	/*****************************************
	 * Delete Order
	 *****************************************/

    public synchronized boolean deleteOrder(Integer orderId) {
       return _deleteOrder(orderId);
    }

    protected boolean _deleteOrder(Integer orderId) {
        Order order = getOrder(orderId);
        return (order != null) ? deleteOrder(order) : false;
    }

    protected boolean deleteOrder(Order order) {
        boolean res = false;
        if (order.isUnprocessed()) {
            res = deleteOrderFromList(unprocessed, order);
        } else if (order.isUnpaidProcessed()) {
            res = deleteOrderFromList(unpaidProcessed, order);
        } else if (order.isProcessed()) {
            res = deleteOrderFromList(processed, order);
        }
        if (!res)
            Log.e(TAG, "Unable to delete order " + order.toString());
        return res;
    }

    protected boolean deleteOrderFromList(LinkedList<Order> list, Order order) {
        Log.d(TAG, "Deleting order " + order.toString());
        return list.remove(order);
    }


	/*****************************************
	 * Pay Order
	 *****************************************/

    public synchronized Order payOrder(Integer orderId) {
        Order order = getOrder(orderId);
        if (order != null) {
            if (order.isUnprocessed()) {
                order.setIsPaid(true);
                return order;
            } else if (order.isUnpaidProcessed()) {
                if (_deleteOrder(orderId))
                    if (addOrderToProcessed(order))
                        return order;
            } else if (order.isProcessed()) {
                Log.e(TAG, "Trying to pay paid order " + order.toString());
                if (_deleteOrder(orderId))
                    if (addOrderToProcessed(order))
                        return order;
            }
        } 
        return null;
    }


	/*****************************************
	 * Join Orders
	 *****************************************/

    public synchronized boolean joinOrders(List<Integer> orderIds) {
        List<Order> orders = getOrders(orderIds);
        if (canJoinOrders(orders)) {
            Order base = orders.get(0);
            for(int i = 1; i < orders.size(); i++) {
                Order compare = orders.get(i);
                deleteOrder(compare);
                if (base.birthDate == null || (compare.birthDate != null && compare.birthDate.isBefore(base.birthDate)))
                    base.birthDate = compare.birthDate;

                if (base.processDate == null || (compare.processDate != null && compare.processDate.isAfter(base.processDate)))
                    base.processDate = compare.processDate;

                if (compare.comment != null && compare.comment != "")
                    base.comment = base.comment + " - " + compare.comment;
                base.addItems(compare.itemList);
            }
            return true;
        } else
            return false;
    }

    public boolean canJoinOrdersWithId(List<Integer> orderIds) {
        return canJoinOrders(getOrders(orderIds));
    }

    protected boolean canJoinOrders(List<Order> orders) {
        if (orders == null || orders.size() < 2 || orders.contains(null))
            return false;
        boolean paymentState = orders.get(0).isPaid;
        boolean processState = orders.get(0).isProcessed;
        String table = orders.get(0).table;
        return orders.stream()
                .anyMatch(o -> o.isPaid != paymentState
                        || o.isProcessed != processState
                        || o.table != table);
    }


	/*****************************************
	 * Process Order
	 *****************************************/

    public synchronized Order setItemCompleted(int orderId, int itemId, boolean completed) {
        Order order = getUnprocessedOrder(orderId);
        if (order != null) 
            order.setItemCompleted(itemId, completed);  
        return order;
    }

    public synchronized boolean processOrder(int orderId) {
        Order order = getUnprocessedOrder(orderId);
        if (order != null) {
            unprocessed.remove(order);
            if (order.isPaid())
                return addOrderToProcessed(order);
            else
                return addOrderToUnpaidProcessed(order);
        } else
            return false;
    }


	/*****************************************
	 * Order Lists
	 *****************************************/

    public synchronized boolean updateLists(OrderLists lists) {
        if (lists.unprocessed != null)
            unprocessed = lists.unprocessed;
        if (lists.unpaidProcessed != null)
            unpaidProcessed = lists.unpaidProcessed;
        if (lists.processed != null)
            processed = lists.processed;
        return (lists.unprocessed != null && lists.unpaidProcessed != null && lists.processed != null);
    }

    public OrderLists getOrderLists() {
        return new OrderLists(unprocessed, unpaidProcessed, processed);
    }


    /*****************************************
	 * Update Configuration
	 *****************************************/
    public synchronized Boolean updateConfiguration(ItemTypeConfiguration newConfig) {
        if (adjustUnpaidOrdersPrices(newConfig)) {
            this.configuration = newConfig;
            return true;
        } else 
            return false;
    }

    protected boolean adjustUnpaidOrdersPrices(ItemTypeConfiguration newConfig) {
        if (newConfig.itemTypeList.size() >= configuration.itemTypeList.size()) {
            // Note: In order to have id matches newConfig cannot have deleted itemTypes
            // (they can be unavailable though)
            unprocessed.stream().forEach(order -> order.adjustPrices(newConfig));
            unpaidProcessed.stream().forEach(order -> order.adjustPrices(newConfig));
            return true;
        } else 
            return false;
    }

    /*****************************************
     * Complete workservice
     *****************************************/

    public boolean isCompleted() {
        if (unprocessed == null || processed == null || unpaidProcessed == null)
            return false;
        return (unprocessed.isEmpty() && unpaidProcessed.isEmpty() && !processed.isEmpty());
    }

    public String closeWorkservice() {
        this.closeDate = LocalDateTime.now();
        return formatDate(birthDate) + "_" + configuration.name;
    }

    /*****************************************
	 * Various
	 *****************************************/

    protected static String formatDate(LocalDateTime date) {
        try {
            return date.format(dateFormatter);
        } catch (Exception e) {}
        return "";
    }

    public ItemTypeConfiguration getConfiguration() {
        return configuration;
    }

    public void adjustOrderCounter() {
        this.unprocessed = (unprocessed != null) ? unprocessed : new LinkedList<>();
        this.unpaidProcessed = (unpaidProcessed != null) ? unpaidProcessed : new LinkedList<>();
        this.processed = (processed != null) ? processed : new LinkedList<>();
        int lastIndex = Stream.of(unprocessed, unpaidProcessed, processed).flatMap(Collection::stream)
                .mapToInt((Order order) -> order.id).max().orElse(0);
        this.orderCounter = lastIndex + 1;
    }

}
