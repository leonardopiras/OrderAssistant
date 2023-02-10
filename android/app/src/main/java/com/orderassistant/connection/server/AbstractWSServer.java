package com.orderassistant.connection.server;

import android.util.Log;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.concurrent.ConcurrentHashMap;
import java.util.*;

import com.orderassistant.utils.Utils;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.java_websocket.framing.CloseFrame;
import org.java_websocket.exceptions.InvalidDataException;
import org.java_websocket.handshake.ServerHandshakeBuilder;
import org.java_websocket.drafts.Draft;

import java.net.InetSocketAddress; // With ports
import java.net.Inet4Address; // No ports
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.UnknownHostException;
import java.util.function.Function;

import android.os.StrictMode;


import com.google.gson.Gson;
import com.orderassistant.connection.*;

import java.net.HttpCookie;


public abstract class AbstractWSServer extends WebSocketServer implements OACheckable {

	public static final String HEADER_USERNAME = "username";
	public static final String HEADER_DEVICE_ID = "devId";


    protected Map<String, ClientInfo> clients;
    protected String serviceName, ownerName; 
    protected static String TAG ="OA_WSServer";
    public static AbstractWSServer instance; 
    protected OAModule module;

    protected boolean isGood = false;
    protected boolean errorDoubleStart = false;
    protected boolean errorBusyPort = false;

    private static Gson gson = new Gson();


    protected abstract void onAddNewClient(WebSocket conn, ClientHandshake handshake, String newClientName);
    protected abstract void onRemoveClient(WebSocket conn, String leavingClientName);
    protected abstract void onStopServer();
    protected abstract void onStartServer();

    private static class ClientInfo {
        String deviceId;
        WebSocket webSocket;

        ClientInfo(String deviceId, WebSocket webSocket) {
            this.deviceId = deviceId;
            this.webSocket = webSocket;
        }
    }


    protected AbstractWSServer(String serviceName, String ownerName, InetSocketAddress address) {
        super(address);
        this.serviceName = serviceName;
        this.ownerName = ownerName;
        this.clients = new ConcurrentHashMap<>();
        setTcpNoDelay(true);
        setReuseAddr(true); // Permette di riutilizzare immediatamente l'indirizzo se la connessione cade
        this.isGood = tryStart();
    }

    private boolean tryStart() {
        try {
            start();
            return true;
        } catch (java.lang.IllegalStateException ex) {
            this.errorDoubleStart = true;
            // Every start needs a new thread
            Log.e(TAG, "Errors on WSServer start, maybe server already started: ", ex);
            try {
                stop();
            } catch (java.lang.InterruptedException e1) {}
        }
        return false;
    }

    @Override
  public ServerHandshakeBuilder onWebsocketHandshakeReceivedAsServer(WebSocket conn, Draft draft,
      ClientHandshake request) throws InvalidDataException {
    ServerHandshakeBuilder builder = super
        .onWebsocketHandshakeReceivedAsServer(conn, draft, request);
    
    Log.d(TAG, "Receiving connection request from " + request);
    
    //If there is a Origin Field, it has to be localhost:8887
    if (request.hasFieldValue("Origin")) {
        if (!request.getFieldValue("Origin").equals("localhost:8887")) {
          throw new InvalidDataException(CloseFrame.POLICY_VALIDATION, "Not accepted!");
        }
    }

    if (!request.hasFieldValue(HEADER_DEVICE_ID) || !request.hasFieldValue(HEADER_USERNAME)) {
        throw new InvalidDataException(CloseFrame.POLICY_VALIDATION, "Not accepted! Header fields not found");
    }
    String newUsername = getClientNameFromHandshake(request);
    boolean errorName = newUsername.equals(ownerName);
    if (!errorName && clients.containsKey(newUsername)) 
        errorName = handleExistingUsername(conn, newUsername, request);    
    if (errorName) {
        Log.d(TAG, "Refusing " + newUsername);
        throw new InvalidDataException(CloseFrame.REFUSE, "Username already exist!");    
    }
    return builder;    
}
    private boolean handleExistingUsername(WebSocket newConn, String existingUsername, ClientHandshake handshake) {
        boolean errorName = true;
        String oldDeviceId = clients.get(existingUsername).deviceId;
        String newDeviceId = getDeviceIDFromHandshake(handshake);
        if (oldDeviceId.equals(newDeviceId)) { // Same device, delete old to accept new
            removeClient(clients.get(existingUsername).webSocket);
            errorName = false;
        }
        return errorName;
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        String newClient = addNewClient(conn, handshake);
        String addr = getClientAddressFromWebSocketConn(conn);
        Log.d(TAG, newClient + " entered the room!");
        onAddNewClient(conn, handshake, newClient);
    }

