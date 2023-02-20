package com.orderassistant.connection;

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


import java.util.TimerTask;
import java.util.HashMap;
import java.util.Timer;

import android.net.NetworkRequest;
import android.net.ConnectivityManager;
import android.net.ConnectivityManager.NetworkCallback;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;


public abstract class AbstractService extends Service implements OACheckable {

    public static final String TAG = "OA_Service";
    protected static final int WAIT_STEP_PREVIOUS_INSTANCE = 100;

    protected boolean imForeground = false;
    protected boolean imClosing = false;
    protected Intent intent;


    protected static AbstractService instance;
    protected static boolean isInClosingState = false;

    private static OAModule moduleParam;
    protected OAModule module;

    protected static boolean startService(Activity activity, Intent intent,
     OAModule moduleParam) {
        if (instance != null) // Stop of previous connection if exists
            instance.stopService();

        AbstractService.moduleParam = moduleParam;
        Context context = activity.getApplicationContext();
        ComponentName name = context.startService(intent); 
        return true;
    }

    protected abstract boolean serviceOnCreate(Intent intent);
    protected abstract String getNotificationTitle();
    protected abstract String getNotificationText();
    protected abstract void onStopService();

    public boolean stopService() {
        isInClosingState = true;
        return doStopService();
    }

    @Override
    public void onCreate() {
        while (isInClosingState) {
            Log.d(TAG, "Waiting for previous instance to close");
            try {
                Thread.sleep(WAIT_STEP_PREVIOUS_INSTANCE);
            } catch (Exception e) {}
        }
        if (instance != null)
            Log.e(TAG, "Service didn't close properly!");

        instance = this;
        imForeground = false;
        imClosing = false;
        module = AbstractService.moduleParam;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        this.intent = intent;
        if (serviceOnCreate(intent)) {
            listenToWifiChanges();
            Log.d(TAG, "onCreate successfull");
        }
        return START_NOT_STICKY;
    }

    protected void listenToWifiChanges() {
        NetworkRequest request = new NetworkRequest.Builder()
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .build();
        ConnectivityManager connectivityManager = getSystemService(ConnectivityManager.class);
        NetworkCallback networkCallback = new NetworkCallback() {

            @Override
            public void onLost(Network network) {
                Log.d(TAG, "lost");
                module.onWifiLost();
                stopService();
            }

        };
        connectivityManager.registerNetworkCallback(request, networkCallback); // For listen
    }

    protected void makeServiceForeground() {
        String channelID = "Order Assistant"; 
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_IMMUTABLE);

        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(
                new NotificationChannel(
                        channelID,
                        "Order Assistant",
                        NotificationManager.IMPORTANCE_MAX));

        Notification notification = new Notification.Builder(this, channelID)
                .setContentTitle(getNotificationTitle())
                .setContentText(getNotificationText())
                .setSmallIcon(R.drawable.oa_icon)
                .setContentIntent(pendingIntent)
                .setTicker("Ticker")
                .build();

        // Notification ID cannot be 0.
        startForeground(1, notification);
        imForeground = true;
    }

    @Override
    public IBinder onBind(Intent intent) {
        Log.d(TAG, "Service onBind");
        return null;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.e(TAG, "onTaskRemoved");
        doStopService();
    }

    private boolean doStopService() {
        if (!isInClosingState) // If app is killed from recent app
            isInClosingState = true;

        onStopService();
        stopServiceForeground();
        stopSelf();
        if (module != null)
            module.onStopService();
        return true;
    }

    @Override
    public void onDestroy() {
        instance = null;
        isInClosingState = false;
        Log.d(TAG, "Service stopped");
    }

    protected void stopServiceForeground() {
        if (imForeground) {
            stopForeground(Service.STOP_FOREGROUND_REMOVE);
            imForeground = false;
        }
    }

    protected boolean isCheckableGood(OACheckable checkable) {
        return (checkable != null) && checkable.isGood();
    }

    protected static boolean isNotNull(Object o, String name) {
        if (o == null) {
            Log.e(TAG, name + " is Null!");
            return false;
        } else 
            return true;
    }

}


