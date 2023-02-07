package com.orderassistant.connection.nsd;

import android.util.Log;

import android.net.nsd.NsdManager;
import android.net.nsd.NsdManager.*;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.orderassistant.models.Writable;


public class NsdData implements Writable {

    public static final String SERVICE_TYPE = "_ws._tcp";
    public static final String WS_PORT_ATTRIBUTE = "WSPort";
    public static final String INFO_SERVER_PORT_ATTRIBUTE = "InfoPort";
    public static final String ADDRESS_ATTRIBUTE = "address";


    public int port, infoPort;
    public String address, serviceName;

    public NsdData(int port, String address, String serviceName, int infoPort) {
        this.port = port;
        this.address = address;
        this.serviceName = serviceName;
        this.infoPort = infoPort;
    }

    @Override
    public WritableMap toWritableMap() {
        WritableMap params = new WritableNativeMap();
        params.putString("Address", address);
        params.putInt("Port", port);
        params.putString("Name", serviceName);
        params.putInt("InfoPort", infoPort);
        return params;
    }

}
