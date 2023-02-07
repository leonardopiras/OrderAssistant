package com.orderassistant.utils; 

import java.io.IOException;
import java.net.Inet6Address;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.List;
import java.util.ArrayList;

import  javax.annotation.Nullable;
import android.content.Context;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.util.Log;
import android.net.wifi.WifiInfo;
import android.net.NetworkRequest;


public class Utils {

    public static final String WIFI_INTERFACE_NAME = "wlan";

    public static InetAddress getMyLocalIpv4() {
        InetAddress ip = null;
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            
            while (interfaces.hasMoreElements()) {
                // rmnet0 is when mobile date only app is active
                // swlan0 hotspot
                // Interface name is derived from linux
                NetworkInterface iface = interfaces.nextElement();
                // filters out 127.0.0.1 and inactive interfaces
                if (iface.isLoopback() || !iface.isUp())
                    continue;

                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();

                    if (addr instanceof Inet4Address && iface.getName().startsWith(WIFI_INTERFACE_NAME)) {
                        return addr;
                    }
                }
            }
        } catch (SocketException e) {}
        return ip;
    }

    public static String getMyIpv4() {
        InetAddress ip = getMyLocalIpv4();
        return (ip != null) ? ip.getHostAddress() : "Not found";
    }


    public static boolean isWifiGood(Context context) {
        ConnectivityManager cm = context.getSystemService(ConnectivityManager.class);
        Network net = cm.getActiveNetwork();
        if (net == null)
            return false;

        NetworkCapabilities caps = cm.getNetworkCapabilities(net);

        boolean hasTransport = caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
        //Check intern over wifi
        return hasTransport;
    }



    public static int findFreePort() {
        int port = 0;
        try (ServerSocket socket = new ServerSocket(0)) {
            // Disable timeout and reuse address after closing the socket.
            socket.setReuseAddress(true);
            port = socket.getLocalPort();
        } catch (IOException ignored) {
            port = -1;
        }
        return port;
    }


    public static void printPidTid(String tag) {
        Log.d(tag, "(Tid: " + android.os.Process.myTid() +"), (Pid: " + android.os.Process.myPid() + ")");
    }

    public static void sendEvent(ReactApplicationContext reactContext, String eventName, @Nullable WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }
}
