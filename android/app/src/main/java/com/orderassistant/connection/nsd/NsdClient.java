package com.orderassistant.connection.nsd;

import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import android.content.Context;
import com.facebook.react.bridge.Callback;

import android.net.nsd.NsdManager;
import android.net.nsd.NsdManager.*;
import android.net.nsd.NsdServiceInfo;
import android.util.Log;

import com.orderassistant.utils.Utils;

public class NsdClient {
    public static String TAG = "OA_NsdClient";
    public static DiscoveryListener mDiscoveryListener;
    public static ResolveListener mResolveListener;
    public static NsdClientListener nsdClientListener;
    public static Context context;
    public static InetAddress myIp;


    public static interface NsdClientListener {
        public abstract void onServerFound(NsdData nsdData);
    }

    public static void findServers(NsdClientListener listener, long millis, Context context, Callback cb) {
        nsdClientListener = listener;
        NsdClient.context  = context;
        NsdClient.myIp = Utils.getMyLocalIpv4();
        initializeDiscoveryListener();
        getNsdManager().discoverServices(NsdData.SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, mDiscoveryListener);
        new Thread(){
            @Override
            public void run(){
                try {
                    Thread.sleep(millis);
                } catch (Exception e) {}
                stopServiceDiscovery();
                cb.invoke();
            }
        }.start();
    }

    protected static NsdManager getNsdManager() {
        return (context != null) ? ((NsdManager)  context.getSystemService(Context.NSD_SERVICE)) : null;

    }

    /*****************************************
	 * Resolver
	 *****************************************/

    protected static void initializeResolveListener() {
        mResolveListener = new ResolveListener() {
            @Override
            public void onResolveFailed(NsdServiceInfo serviceInfo, int errorCode) {
                // Called when the resolve fails. Use the error code to debug.
                Log.e(TAG, "Resolve failed " + errorCode);
            }

            @Override
            public void onServiceResolved(NsdServiceInfo serviceInfo) {
                if (isMyIp(serviceInfo))
                    return;
                Map<String, byte[]> attributes = serviceInfo.getAttributes();
                String name = serviceInfo.getServiceName();
                String wsAddress = getStringFromServiceInfo(NsdData.ADDRESS_ATTRIBUTE, attributes); //serviceInfo.getHost().getHostAddress();
                int wsPort = serviceInfo.getPort(); //getIntFromServiceInfo(NsdData.WS_PORT_ATTRIBUTE, attributes);
                int infoPort = getIntFromServiceInfo(NsdData.INFO_SERVER_PORT_ATTRIBUTE, attributes);
                Log.d(TAG, "Resolve Succeeded. " + name + " " + wsAddress + " wsPort "+ wsPort + ". infoPort " + infoPort);
                nsdClientListener.onServerFound(new NsdData(wsPort, wsAddress, name, infoPort));
            }
        };
    }

    public static int getIntFromServiceInfo(String attribute, Map<String, byte[]> attributes) {
        return Integer.parseInt(getStringFromServiceInfo(attribute, attributes));
    }   
    public static String getStringFromServiceInfo(String attribute, Map<String, byte[]> attributes) {
        return new String(attributes.get(attribute), StandardCharsets.UTF_8);
    }

    public static boolean isMyIp(NsdServiceInfo serviceInfo) {
        InetAddress addr = serviceInfo.getHost();    
        return (myIp != null && addr != null && myIp.equals(addr));
    }

    /*****************************************
     * Discovery
     *****************************************/

    protected static void initializeDiscoveryListener() {
        mDiscoveryListener = new DiscoveryListener() {

            @Override
            public void onDiscoveryStarted(String regType) {
                Log.d(TAG, "Service discovery started");
            }

            @Override
            public void onServiceFound(NsdServiceInfo service) {
               

                if (service.getServiceType().contains(NsdData.SERVICE_TYPE)) {
                    // In teoria chiamavi mnsdManager.resolveService
                    // Però nsdManager diventa null inspiegabil
                    NsdManager nsdManager = getNsdManager();
                    if (nsdManager != null && !isMyServiceName(service)) {
                        initializeResolveListener();
                        Log.d(TAG, "Try resolving service " + service);
                        nsdManager.resolveService(service, mResolveListener);
                    }
                } else {
                    Log.d(TAG, "Unknown Service Type: " + service.getServiceType());
                }
            }

            @Override
            public void onServiceLost(NsdServiceInfo service) {
                // When the network service is no longer available.
                Log.e(TAG, "service lost" + service);
            }

            @Override
            public void onDiscoveryStopped(String serviceType) {
                Log.i(TAG, "Discovery stopped: " + serviceType);
            }

            @Override
            public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                Log.e(TAG, "Discovery failed: Error code:" + errorCode);
                stopServiceDiscovery();
            }

            @Override
            public void onStopDiscoveryFailed(String serviceType, int errorCode) {
                Log.e(TAG, "Discovery failed: Error code:" + errorCode);
                stopServiceDiscovery();
            }
        };
    }

    public static boolean isMyServiceName(NsdServiceInfo infos) {
        String myName = NsdServer.getServiceName();
        String serviceName = infos.getServiceName();
        return myName != null && serviceName != null && serviceName.equals(myName);

    }

    public static void stopServiceDiscovery() {
        NsdManager mNsdManager = getNsdManager();
        if (mNsdManager != null && mDiscoveryListener != null) {
            mNsdManager.stopServiceDiscovery(mDiscoveryListener);
            mDiscoveryListener = null;
        }
    }
}
