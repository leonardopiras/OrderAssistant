package com.orderassistant;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import com.facebook.react.bridge.*;
import com.orderassistant.connection.client.*;
import com.orderassistant.models.*;
import com.orderassistant.connection.*;
import com.orderassistant.connection.server.*;
import com.orderassistant.models.WorkService;
import com.orderassistant.connection.nsd.*;
import com.orderassistant.connection.serverDetails.*;
import com.orderassistant.connection.nsd.NsdClient.NsdClientListener;
import com.orderassistant.storagemanager.*;
import com.orderassistant.utils.*;

import android.util.Log;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OAMainModule extends ReactContextBaseJavaModule implements OAModule {

    public static String TAG = "OA_MainModule";// "WSServerModule";
    protected ReactApplicationContext context;
    protected OAWSServer server;
    protected OAWSClient client;

    protected Callback startUpCallback;

    public static enum State {
        UNBOUND, BINDING, SERVER, CLIENT,
    }

    public State state = State.UNBOUND;

    public OAMainModule(ReactApplicationContext context) {
        super(context);
        this.context = context;
        LoadSave.initLoadSave(context);
    }

    /*****************************************
     * Start server
     *****************************************/

    @ReactMethod
    public void startServer(String roomName, String ownerName, String configurationName, Callback cb) {
        if (!canServerStart())
            return;
        try {
            this.startUpCallback = cb;
            ServerService.start(getCurrentActivity(), roomName, ownerName, configurationName, (OAModule) this);
        } catch (Exception e) {
            cb.invoke(false);
        }
    }

    @ReactMethod
    public void startServerPreviousWorkService(Callback cb) {
        if (!canServerStart())
            return;
        if (LoadSave.isPreviousWorkservicePresent()) {
            WorkService workService = Load.loadPreviousWorkService();
            if (workService != null) {
                startServerWithWorkService(cb, workService);
                return;
            }
        }
        setState(State.UNBOUND);
        cb.invoke(false, ServerService.StartUpReturnCode.ERROR_LOAD_PREVIOUS_WORKSERVICE.val);
    }

    @ReactMethod
    public void taketheLead(Callback cb) {
        if (canServerStart()) {
            WorkService workService = getClient().getWorkService();
            startServerWithWorkService(cb, workService);
        }
    }

    boolean canServerStart() {
        if (state == State.UNBOUND) {
            setState(State.BINDING);
            return true;
        } else 
            return false;
    }

    private void startServerWithWorkService(Callback cb, WorkService workService) {
        this.startUpCallback = cb;
        try {
            ServerService.startWithWorkService(getCurrentActivity(), getMyName(), workService, (OAModule) this);
        } catch (Exception e) {
            Log.e(TAG, "Error when starting with workService", e);
            cb.invoke(false, ServerService.StartUpReturnCode.GENERIC_ERROR.val);
        }
    }

    @Override
    public void onFinishStartUpServer(boolean good, int code, OAWSServer server) {
        setStateOnFinishStartUp(State.SERVER, good);
        if (good) {
            this.server = server;
            Load.deletePreviousWorkServiceFie();
        }
        invokeOnFinishStartUp(good, code);
    }

    public void invokeOnFinishStartUp(boolean good, int code) {
        if (startUpCallback != null) {
            startUpCallback.invoke(good, code);
            startUpCallback = null;
        } else
            Log.e(TAG, "Trying to invoke startUpCallback multiple times");
    }

    public void setStateOnFinishStartUp(State newState, boolean good) {
        if (newState == State.SERVER || newState == State.CLIENT)
            setState(good ? newState : State.UNBOUND);
        else
            setState(State.UNBOUND);
    }

    public void setState(State newState) {
        this.state = newState;
    }

    @ReactMethod
    public void tesThread() {
        getClient().testThread();
    }

    @ReactMethod
    public void isPreviousWorkServicePresent(Callback cb) {
        cb.invoke(LoadSave.isPreviousWorkservicePresent());
    }

    /*****************************************
     * Start Client
     *****************************************/

    @ReactMethod
    public void findServers(int millis, Callback onDiscoveryStoppedCb) {
        NsdClient.findServers(millis, context, new NsdClientListener() {

            @Override
            public void onServerFound(NsdData nsdData) {
                Utils.sendEvent(context, "NewServerFound", nsdData.toWritableMap());
                getServerDetails(nsdData.address, nsdData.infoPort);
            }

            @Override
            public void onDiscoveryStopped() {
                onDiscoveryStoppedCb.invoke();
            }
        });

    }

    @ReactMethod
    public void getServerDetails(String serverInfoAddress, int infoPort) {
        ServerDetails details = InfoClient.getServerDetails(serverInfoAddress, infoPort);
        if (details != null) {
            Utils.sendEvent(getReactApplicationContext(), "NewServerDetails", details.toWritableMap());

        }
    }

    @ReactMethod
    public void connectToServer(String address, int port, String roomName,
            String username, int infoPort, Callback cb) {
        try {
            this.startUpCallback = cb;
            ClientService.start(getCurrentActivity(), address, port, roomName, username, infoPort, (OAModule) this);
        } catch (Exception e) {
            Log.e(TAG, "Unable to start ClientService ", e);
            cb.invoke(false, ClientService.StartUpReturnCode.GENERIC_ERROR);
        }
    }

    @Override
    public void onFinishStartUpClient(boolean good, int code, OAWSClient client) {
        setStateOnFinishStartUp(State.CLIENT, good);
        if (good)
            this.client = client;
        invokeOnFinishStartUp(good, code);
    }

    /*****************************************
     * Store configuration
     *****************************************/

    @ReactMethod
    public void isConfigurationSaved(Callback cb) {
        String configurationName = getOAConn().getItemTypeConfiguration().name;
        cb.invoke(LoadSave.configurationExist(configurationName));
    }

    @ReactMethod
    public void saveConfiguration() {
        ItemTypeConfiguration config = getOAConn().getItemTypeConfiguration();
        if (config != null)
            Save.saveItemTypeConfiguration(config);
    }

    /*****************************************
     * Order manipulation
     *****************************************/

    public void handleServiceUnbound() {
        Utils.sendEvent(context, "serviceUnbound", null);
    }

    @ReactMethod
    public void addOrder(ReadableArray itemList, String comment, String table,
            Boolean isPaid, Boolean isProcessed, Integer seats, Double coverCharge, Callback cb) {
        Order ord = new Order(itemList, comment, table, getMyName(), isPaid, isProcessed, seats, coverCharge);

        switch (state) {
            case SERVER:
                boolean res = getServer().addOrder(ord);
                cb.invoke(res);
                break;
            case CLIENT:
                getClient().addOrderRequest(ord, cb);

                break;
            default:
                handleServiceUnbound();
        }
    }

    @ReactMethod
    public void getOrder(Integer orderId, Callback cb) {
        switch (state) {
            case SERVER:
            case CLIENT:
                Order order = getWorkService().getOrder(orderId);
                cb.invoke(order != null ? order.toWritableMap() : null);
                break;
            default:
                handleServiceUnbound();
        }
    }

    @ReactMethod
    public void updateOrder(ReadableArray itemList,
            String comment, String table, Boolean isPaid, Boolean isProcessed, Integer seats,
            Double coverCharge, Integer orderId, String birthDate, String processDate, Callback cb) {
        Order ord = new Order(itemList, comment, table, getMyName(), isPaid,
                isProcessed, seats, coverCharge, birthDate, processDate, orderId);
        switch (state) {
            case SERVER:
                boolean res = getServer().updateOrder(ord);
                cb.invoke(res);
                break;
            case CLIENT:
                getClient().updateOrderRequest(ord, cb);

                break;
            default:
                handleServiceUnbound();
        }
    }

    @ReactMethod
    void joinOrders(ReadableArray ordersIdR, Callback cb) {
        ArrayList<Integer> orderIds = WritableReadableUtils.intListFromReadbleArray(ordersIdR);
        switch (state) {
            case SERVER:
                boolean res = getServer().joinOrders(orderIds);
                cb.invoke(res);
                break;
            case CLIENT:
                getClient().joinOrdersRequest(orderIds, cb);

                break;
            default:
                handleServiceUnbound();
        }
    }

    @ReactMethod
    public void deleteOrder(Integer orderId, Callback cb) {
        switch (state) {
            case SERVER:
                boolean res = getServer().deleteOrder(orderId);
                cb.invoke(res);
                break;
            case CLIENT:
                getClient().deleteOrderRequest(orderId, cb);
                break;
            default:
                handleServiceUnbound();
        }
    }

    @ReactMethod
    public void payOrder(Integer orderId, Callback cb) {
        switch (state) {
            case SERVER:
                boolean res = getServer().payOrder(orderId);
                cb.invoke(res);
                break;
            case CLIENT:
                getClient().payOrderRequest(orderId, cb);
                break;
            default:
                handleServiceUnbound();
        }

    }

    /*****************************************
     * Getters
     *****************************************/

    @ReactMethod
    public void getWorkService(Callback cb) {
        switch (state) {
            case SERVER:
            case CLIENT:
                WorkService workService = getOAConn().getWorkService();
                cb.invoke(workService.toWritableMap());
                break;
            default:
                handleServiceUnbound();
        }

    }

    @ReactMethod
    public void getOrderLists(Callback cb) {
        switch (state) {
            case SERVER:
            case CLIENT:
                OrderLists lists = getOAConn().getWorkService().getOrderLists();
                cb.invoke(lists.toWritableMap());
                break;
            default:
                handleServiceUnbound();
        }

    }

    @ReactMethod
    public void getRemainingOrdersGroupByWorkStation(Callback cb) {
        switch (state) {
            case SERVER:
            case CLIENT:
                HashMap<String, Integer> hmap = getWorkService().getRemainingOrdersGroupByWorkStation();
                WritableMap map = WritableReadableUtils.<Integer>hashMapToWritable(hmap);
                cb.invoke(map);
                break;
            default:
                handleServiceUnbound();
        }
    }

    @ReactMethod
    public void getCurrentConfiguration(Callback cb) {
        switch (state) {
            case SERVER:
            case CLIENT:
                WritableMap map = getOAConn().getItemTypeConfiguration().toWritableMap();
                cb.invoke(map);
                break;
            default:
                handleServiceUnbound();
        }

    }

    /*****************************************
     * WorkStation
     *****************************************/

    @ReactMethod
    public void getWorkStationOrders(String workStation, Boolean excludeCompleted, Callback cb) {
        switch (state) {
            case SERVER:
            case CLIENT:
                List<Order> orders = getWorkService().getWorkStationOrders(workStation, excludeCompleted);
                WritableArray arr = WritableReadableUtils.writableListToWritableArray(orders);
                cb.invoke(arr);
                break;
            default:
                handleServiceUnbound();
        }

    }

    @ReactMethod
    public void setItemCompleted(int orderId, int itemId, boolean completed, Callback cb) {
        switch (state) {
            case SERVER:
                boolean res = getServer().setItemCompleted(orderId, itemId, completed);
                cb.invoke(res);
                break;
            case CLIENT:
                getClient().setItemCompletedRequest(orderId, itemId, completed, cb);
                break;
            default:
                handleServiceUnbound();
        }
    }

    @ReactMethod
    public void processOrder(Integer orderId, Callback cb) {
        switch (state) {
            case SERVER:
                Boolean good = getServer().processOrder(orderId);
                cb.invoke(good);
                break;
            case CLIENT:
                getClient().processOrderRequest(orderId, cb);
                break;
            default:
                handleServiceUnbound();
        }
    }

    /*****************************************
     * Manage Configuration
     *****************************************/

    @ReactMethod
    public void updateConfiguration(ReadableArray itemTypeList, ReadableMap workStations,
            ReadableMap preferences, Callback cb) {

        if (state == State.UNBOUND || state == State.BINDING) {
            handleServiceUnbound();
            return;
        }

        String configName = getOAConn().getItemTypeConfiguration().name;
        ItemTypeConfiguration conf = new ItemTypeConfiguration(itemTypeList, configName,
                workStations, preferences);
        if (state == State.SERVER) {
            Boolean good = getServer().updateConfiguration(conf);
            cb.invoke(good);
        } else if (state == State.CLIENT)
            getClient().updateConfigurationRequest(conf, cb);
    }

    /*****************************************
     * Stop WorkService
     *****************************************/

    @ReactMethod
    public void stopWorkService() {
        switch (state) {
            case SERVER:
                ServerService.getInstance().stopService();
                break;
            case CLIENT:
                ClientService.getInstance().stopService();
                break;
            default:
                handleServiceUnbound();
        }
    }

    /*****************************************
     * On Module implementation
     *****************************************/
    @Override
    public void onStopService() {
        setState(State.UNBOUND);
    }

    @Override
    public void onWorkServiceUpdate(WorkService workService) {
        sendUpdateEvent("ws");
    }

    @Override
    public void onOrderUpdate(Order order) {
        sendUpdateEvent("order_" + order.id);
    }

    @Override
    public void onOrderListsUpdate(OrderLists lists) {
        sendUpdateEvent("lists");
    }

    @Override
    public void onServerLost() {
        if (state == State.CLIENT) {
            setState(State.UNBOUND);
            Utils.sendEvent(context, "serverLost", null);
        }
    }

    @Override
    public void onWifiLost() {
        setState(State.UNBOUND);
        handleServiceUnbound();
    }


    protected void sendUpdateEvent(String type) {
        WritableMap map = new WritableNativeMap();
        map.putString("type", type);
        Utils.sendEvent(context, "update", map);
    }

    /*****************************************
     * Various
     *****************************************/

    @ReactMethod
    public void isWifiGood(Callback cb) {
        boolean good = Utils.isWifiGood(getReactApplicationContext());
        cb.invoke(good);
    }

    @ReactMethod
    public void isWorkServiceRunning(Callback cb) {
        cb.invoke(state != State.UNBOUND);
    }

    @ReactMethod
    public void checkConnection(Callback cb) {
        cb.invoke(state != State.UNBOUND);
    }

    protected OAConnection getOAConn() {
        switch (state) {
            case SERVER:
                return getServer();
            case CLIENT:
                return getClient();
            default:
                return null;
        }
    }

    protected OAWSServer getServer() {
        return server;
    }

    protected OAWSClient getClient() {
        return client;
    }

    protected String getMyName() {
        return UsernameModule.getUsername(getReactApplicationContext()); // getOAConn().getUsername();
    }

    protected WorkService getWorkService() {
        return getOAConn().getWorkService();
    }

    @Override
    public String getName() {
        return "OAMainModule";
    }

}
