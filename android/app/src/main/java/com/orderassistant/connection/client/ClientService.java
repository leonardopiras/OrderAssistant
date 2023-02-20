package com.orderassistant.connection.client;

import android.app.Service;
import android.util.Log;
import android.app.Notification;
import android.app.PendingIntent;
import android.os.IBinder;
import android.content.Context;


import android.os.Binder;
import android.os.IBinder;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.app.NotificationManager;
import android.app.NotificationChannel;
import android.app.Activity;
import com.orderassistant.connection.nsd.NsdServer;
import com.orderassistant.R;
import android.content.ServiceConnection;
import android.content.ComponentName;
import com.facebook.react.bridge.Callback;

import com.orderassistant.connection.*;
import com.orderassistant.connection.nsd.NsdClient;
import com.orderassistant.connection.serverDetails.ServerDetails;
import com.orderassistant.connection.serverDetails.InfoClient;
import com.orderassistant.models.*;



import java.util.TimerTask;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.HashMap;
import java.util.Timer;

import android.provider.Settings.Secure;

import static com.orderassistant.connection.client.ClientService.StartUpReturnCode.*;


public class ClientService extends AbstractService {

    protected static final String ADDRESS = "address";
    protected static final String USERNAME = "username";
    protected static final String ROOMNAME = "roomName";
    protected static final String PORT = "port";
    protected static final String INFOPORT = "infoPort";

    protected static final int NO_VALUE = -1;

    protected String address;
    protected String username;
    protected String roomName;
    protected int port;
    protected int infoPort;

    protected OAWSClient wsClient;

    protected AtomicBoolean startUpFinished;

    public static enum StartUpReturnCode {
        ALL_GOOD(0), 
        GENERIC_ERROR(1),
        NAME_ALREADY_IN_USE(2),
        PARSER_ERROR(3),
        TIMER_EXCEDEED(4),
        ECONNREFUSED(5),
        ERROR_ON_CLOSE(6);

        int val;
        StartUpReturnCode(int val) {
            this.val = val;
        } 
    }


    public static void start(Activity activity,
     String address, int port, String roomName, String username, int infoPort, OAModule module) {
        Intent intent = setIntent(activity, address, port, roomName, username, infoPort);
        startService(activity, intent, module);
    }

    
    private static Intent setIntent(Activity activity, String address, int port, String roomName,
     String username, int infoPort) {
        Intent intent = new Intent(activity, ClientService.class);
        intent.putExtra(ADDRESS, address);
        intent.putExtra(USERNAME, username);
        intent.putExtra(ROOMNAME, roomName);
        intent.putExtra(PORT, port);
        intent.putExtra(INFOPORT, infoPort);
        return intent;
    }



    protected boolean setStartUpParamsFromIntent(Intent intent) {
        if (intent != null) {
            this.address = intent.getStringExtra(ADDRESS);
            this.username = intent.getStringExtra(USERNAME);
            this.roomName = intent.getStringExtra(ROOMNAME);
            this.infoPort = intent.getIntExtra(INFOPORT, NO_VALUE);
            this.port = intent.getIntExtra(PORT, NO_VALUE);

            return (address != null && username != null && roomName != null &&
            infoPort != NO_VALUE && port != NO_VALUE);
        } else {
            Log.e(TAG, "Intent is null");
            return false;
        }
    }

    @Override
    protected boolean serviceOnCreate(Intent intent) {
        if (setStartUpParamsFromIntent(intent)) {
            this.startUpFinished = new AtomicBoolean(false); 
            String deviceId = getDeviceId();
            this.wsClient = new OAWSClient(address, port, username, deviceId, this, module);
        }
        return isCheckableGood(wsClient);
    }

    public synchronized boolean onFinishStartUp(boolean good, StartUpReturnCode code) {
        boolean isFirstCall = startUpFinished.compareAndSet(false, true);
        if (isFirstCall) {
            if (code == ERROR_ON_CLOSE && checkNameAlreadyInUse())
                code = NAME_ALREADY_IN_USE;

            module.onFinishStartUpClient(good, code.val, wsClient);
            if (good)
                makeServiceForeground();
            else
                stopService();
        }
        return isFirstCall;
    }

    protected boolean checkNameAlreadyInUse() {
        ServerDetails details = InfoClient.getServerDetails(address, infoPort, 2000L);
        return details != null && details.isUsernamePresent(username);
    }


    @Override
    protected void onStopService() {
        /* salva tutto */
        wsClient.stopClient();
    }

   
    @Override
    public boolean isGood() {
        return isCheckableGood(wsClient);
    }


    @Override
    protected String getNotificationTitle() {
        return roomName;
    }

    @Override
    protected String getNotificationText(){
        return "Connesso correttamente a " + roomName;
    }

    protected String getDeviceId() {
        return Secure.getString(getContentResolver(), Secure.ANDROID_ID);
    }

    

    public static boolean isServiceRunning() {
        return instance != null && (instance instanceof ClientService) && instance.isGood();
    }

    public static ClientService getInstance() {
        return (ClientService) instance;
    }
}


