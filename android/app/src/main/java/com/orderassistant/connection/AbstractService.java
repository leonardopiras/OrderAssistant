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
import com.orderassistant.utils.Utils;
import com.orderassistant.R;
import android.content.ServiceConnection;
import android.content.ComponentName;
import com.facebook.react.bridge.Callback;


import java.util.TimerTask;
import java.util.concurrent.atomic.AtomicBoolean;
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

    protected AtomicBoolean imForeground;
    protected Intent intent;


    protected static AbstractService instance;
    protected static AtomicBoolean isInClosingState = new AtomicBoolean(false);

    private static OAModule moduleParam;
    protected OAModule module;

    private NetworkCallback wifiCallBack;

    protected static boolean startService(Activity activity, Intent intent,
     OAModule moduleParam) {
        if (instance != null) // Stop of previous connection if exists
            instance.stopService();

        AbstractService.moduleParam = moduleParam;
        Context context = activity.getApplicationContext();
        new Thread(() -> {
            ComponentName name = context.startService(intent); 
		}).start();
        return true;
    }

    protected abstract boolean serviceOnCreate(Intent intent);
    protected abstract String getNotificationTitle();
    protected abstract String getNotificationText();
    protected abstract void onStopService();

    public boolean stopService() {
        isInClosingState.set(true);
        return doStopService();
    }

    @Override
    public void onCreate() {
        waitForPrevoiusInstanceToClose();
    }

    private void waitForPrevoiusInstanceToClose() {
        int steps = 20;
        while (isInClosingState.get() && --steps > 0) {
            Log.d(TAG, "Waiting for previous instance to close");
            try {
                Thread.sleep(WAIT_STEP_PREVIOUS_INSTANCE);
            } catch (Exception ignored) {}
        }
        if (steps <= 0 || instance != null)
            Log.e(TAG, "Previous service instance didn't close properly");
        isInClosingState.set(false);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        instance = this;
        imForeground = new AtomicBoolean(false);
        module = AbstractService.moduleParam;

        this.intent = intent;
        if (serviceOnCreate(intent)) {
            listenToWifiChanges();
            Log.d(TAG, "onCreate successfull");
        } else 
            stopService();
        return START_NOT_STICKY;
    }

    protected void listenToWifiChanges() {
        NetworkRequest request = new NetworkRequest.Builder()
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .build();
        ConnectivityManager connectivityManager = getSystemService(ConnectivityManager.class);
        wifiCallBack = new NetworkCallback() {

            @Override
            public void onLost(Network network) {
                Log.d(TAG, "Lost network: " + network);
                module.onWifiLost();
                stopService();
            }

        };
        connectivityManager.registerNetworkCallback(request, wifiCallBack); // For listen
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
        imForeground.set(true);
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
        boolean killedFromRecentApps = isInClosingState.compareAndSet(false, true);
    
        unregisterWifiCallback(); 
        onStopService();
        stopServiceForeground();
        stopSelf();
        if (module != null)
            module.onStopService();
        return true;
    }

    private void unregisterWifiCallback() {
        if (wifiCallBack != null) {
            ConnectivityManager connectivityManager = getSystemService(ConnectivityManager.class);
            if (connectivityManager != null)
                connectivityManager.unregisterNetworkCallback(wifiCallBack);
        }
    }

    @Override
    public void onDestroy() {
        instance = null;
        isInClosingState.set(false);
        Log.d(TAG, "Service stopped");
    }

    protected void stopServiceForeground() {
        if (imForeground.compareAndSet(false, true)) 
            stopForeground(Service.STOP_FOREGROUND_REMOVE);
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