    private String addNewClient(WebSocket conn, ClientHandshake handshake) {
        String newClient = getClientNameFromHandshake(handshake);
        String deviceId = getDeviceIDFromHandshake(handshake);
        addConnection(conn);
        conn.setAttachment(newClient);
        clients.put(newClient, new ClientInfo(deviceId, conn));
        return newClient;
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        Log.d(TAG, "Someone is leaving the room: " + reason);
        logClients();
        String leavingClient = removeClient(conn);
        onRemoveClient(conn, leavingClient);
    }

    private String removeClient(WebSocket conn) {
        removeConnection(conn);
        String leavingClient = conn.<String>getAttachment();
        if (clients.containsKey(leavingClient)) {
            clients.remove(leavingClient);
            Log.d(TAG, leavingClient + " correctly removed!");
        } else 
            Log.d(TAG,"Unable to remove " +  leavingClient);
        return leavingClient;
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        // final Frame obj = gson.fromJson(message, Frame.class);
        // if (obj != null) {

        // }
        Log.d(TAG, message);
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        Log.e(TAG, "Errors occured", ex);
        if (conn != null) {
            // some errors like port binding failed may not be assignable to a specific
            // websocket
        } else if (ex.getMessage().equals("Address already in use")) {
            errorBusyPort = true;
            Log.e(TAG, "Error: Trying to start WSServer on a busy port");  
        } 
        isGood = false;  
    }

    @Override
    public void onStart() {
        Log.d(TAG, "Server started! Port: " + getPort() + "\nAddress " + getAddress());
        setConnectionLostTimeout(0);
        instance = this;
        onStartServer();
    }

    public void stopServer() {
        instance = null;
        onStopServer();
        try {
            stop();
        } catch (java.lang.InterruptedException e) {
            Log.e(TAG, "Errors on service stop: " + e.getMessage());
        }
    }

    /*****************************************
     * OACheckable implementation
     *****************************************/

     @Override
     public boolean isGood() {
         return this.isGood;
     }

    protected void send(byte[] data, WebSocket conn) {
        broadcast(data, List.of(conn));
    }  
    
    protected static String getClientAddressFromWebSocketConn(WebSocket conn) {
        return conn.getRemoteSocketAddress().getAddress().toString();
    }

    protected String getClientNameFromHandshake(ClientHandshake handshake) {
        return handshake.getFieldValue(HEADER_USERNAME);
    }   
    protected String getDeviceIDFromHandshake(ClientHandshake handshake) {
        return handshake.getFieldValue(HEADER_DEVICE_ID);
    }



    public Inet4Address getAddressFromWebSocketNoPort(WebSocket ws) {
        return (Inet4Address) getAddressFromWebSocketWithPort(ws).getAddress();
    }

    public InetSocketAddress getAddressFromWebSocketWithPort(WebSocket ws) {
        return ws.getRemoteSocketAddress();
    }

    protected void logClients() {
        if (clients != null && clients.size() > 0) {
            String s = clients.keySet().stream()
                    .reduce("", (tot, client) -> tot = tot + "," + client);
            Log.d(TAG, s);
        } else if (clients == null)
            Log.e(TAG, "Clients is null");
        else 
            Log.d(TAG, "Empty client");
    }


    public String[] getClientsNames(boolean includeOwner) {
        if (includeOwner) {
            List<String> list = new ArrayList<>(clients.keySet());
            list.add(ownerName);
            return list.toArray(new String[0]);
        }
        else 
            return clients.keySet().toArray(new String[0]);
    }

    public String getServiceName() {
        return this.serviceName;
    }

    public String getOwnerName() {
        return this.ownerName;
    }

    public void setServiceName(String newName) {
        instance.serviceName = newName;
    }
}