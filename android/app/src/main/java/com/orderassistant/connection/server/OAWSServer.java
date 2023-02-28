package com.orderassistant.connection.server;

import android.util.Log;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.concurrent.ConcurrentHashMap;

import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.*;

import java.nio.ByteBuffer;

import org.java_websocket.server.*;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.java_websocket.framing.CloseFrame;
import org.java_websocket.exceptions.InvalidDataException;
import org.java_websocket.handshake.ServerHandshakeBuilder;
import org.java_websocket.drafts.Draft;

import java.net.InetSocketAddress;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.security.SecureRandom;

import com.google.gson.Gson;

import com.orderassistant.models.*;
import com.orderassistant.storagemanager.*;
import com.orderassistant.utils.Utils;
import com.orderassistant.connection.*;
import com.orderassistant.connection.OAMessage.*;

public class OAWSServer extends AbstractWSServer implements OAConnection {

    protected String configurationName;
    protected WorkService workService;
    protected OAModule module;

    public OAWSServer(String serviceName, String ownerName, String configurationName, OAModule module, InetSocketAddress address) {
        super(serviceName, ownerName, address);
        this.configurationName = configurationName;
        this.module = module;
        doStartWSServer();
    }

    public OAWSServer(String serviceName, String ownerName, WorkService overrideWorkService, OAModule module, InetSocketAddress address) {
        super(overrideWorkService.getConfiguration().name, ownerName, address);
        this.workService = overrideWorkService;
        doStartWSServer();
    }

    @Override
    protected void onStartServer() {
        if (workService == null) {
            ItemTypeConfiguration configuration = Load.loadItemTypeConfiguration(configurationName);
            this.workService = new WorkService(configuration);
        }
    }

    @Override
    protected void onAddNewClient(WebSocket conn, ClientHandshake handshake, String newClientName) {

    }

    @Override
    protected void onRemoveClient(WebSocket conn, String leavingClientName) {

    }

    @Override
    protected void onStopServer() {
        broadcast(OAMessage.newMsg(getWorkService(), MsgType.SERVER_STOPPED));
    }


    /*****************************************
     * OAConnection implementation
     *****************************************/

    public String getUsername() {
        return getOwnerName();
    }

    @Override
	public WorkService getWorkService() {
		return workService;
    }

    @Override
    public ItemTypeConfiguration getItemTypeConfiguration() {
        return workService.configuration;
    }


    /*****************************************
     * OAMainModule Calls
     *****************************************/

    public boolean addOrder(Order order) {
        if (getWorkService().addOrder(order)) {
            broadcastNewOrder(order, null);
            return true;
        } else
            return false;
    }

    public boolean setItemCompleted(int orderId, int itemId, boolean completed) {
        Order ord = getWorkService().setItemCompleted(orderId, itemId, completed);
        if (ord != null) 
            broadcastOrderUpdate(ord, null);
        return ord != null;
    }

    public boolean updateOrder(Order order) {
        boolean good = getWorkService().updateOrder(order);
        if (good)
            broadcastOrderUpdate(order, null);
        return good;
    }

    public boolean processOrder(int orderId) {
        Order order = getWorkService().processOrder(orderId);
        Boolean good = order != null;
        if (good) 
            broadcastOrderUpdate(order, null);
        return good;
    }

    public boolean deleteOrder(Integer orderId) {
        boolean good = getWorkService().deleteOrder(orderId);
        if (good)
            broadcastOrderLists(null);
        return good;
    }

    public boolean payOrder(Integer orderId) {
        Order order = getWorkService().payOrder(orderId);
        Boolean good = order != null;
        if (good)
            broadcastOrderUpdate(order, null);
        return good;
    }

    public boolean joinOrders(ArrayList<Integer> orderIds) {
        Boolean good = getWorkService().joinOrders(orderIds);
        if (good)
            broadcastOrderLists(null);
        return good;
    }

    public boolean updateConfiguration(ItemTypeConfiguration config) {
        Boolean good = getWorkService().updateConfiguration(config);
        if (good)
            broadcastWorkService(null);
        return good;
    }


    /*****************************************
     * Broadcast
     *****************************************/

    protected void broadcastWorkService(WebSocket requestorWebSocket) {
        String requestor = getClientName(requestorWebSocket);
        broadcast(getWorkService(), MsgType.WORKSERVICE_UPDATE, requestor);
        if (requestor != null)
            invokeModuleWorkServiceUpdate();
    }

