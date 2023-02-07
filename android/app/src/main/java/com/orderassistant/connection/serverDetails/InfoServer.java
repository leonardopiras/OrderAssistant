package com.orderassistant.connection.serverDetails;

import java.net.*;
import java.security.GuardedObject;
import java.util.HashMap;
import java.io.*;
import android.util.Log;
import com.orderassistant.models.*;
import com.orderassistant.connection.*;
import com.orderassistant.connection.server.OAWSServer;


public class InfoServer extends Thread implements OACheckable {

    public static final String TAG = "OA_InfoServer";
    public static final String infoMessage = "GetInfo";
    private ServerSocket serverSocket;
    protected OAWSServer wsServer;

    protected boolean isGood = true;

    public InfoServer(OAWSServer wsServer) {
        this.wsServer = wsServer;
        try {
            serverSocket = new ServerSocket(0);
            serverSocket.setReuseAddress(true);
        } catch (IOException e) {
            isGood = false;
            Log.e(TAG, "Error occured ", e);
        }
        start();
    }

    public int getPort() {
        return (serverSocket != null) ? serverSocket.getLocalPort() : -1;
    }

    public void run() {
        try {
            while (true) {
                new ClientHandler(serverSocket.accept()).start();
            }
        } catch (IOException e) {
            Log.e(TAG, "Error occured", e);
            isGood = false;
        } finally {
            stopServer();
        }
    }

    public void stopServer() {
        try {
            serverSocket.close();
        } catch (IOException e) {
            Log.e(TAG, "Error while closing: ", e);
        }
    }

    @Override 
    public boolean isGood() {
        return isGood;
    }

    private class ClientHandler extends Thread {
        private Socket clientSocket;
        private BufferedReader in;
        private ObjectOutputStream out;

        public ClientHandler(Socket socket) {
            this.clientSocket = socket;
        }

        public void run() {
            try {
                out = new ObjectOutputStream(clientSocket.getOutputStream());
                in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    if (inputLine.equals(infoMessage)) {
                        Log.d(TAG, "Sending server details");
                        ServerDetails data = getServerDetails();
                        out.writeObject(data);
                        break;
                    }
                }
                sleep(2000);
                in.close();
                out.close();
                clientSocket.close();

            } catch (Exception e) {
                Log.e(TAG, "Error on serving client", e);
                isGood = false;
            }
        }

        protected ServerDetails getServerDetails() {
            String[] clients = wsServer.getClientsNames(false);
            String ownerName = wsServer.getOwnerName();
            ItemTypeConfiguration config = wsServer.getItemTypeConfiguration();
            String serviceName = wsServer.getServiceName();
            return new ServerDetails(clients, ownerName, config, serviceName);
        }
    }
}
