package com.orderassistant.connection;

import android.util.Log;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.io.ObjectInputStream;
import java.io.Serializable;
import java.nio.ByteBuffer;
import java.util.LinkedList;



public class OAMessage implements Serializable {

    public static final String tag = "OAMessage";

    public MsgType type; 
    public Object payload; 

    public static enum MsgType {
        STARTUP_ENV_REQUEST,
        STARTUP_ENV_RESPONSE,
        WORKSERVICE_REQUEST,
        WORKSERVICE_RESPONSE,
        WORKSERVICE_UPDATE,
        ORDER_LISTS_REQUEST,
        ORDER_LISTS_RESPONSE,
        ORDER_LISTS_UPDATE,
        ADD_ORDER_REQUEST,
        ADD_ORDER_RESPONSE,
        UPDATE_CONFIGURATION_REQUEST, 
        UPDATE_CONFIGURATION_RESPONSE,
        COMPLETE_ITEM_REQUEST,
        COMPLETE_ITEM_RESPONSE,
        PROCESS_ORDER_REQUEST,
        PROCESS_ORDER_RESPONSE,
        ORDER_UPDATE_REQUEST,
        ORDER_UPDATE_RESPONSE,
        ORDER_UPDATE,
        DELETE_ORDER_REQUEST,
        DELETE_ORDER_RESPONSE,
        PAY_ORDER_REQUEST,
        PAY_ORDER_RESPONSE,
        JOIN_ORDERS_REQUEST,
        JOIN_ORDERS_RESPONSE, 
        SERVER_STOPPED;
    }


    public OAMessage(MsgType type, Object object) {
        this.type = type;
        this.payload =  object;
    }

    public <T> T getPayload() {
        return (T) payload;
    }

    protected byte[] toByteArray() {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
                ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(this);
            oos.flush();
            return bos.toByteArray();
        } catch (Exception e) {
            Log.e(tag, "Unable to convert to byte array");
            return null;
        }
    }

    public static byte[] newMsg(MsgType msgType) {
        return newMsg(null, msgType);
    }

    public static byte[] newMsg(Object payload, MsgType msgType) {
        OAMessage msg = new OAMessage(msgType, payload);
        return msg.toByteArray();

    }

    public static OAMessage fromByteBuffer(ByteBuffer buffer) {
        if (buffer.hasArray())
            return (OAMessage) readByteArray(buffer.array());
        else
            Log.e(tag, "Buffer hasn't got an array");
        return null;
    }

    protected static Object readByteArray(byte[] arr) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(arr);
                ObjectInputStream ois = new ObjectInputStream(bis)) {
            return ois.readObject();
        } catch (Exception e) {
            Log.e(tag, "Unable to deserialize bytebuffer: " + e.getMessage());
        }
        return null;
    }

    public static class CompleteItemPayload implements Serializable {
        public boolean completed;
        public int orderId; 
        public int itemId;

        public CompleteItemPayload(boolean completed, int orderId, int itemId) {
            this.completed = completed;
            this.orderId = orderId;
            this.itemId = itemId;
        }
    }


}