    protected void broadcastOrderLists(WebSocket requestorWebSocket) {
        String requestor = getClientName(requestorWebSocket);
        broadcast(getWorkService().getOrderLists(), MsgType.ORDER_LISTS_UPDATE, requestor);
        if (requestor != null)
            invokeModuleOrderListsUpdate();
    }

    protected void broadcastOrderUpdate(Order order, WebSocket requestorWebSocket) {
        String requestor = getClientName(requestorWebSocket);
        broadcast(order, MsgType.ORDER_UPDATE, requestor);
        if (requestor != null)
            invokeModuleOrderUpdate(order);
    }  

    protected void broadcastNewOrder(Order order, WebSocket requestorWebSocket) {
        String requestor = getClientName(requestorWebSocket);
        broadcast(order, MsgType.NEW_ORDER, requestor);
        if (requestor != null)
            invokeModuleOrderListsUpdate();
    }

    protected String getClientName(WebSocket conn) {
        return (conn != null) ? conn.<String>getAttachment() : null;
    }


    /*****************************************
     * On Message Handler
     *****************************************/

    @Override
    public void onMessage(WebSocket conn, ByteBuffer buffer) {
        Log.d(TAG, "received ByteBuffer");
        OAMessage mess = OAMessage.fromByteBuffer(buffer);
        if (mess == null)
            return;
        Log.d(TAG, "ByteBuffer is " + mess.type);
        Log.d("ThreadSafe", "______________________Open " + mess.type);
        switch (mess.type) {
            case STARTUP_ENV_REQUEST:
                handleStartUpEnvRequest(mess, conn);
                break;
            case WORKSERVICE_REQUEST:
                handleWorkServiceRequest(mess, conn);
                break;
            case ORDER_LISTS_REQUEST:
                handleOrdersRequest(mess, conn);
                break;
            case ADD_ORDER_REQUEST:
                handleAddOrderRequest(mess, conn);
                break;
            case UPDATE_CONFIGURATION_REQUEST:
                handleUpdateConfigurationRequest(mess, conn);
                break;
            case COMPLETE_ITEM_REQUEST:
                handleCompleteItemRequest(mess, conn);
                break;
            case PROCESS_ORDER_REQUEST:
                handleProcessOrderRequest(mess, conn);
                break;
            case ORDER_UPDATE_REQUEST:
                handleOrderUpdateRequest(mess, conn);
                break;
            case DELETE_ORDER_REQUEST: 
                handleDeleteOrderRequest(mess, conn);
                break;
            case PAY_ORDER_REQUEST: 
                handlePayOrderRequest(mess, conn);
                break;
            case JOIN_ORDERS_REQUEST:
                handleJoinOrdersRequest(mess, conn);
                break;
                

            case WORKSERVICE_RESPONSE:
            case STARTUP_ENV_RESPONSE:
            case WORKSERVICE_UPDATE:
            case ADD_ORDER_RESPONSE:
            case UPDATE_CONFIGURATION_RESPONSE:
            case PROCESS_ORDER_RESPONSE:
            case ORDER_UPDATE_RESPONSE:
            case DELETE_ORDER_RESPONSE:
            case PAY_ORDER_RESPONSE:
            case JOIN_ORDERS_RESPONSE:
            case ORDER_LISTS_RESPONSE:
            case ORDER_UPDATE:
            case ORDER_LISTS_UPDATE:
            case SERVER_STOPPED: 
                Log.e(TAG, "Message not handled in server " + mess.type);
                break;
            default:
                Log.e(TAG, "Unknown message received " + mess.type);
        }
        Log.d("ThreadSafe", "Close " + mess.type);
    }

    protected void handleOrdersRequest(OAMessage mess, WebSocket conn) {
        OrderLists orders = getWorkService().getOrderLists();
        send(orders, MsgType.ORDER_LISTS_RESPONSE, conn);
    }

    protected void handleJoinOrdersRequest(OAMessage mess, WebSocket conn) {
        ArrayList<Integer> orderIds = mess.<ArrayList<Integer>>getPayload();
        Boolean good = getWorkService().joinOrders(orderIds);
        if (good)
            broadcastOrderLists(conn);  
        send(good, MsgType.JOIN_ORDERS_RESPONSE, conn);
    }


