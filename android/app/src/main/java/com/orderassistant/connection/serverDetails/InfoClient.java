package com.orderassistant.connection.serverDetails;


import java.net.*;
import java.util.Timer;
import java.util.TimerTask;


import java.io.*;
import android.util.Log;
import com.orderassistant.models.*;

public class InfoClient {
    public static final String TAG = "OA_infoClient";
  

    protected static boolean hasException;
    protected static ServerDetails details;

    protected static final long NO_TIMEOUT = -1;


    public static ServerDetails getServerDetails(String serverInfoAddress, 
    int serverInfoPort, long timeout) {
        Socket clientSocket;
        PrintWriter out;
        ObjectInputStream in;

        try {
            InetAddress addr = InetAddress.getByName(serverInfoAddress);
            clientSocket = new Socket(addr, serverInfoPort);
            out = new PrintWriter(clientSocket.getOutputStream(), true);
            in = new ObjectInputStream(clientSocket.getInputStream());
            ServerDetails  info = sendMessage(out, in, timeout);
            stopConnection(in, out, clientSocket);
            return info;
        } catch (Throwable e) {
            Log.e(TAG, "Error when initializing connection: " + e.getMessage());
        }
        return null;
    }

    public static ServerDetails getServerDetails(String serverInfoAddress, int serverInfoPort) {
       return getServerDetails(serverInfoAddress, serverInfoPort, NO_TIMEOUT);
    }

    public static ServerDetails sendMessage(PrintWriter out, ObjectInputStream in, long timeout) {
        setHasException(false);
        setDetails(null);
        try {
            out.println(InfoServer.infoMessage);

            new Thread() {
                public void run() {
                    try {
                        ServerDetails infos = (ServerDetails) in.readObject();     
                        setDetails(infos);   
                    } catch (Exception e) { 
                        Log.d(TAG, "Unable to deserialize object: ", e);
                        setHasException(true);
                    }
            }}.start();
            //in.available() sempre 0 

            if (timeout > 0) {
                long steps = 10;
                long sleepStep = timeout / steps;
                while(details == null && steps > 0) {
                    Log.d(TAG, "Waiting for server details step: " + steps);
                    Thread.sleep(sleepStep);
                    steps--;
                }
                if (steps <= 0)
                    Log.d(TAG, "Timeout excedeed");
            } else {
                while(details == null && !hasException) {
                    Log.d(TAG, "Waiting for server details without timeout");
                    Thread.sleep(500);
                }
            }
            if (details == null)
                    Log.d(TAG, "Details not received");
            else 
                Log.d(TAG, "Details received: " + details.toString());

            return details;
        } catch (Exception e) {
            return null;
        }
    }

    protected static void setDetails(ServerDetails details) {
        InfoClient.details = details;
    }

    protected static void setHasException(boolean value) {
        InfoClient.hasException = value;
    }



    private static void stopConnection(ObjectInputStream in, PrintWriter out, Socket clientSocket) {
        try {
            in.close();
            out.close();
            clientSocket.close();
        } catch (IOException e) {
            Log.e(TAG, "error when closing " + e.getMessage());
        }
    }
}
