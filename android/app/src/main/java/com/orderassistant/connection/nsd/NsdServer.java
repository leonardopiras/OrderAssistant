package com.orderassistant.connection.nsd;

import java.net.ServerSocket;
import java.net.Socket;
import android.util.Log;

import android.net.nsd.NsdManager;
import android.net.nsd.NsdManager.RegistrationListener;
import android.net.nsd.NsdServiceInfo;
import android.content.Context;
import com.orderassistant.utils.Utils;
import com.orderassistant.connection.server.ServerService;
import com.orderassistant.connection.*;

import java.net.InetAddress;
import java.net.InetSocketAddress;


public class NsdServer implements OACheckable {
    public String serviceName = "NsdServer";

    public static final String TAG = "OA_NsdServer";

    public RegistrationListener mRegistrationListener;
    public NsdManager mNsdManager;

    protected boolean isGood = true;
    public static NsdServer instance; 

    /**
     * Start the network service discovery server
     * @param context
     * @param wsPort webSocketServer port
     */
    public NsdServer(Context context, int infoServerPort, String serviceName, InetSocketAddress wsSocketAddress) {
        ServerSocket serverSocket = null;
        instance = this; 
        this.serviceName = serviceName;
        NsdServiceInfo serviceInfo = serviceInfoSetUp(serviceName, infoServerPort, wsSocketAddress);
        mRegistrationListener = registrationListenerSetUp();

        mNsdManager = (NsdManager) context.getSystemService(Context.NSD_SERVICE);
        mNsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, mRegistrationListener);
    }

    private RegistrationListener registrationListenerSetUp() {
        return  new RegistrationListener() {

            @Override
            public void onServiceRegistered(NsdServiceInfo sInfo) {
                isGood = true; 
                String newName = sInfo.getServiceName();

                InetAddress addr = sInfo.getHost();

                Log.d(TAG, "Registered: " + newName);
                if (!serviceName.equals(newName)) {
                    serviceName = newName;
                    ServerService.setServiceName(newName);
                    }
            }
    
            @Override
            public void onRegistrationFailed(NsdServiceInfo sInfo, int errorCode) {
                isGood = false;
                Log.e(TAG, "Registration failed (" + sInfo.getServiceName() + "), errorcode: " + errorCode);
            }

            @Override
            public void onServiceUnregistered(NsdServiceInfo sInfo) {
                isGood = false;
                // Service has been unregistered. This only happens when you call
                // NsdManager.unregisterService() and pass in this listener.
                Log.d(TAG, "Unregistered: " + sInfo.getServiceName());
            }

            @Override
            public void onUnregistrationFailed(NsdServiceInfo sInfo, int errorCode) {
                Log.e(TAG, "Unregistration failed (" + sInfo.getServiceName()+ "), errorcode: " + errorCode);
            }
        };
    }

    private NsdServiceInfo serviceInfoSetUp(String serviceName, int infoServerPort, InetSocketAddress wsSocketAddress) {
        NsdServiceInfo serviceInfo = new NsdServiceInfo();
        String address = wsSocketAddress.getAddress().getHostAddress();
        serviceInfo.setServiceName(serviceName);
        serviceInfo.setPort(wsSocketAddress.getPort());
        serviceInfo.setServiceType(NsdData.SERVICE_TYPE);
        serviceInfo.setAttribute(NsdData.INFO_SERVER_PORT_ATTRIBUTE, String.valueOf(infoServerPort));
        serviceInfo.setAttribute(NsdData.ADDRESS_ATTRIBUTE, address);
        
        return serviceInfo;
    }

    @Override 
    public boolean isGood() {
        return this.isGood;
    }

    public boolean stopNsdServer() {
        Log.d(TAG, "Stopping nsd server");
        if (mNsdManager != null && mRegistrationListener != null) {
            mNsdManager.unregisterService(mRegistrationListener);
            mRegistrationListener = null;
            instance = null;
            return true;
        }
        return false; 
    }

    public static String getServiceName() {
        return (instance != null) ? instance.serviceName : null;
    }



}