    protected void handlePayOrderRequest(OAMessage mess, WebSocket conn) {
        Integer orderId = mess.<Integer>getPayload();
        Order order = getWorkService().payOrder(orderId);
        Boolean good = order != null;
        if (good) 
            broadcastOrderUpdate(order, conn);
        send(good, MsgType.PAY_ORDER_RESPONSE, conn);

    }

    protected void handleDeleteOrderRequest(OAMessage mess, WebSocket conn) {
        Integer orderId = mess.<Integer>getPayload();
        Boolean good = getWorkService().deleteOrder(orderId);
        send(good, MsgType.DELETE_ORDER_RESPONSE, conn);
        if (good)
            broadcastOrderLists(conn);
    }

    protected void handleOrderUpdateRequest(OAMessage mess, WebSocket conn) {
        Order order = mess.<Order>getPayload();
        Boolean result = getWorkService().updateOrder(order);
        send(result, MsgType.ORDER_UPDATE_RESPONSE, conn);
        if (result)
            broadcastOrderUpdate(order, conn);
    }

    protected void handleProcessOrderRequest(OAMessage mess, WebSocket conn) {
        Integer orderId = mess.<Integer>getPayload();
        Order order = getWorkService().processOrder(orderId);
        Boolean good = order != null;
        send(good, MsgType.PROCESS_ORDER_RESPONSE, conn);
        if (good)
            broadcastOrderUpdate(order, conn);
    }

    protected void handleCompleteItemRequest(OAMessage mess, WebSocket conn) {
        CompleteItemPayload payload = mess.<CompleteItemPayload>getPayload();
        int orderId = payload.orderId;
        int itemId = payload.itemId;
        boolean completed = payload.completed;
        Order ord = getWorkService().setItemCompleted(orderId, itemId, completed);
        Boolean good = ord != null;
        send(good, MsgType.COMPLETE_ITEM_RESPONSE, conn);
        if (good) 
            broadcastOrderUpdate(ord, conn);
    }

    protected void handleStartUpEnvRequest(OAMessage mess, WebSocket conn) {
        send(getWorkService(), MsgType.STARTUP_ENV_RESPONSE, conn);
    }

    protected void handleUpdateConfigurationRequest(OAMessage mess, WebSocket conn) {
        ItemTypeConfiguration newConfig = mess.<ItemTypeConfiguration>getPayload();
        Boolean good = getWorkService().updateConfiguration(newConfig);
        send(good, MsgType.UPDATE_CONFIGURATION_RESPONSE, conn);
        if (good)
            broadcastWorkService(conn);
    }

    protected void handleAddOrderRequest(OAMessage mess, WebSocket conn) {
        Order order = mess.<Order>getPayload();
        Boolean good = workService.addOrder(order);
        send(good, MsgType.ADD_ORDER_RESPONSE, conn);
        if (good)
            broadcastNewOrder(order, conn);
    }

    protected void handleWorkServiceRequest(OAMessage mess, WebSocket conn) {
        send(getWorkService(), MsgType.WORKSERVICE_RESPONSE, conn);
    }

    /*****************************************
     * OAModule invokes
     *****************************************/

    protected void invokeModuleOrderUpdate(Order order) {
        if (module != null)
            module.onOrderUpdate(order);
        else
            Log.e(TAG, "Module not bound");
    }

    protected void invokeModuleWorkServiceUpdate() {
        if (module != null)
            module.onWorkServiceUpdate(workService);
        else
            Log.e(TAG, "Module not bound");
    }

    protected void invokeModuleOrderListsUpdate() {
        if (module != null)
            module.onOrderListsUpdate(getWorkService().getOrderLists());
        else
            Log.e(TAG, "Module not bound");
    }


    /*****************************************
     * Various
     *****************************************/

   
    protected void send(Object object, MsgType msgType, WebSocket conn) {
        conn.send(OAMessage.newMsg(object, msgType));
    }

    protected void broadcast(Object object, MsgType msgType) {
        broadcast(OAMessage.newMsg(object, msgType));
    }  
    protected void broadcast(Object object, MsgType msgType, String requestor) {
        broadcast(OAMessage.newMsg(object, msgType, requestor));
    }

    

    
}
 