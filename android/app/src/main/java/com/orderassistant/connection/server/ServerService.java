package com.orderassistant.connection.server;

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
import java.net.InetAddress;
import java.net.InetSocketAddress;

import com.orderassistant.models.WorkService;
import com.orderassistant.connection.serverDetails.InfoServer;
import com.orderassistant.connection.*;
import com.orderassistant.utils.Utils;
import com.orderassistant.storagemanager.Save;
import static com.orderassistant.connection.server.ServerService.StartUpReturnCode.*;


import java.util.TimerTask;
import java.util.HashMap;
import java.util.Timer;

import android.provider.Settings.Secure;

public class ServerService extends AbstractService {

    protected static final String CONFIG_NAME = "configurationName";
    protected static final String OWNER_NAME = "ownerName";
    protected static final String SERVICE_NAME = "serviceName";
    protected static final String OVERRIDE_WORKSERVICE = "overrideWorkService";

    protected String configurationName;
    protected String ownerName;
    protected String serviceName;
    protected WorkService overrideWorkService;
    protected InetSocketAddress wsAddress; 

    protected InfoServer infoServer;
    protected NsdServer nsdServer;
    protected OAWSServer  wsServer;

    public static enum StartUpReturnCode {
        ALL_GOOD(0), 
        GENERIC_ERROR(1),
        ERROR_DOUBLE_START(2),
        ERROR_NSD(3),
        ERROR_INFO_SERVER(4),
        ERROR_WIFI(5),
        ERROR_LOAD_PREVIOUS_WORKSERVICE(6),
        ERROR_BUSY_PORT(7);

        public     int val;
        StartUpReturnCode(int val) {
            this.val = val;
        } 
    }

    public static void start(Activity activity,
            String serviceName, String ownerName, String configurationName, OAModule module) {
        Intent intent = setIntent(activity, serviceName, ownerName, configurationName, null);
        startService(activity, intent, module);
    }

    public static void startWithWorkService(Activity activity, String ownerName,
            WorkService overrideWorkService, OAModule module) {
    
        overrideWorkService.adjustOrderCounter();
        String serviceName = overrideWorkService.getConfiguration().name;
        String configurationName = overrideWorkService.getConfiguration().name;
        Intent intent = setIntent(activity, serviceName, ownerName, configurationName, overrideWorkService);
        startService(activity, intent, module);

    }

    private static Intent setIntent(Activity activity, String serviceName, String ownerName,
            String configurationName, WorkService overrideWorkService) {
        Intent intent = new Intent(activity, ServerService.class);
        intent.putExtra(SERVICE_NAME, serviceName);
        intent.putExtra(OWNER_NAME, ownerName);
        intent.putExtra(CONFIG_NAME, configurationName);
        if (overrideWorkService != null)
            intent.putExtra(OVERRIDE_WORKSERVICE, overrideWorkService);
        return intent;
    }


    protected boolean setStartUpParamsFromIntent(Intent intent) {
        if (intent != null) {
            this.configurationName = intent.getStringExtra(CONFIG_NAME);
            this.ownerName = intent.getStringExtra(OWNER_NAME);
            this.serviceName = intent.getStringExtra(SERVICE_NAME);
            this.overrideWorkService = (WorkService) intent.getSerializableExtra(OVERRIDE_WORKSERVICE);
            return (configurationName != null && ownerName != null && serviceName != null);
        } else {
            Log.e(TAG, "Intent is null");
            return false;
        }
    }



    @Override
    protected boolean serviceOnCreate(Intent intent) {
        boolean result = false;
        StartUpReturnCode code = GENERIC_ERROR;
        if (setStartUpParamsFromIntent(intent)) {
            if (Utils.isWifiGood((Context) this) && setSocketAddress()) {
                if (startWSServer()) { 
                    if (startNsdInfoServers()) {
                        result = true; 
                        code = ALL_GOOD;
                        makeServiceForeground();
                    } else {
                        result = false;
                        code = isCheckableGood(nsdServer) ? ERROR_INFO_SERVER : ERROR_NSD;
                    } 
                } else {
                    if (wsServer != null)
                        code = wsServer.getStartUpReturnCode(); 
                }
            } else {
                code = ERROR_WIFI;
            } 
        }
        module.onFinishStartUpServer(result, code.val, wsServer);
        return result;
    }

    protected boolean setSocketAddress() {
        InetAddress inetAddr = Utils.getMyLocalIpv4();
        int port = Utils.findFreePort();
        if (inetAddr != null && port >= 0) {
            this.wsAddress = new InetSocketAddress(inetAddr, port);
            return wsAddress != null;
        } else 
            return false;
    }

    protected boolean startWSServer() {
        if (this.overrideWorkService != null)
            this.wsServer = new OAWSServer(serviceName, ownerName, overrideWorkService, module, wsAddress);
        else
            this.wsServer = new OAWSServer(serviceName, ownerName, configurationName, module, wsAddress);
        return isCheckableGood(wsServer);
    }

    protected boolean startNsdInfoServers() {
        this.infoServer = new InfoServer(wsServer);
        this.nsdServer = new NsdServer(this, infoServer.getPort(), serviceName, wsAddress);
        return isCheckableGood(nsdServer) && isCheckableGood(infoServer);
    }

    @Override
    protected void onStopService() {
        /* salva tutto */
        stopServers();
    }

    private void stopServers() {
        if (this.infoServer!= null)
            this.infoServer.stopServer();

        if (this.nsdServer!= null)
            this.nsdServer.stopNsdServer();
        if (this.wsServer!= null)
            stopWSServer();
        infoServer = null;
        nsdServer = null;
        wsServer = null;
    }

    private void stopWSServer() {
        WorkService workService = wsServer.getWorkService();
        if (workService != null && !workService.isCompleted())
            Save.saveWorkService(workService);
        wsServer.stopServer();
    }

    @Override
    public boolean isGood() {
        return isCheckableGood(wsServer) && isCheckableGood(nsdServer) && isCheckableGood(infoServer);
    }



    @Override
    protected String getNotificationTitle() {
        return serviceName;
    }

    @Override
    protected String getNotificationText(){
        return "Stai ospitando " +  serviceName +  ", non chiudere l'app";
    }
    
    public String getAddress() {
        return (wsServer != null) ? wsServer.getAddress().toString() : "serverIsNull";
    }

  

    public static boolean isServiceRunning() {
        boolean instanceNotNull = instance != null;
        boolean instanceIsServer = instanceNotNull && instance instanceof ServerService;
        boolean isRunningCorrectly = instanceNotNull && instance.isGood();

        Log.d(TAG, "InstanceNotNull " + instanceNotNull + "\nInstanceIsServer " +
         instanceIsServer + "\nInstanceRunningCorrectly " +  isRunningCorrectly);
        return instanceNotNull && instanceIsServer && isRunningCorrectly;
    }

    public static void setServiceName(String newName) {
        if (getInstance() != null && getInstance().wsServer != null) {
            getInstance().serviceName = newName;
            getInstance().wsServer.setServiceName(newName);
        }
    }

    public static ServerService getInstance() {
        return (ServerService) instance;
    }
}


