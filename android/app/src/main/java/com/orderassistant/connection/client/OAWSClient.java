package com.orderassistant.connection.client; // replace com.your-app-name with your app’s name

import android.util.Log;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Callback;

import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.*;
import java.io.IOException;



import org.java_websocket.server.*;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URISyntaxException;
import java.net.InetSocketAddress;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;
import java.net.Socket;
import javax.net.SocketFactory;
import java.net.UnknownHostException;
import java.io.IOException;

import com.orderassistant.connection.*;
import com.orderassistant.models.*;
import com.orderassistant.connection.*;
import com.orderassistant.connection.OAMessage.*;
import com.orderassistant.connection.client.ClientService.StartUpReturnCode;
import com.orderassistant.connection.server.AbstractWSServer;

import com.google.gson.Gson;

public class OAWSClient extends WebSocketClient implements OAConnection, OACheckable {

    protected static final String TAG = "OA_WSClient";
	protected static final int EXIT_CODE_SERVER_LOST = 1006; 
	protected static final long START_UP_TIMER_DELAY_IN_MILLIS = 6000L;
	protected static final int CONNECTON_LOST_TIMEOUT_IN_SEC = 5;

	public static OAWSClient instance;
	protected String username;

	protected OAModule module;

	protected WorkService workService;

	protected ConcurrentHashMap<MsgType, Callback> callbacksMap;

    static Gson gson = new Gson();

	protected ClientService service; 

	protected boolean isGood = true;

	protected String deviceId;


	public OAWSClient(String address, int port, String username, String deviceId, ClientService service, OAModule module) {
		super(createUri(address, port), createHeader(username, deviceId));
		this.callbacksMap = new ConcurrentHashMap<>();
		setConnectionLostTimeout(CONNECTON_LOST_TIMEOUT_IN_SEC);
		this.username = username;
		this.module = module; 
		this.service = service;
		this.deviceId = deviceId;


		connect();
		new Thread(() -> {
			try {Thread.sleep(START_UP_TIMER_DELAY_IN_MILLIS); } catch (Exception e) {}
 			if (service.onFinishStartUp(false, StartUpReturnCode.TIMER_EXCEDEED)) {
				this.isGood = false;
				Log.e(TAG, "StartUpTimer excedeed");
			}
		}).start();
	}

	private static URI createUri(String address, int port) {
		String stringUri = ("ws://" + address + ":" + Integer.toString(port)); 
		try {
			URI uri = new URI(stringUri);
			return uri;
		} catch (Exception e) {
			Log.e(TAG, "Unable to convert URI from address " + stringUri);
		}
		return null;
	}

	private static Map<String, String> createHeader(String username, String deviceId) {
		Map<String, String> httpHeaders = new HashMap<String, String>();
		httpHeaders.put(AbstractWSServer.HEADER_USERNAME, username);
		httpHeaders.put(AbstractWSServer.HEADER_DEVICE_ID, deviceId);
		return httpHeaders;
	}

	@Override
	public void onOpen(ServerHandshake handshakedata) {
		this.isGood = true;
		Log.d(TAG,"new connection opened");
		if (instance != null)
			instance.close();
		instance = this;
		send(MsgType.STARTUP_ENV_REQUEST);
	}

	@Override
	public void onClose(int code, String reason, boolean remote) {
		Log.d(TAG,"closed with exit code " + code + " additional info: " + reason);
		this.isGood = false;
		if (code == EXIT_CODE_SERVER_LOST) 
			invokeModuleOnServerLost();
				
	service.onFinishStartUp(false, StartUpReturnCode.GENERIC_ERROR);
	}

	@Override
	public void onError(Exception ex) {
		this.isGood = false;
		Log.e(TAG,"an error occurred: ", ex);

		if (ex.getMessage().contains("ECONNREFUSED")) {
			service.onFinishStartUp(false, StartUpReturnCode.ECONNREFUSED);
			return;
		}

		service.onFinishStartUp(false, StartUpReturnCode.GENERIC_ERROR);
	}

	@Override
	public void onMessage(String message) {
		Log.d(TAG,"received message: " + message);
	}

	public void stopClient() {
		close();
		removeInstance();
	}

	@Override
	public boolean isGood() {
		return isGood && isOpen();
	}



	/*****************************************
     * OAConnection implementation
     *****************************************/
	public String getUsername() {
		return username;
	}

	@Override
	public WorkService getWorkService() {
		return workService;
	}

	@Override
    public ItemTypeConfiguration getItemTypeConfiguration() {
        return workService.configuration;
    }

   /*****************************************
     * OAMainModule calls
     *****************************************/
	public void testThread() {
		for(int i = 0; i< 300; i++) {
			send(OAMessage.newMsg(MsgType.WORKSERVICE_REQUEST));
			try {
				Thread.sleep(100);
			} catch (Exception e) {}
		}

	}

	public void addOrderRequest(Order order, Callback addOrderResultCallback) {
		setWaitingCallback(MsgType.ADD_ORDER_RESPONSE, addOrderResultCallback);
		send(order, MsgType.ADD_ORDER_REQUEST);
	
	}

	public void setItemCompletedRequest(Integer orderId, Integer itemId, boolean completed, Callback cb) {
		CompleteItemPayload payload = new CompleteItemPayload(completed, orderId, itemId);
		setWaitingCallback(MsgType.COMPLETE_ITEM_RESPONSE, cb);
		send(payload, MsgType.COMPLETE_ITEM_REQUEST);
	}

	public void processOrderRequest(Integer orderId, Callback cb) {
		setWaitingCallback(MsgType.PROCESS_ORDER_RESPONSE, cb);
		send(orderId, MsgType.PROCESS_ORDER_REQUEST);
	}

	public void updateOrderRequest(Order order, Callback cb) {
		setWaitingCallback(MsgType.ORDER_UPDATE_RESPONSE, cb);
		send(order, MsgType.ORDER_UPDATE_REQUEST);
	}

	public void deleteOrderRequest(Integer orderId, Callback cb) {
		setWaitingCallback(MsgType.DELETE_ORDER_RESPONSE, cb);
		send(orderId, MsgType.DELETE_ORDER_REQUEST);
	}

	public void payOrderRequest(Integer orderId, Callback cb) {
		setWaitingCallback(MsgType.PAY_ORDER_RESPONSE, cb);
		send(orderId, MsgType.PAY_ORDER_REQUEST);
	}

	public void joinOrdersRequest(ArrayList<Integer> orderIds, Callback cb) {
		if (getWorkService().canJoinOrdersWithId(orderIds)) {
			setWaitingCallback(MsgType.JOIN_ORDERS_RESPONSE, cb);
			send(orderIds, MsgType.JOIN_ORDERS_REQUEST);
		} else 
			cb.invoke(false);
    }

	public void updateConfigurationRequest(ItemTypeConfiguration newConfig, Callback cb) {
		setWaitingCallback(MsgType.UPDATE_CONFIGURATION_RESPONSE, cb);
		send(newConfig, MsgType.UPDATE_CONFIGURATION_REQUEST);
	}


	/*****************************************
	 * On Message Handler
	 *****************************************/

	@Override
	public void onMessage(ByteBuffer buffer) {
		Log.d(TAG,"received ByteBuffer");
		OAMessage mess = OAMessage.fromByteBuffer(buffer);
		if (mess == null) 
			return; 
		Log.d(TAG, "ByteBuffer is " + mess.type);

		switch (mess.type) {
			case STARTUP_ENV_RESPONSE: 
				handleStartUpEnvResponse(mess);
				break;
			case WORKSERVICE_RESPONSE:
				handleWorkServiceResponse(mess);
				break;
			case WORKSERVICE_UPDATE: 
				handleWorkServiceUpdate(mess);
				break;
			case ORDER_LISTS_UPDATE: 
				handleOrderListsUpdate(mess);
				break;
			case ORDER_LISTS_RESPONSE:
				handleOrderListsResponse(mess);
				break;
			case ADD_ORDER_RESPONSE: 
				handleAddOrderResponse(mess);
				break;
			case UPDATE_CONFIGURATION_RESPONSE:
				handleUpdateConfigurationResponse(mess);
				break;
			case ORDER_UPDATE:
				handleOrderUpdate(mess);
				break;
			case COMPLETE_ITEM_RESPONSE: 
				handleCompleteItemResponse(mess);
				break;
			case PROCESS_ORDER_RESPONSE: 
				handleProcessOrderResponse(mess);
				break;
			case ORDER_UPDATE_RESPONSE:
				handleOrderUpdateResponse(mess);
				break;
			case DELETE_ORDER_RESPONSE: 
				handleDeleteOrderResponse(mess);
				break;
			case PAY_ORDER_RESPONSE: 
				handlePayOrderResponse(mess);
				break;
			case JOIN_ORDERS_RESPONSE:
				handleJoinOrdersResponse(mess);
				break;
			case SERVER_STOPPED:
				handleStopService(mess);
				break;
			


			case ADD_ORDER_REQUEST:
			case WORKSERVICE_REQUEST: 
			case UPDATE_CONFIGURATION_REQUEST:
			case COMPLETE_ITEM_REQUEST:
			case PROCESS_ORDER_REQUEST:
			case ORDER_UPDATE_REQUEST:
			case DELETE_ORDER_REQUEST:
			case PAY_ORDER_REQUEST:
			case JOIN_ORDERS_REQUEST:
			case ORDER_LISTS_REQUEST:
				Log.e(TAG, "Message not handled in client " + mess.type);
				break;
			default:
                Log.e(TAG, "Unknown message received " + mess.type);	
		}
	}

	protected void handleStartUpEnvResponse(OAMessage mess) {
		WorkService newWorkService = mess.<WorkService>getPayload();
		if (newWorkService != null) {
			workService = newWorkService;
			service.onFinishStartUp(true, StartUpReturnCode.ALL_GOOD);
		} else 
			service.onFinishStartUp(false, StartUpReturnCode.PARSER_ERROR);
	}

	protected void handleOrderListsResponse(OAMessage mess) {
		handleOrderListsUpdate(mess);
	}

	protected void handleOrderListsUpdate(OAMessage mess) {
		OrderLists orders = mess.<OrderLists>getPayload();
		Boolean res = getWorkService().updateLists(orders);
		invokeModuleOrderListsUpdate();		
	}

	protected void handleJoinOrdersResponse(OAMessage mess) {
		handleBooleanResponse(mess, MsgType.JOIN_ORDERS_RESPONSE, null);
	}

	protected void handlePayOrderResponse(OAMessage mess) {
		handleBooleanResponse(mess, MsgType.PAY_ORDER_RESPONSE, MsgType.ORDER_LISTS_REQUEST);
	}

	protected void handleCompleteItemResponse(OAMessage mess) {
		handleBooleanResponse(mess, MsgType.COMPLETE_ITEM_RESPONSE, null);
	}

	protected void handleDeleteOrderResponse(OAMessage mess) {
		handleBooleanResponse(mess, MsgType.DELETE_ORDER_RESPONSE, MsgType.ORDER_LISTS_REQUEST);
	}

	protected void handleOrderUpdateResponse(OAMessage mess) {
		handleBooleanResponse(mess, MsgType.ORDER_UPDATE_RESPONSE, MsgType.ORDER_LISTS_REQUEST);
	}

	protected void handleProcessOrderResponse(OAMessage mess) {
		handleBooleanResponse(mess, MsgType.PROCESS_ORDER_RESPONSE, MsgType.ORDER_LISTS_REQUEST);
	}

	protected void handleUpdateConfigurationResponse(OAMessage mess) {
		handleBooleanResponse(mess, MsgType.UPDATE_CONFIGURATION_RESPONSE, null);
	}

	protected void handleOrderUpdate(OAMessage mess) {
		Order order = mess.<Order>getPayload();
		if (getWorkService().updateOrder(order))
			invokeModuleOrderUpdate(order);
		else
			send(MsgType.ORDER_LISTS_REQUEST);
	}


	protected void handleAddOrderResponse(OAMessage mess) {
		Boolean result = mess.<Boolean>getPayload();
		Callback addOrderResultCallback = getCallback(MsgType.ADD_ORDER_RESPONSE);
		if (addOrderResultCallback != null)
			addOrderResultCallback.invoke(result);
	}

	protected void handleWorkServiceUpdate(OAMessage mess) {
		updateWorkService(mess);
	}

	protected void handleWorkServiceResponse(OAMessage mess) {
		updateWorkService(mess);
	}

	protected void handleStopService(OAMessage mess) {
		WorkService newWorkService = mess.<WorkService>getPayload();
		workService = newWorkService;
		invokeModuleOnServerLost();
	}

	protected void updateWorkService(OAMessage mess) {
		WorkService newWorkService = mess.<WorkService>getPayload();
		workService = newWorkService;
		invokeModuleWorkServiceUpdate();
	}

	private void handleBooleanResponse(OAMessage mess, MsgType cbType, MsgType msgOnResultFail) {
		Boolean result = mess.<Boolean>getPayload();
		if (!result && msgOnResultFail != null)
			send(msgOnResultFail);	
		invokeCallBack(cbType, result);
	}


	/*****************************************
	 * OAModule invokes
	 *****************************************/

	protected void invokeModuleWorkServiceUpdate() {
		if (module != null)
			module.onWorkServiceUpdate(workService);
		else 
			Log.e(TAG, "Module not bound");
	}

	protected void invokeModuleOrderUpdate(Order order) {
		if (module != null)
			module.onOrderUpdate(order);
		else 
			Log.e(TAG, "Module not bound");
	}

	protected void invokeModuleOrderListsUpdate() {
		if (module != null)
			module.onOrderListsUpdate(getWorkService().getOrderLists());
		else
			Log.e(TAG, "Module not bound");
	}

	protected void invokeModuleConfigurationUpdate() {
		if (module != null)
			module.onConfigurationUpdate(getWorkService().configuration);
		else
			Log.e(TAG, "Module not bound");
	}	

	protected void invokeModuleOnServerLost() {
		if (module != null)
			module.onServerLost();
		else
			Log.e(TAG, "Module not bound");
	}




	/*****************************************
	 * Callback handle
	 *****************************************/

	protected boolean invokeCallBack(MsgType type, Boolean result) {
		Callback cb = getCallback(type);
		if (cb != null)
			cb.invoke(result);
		return cb != null;
	}

	protected Callback getCallback(MsgType type) {
		if (callbacksMap.containsKey(type))
			return callbacksMap.remove(type);
		else {
			Log.e(TAG, "Trying to retrive a callback that does not exist anymore");
			return null;
		}
	}

	protected void setWaitingCallback(MsgType type, Callback cb) {
		if (callbacksMap.put(type, cb) != null)
			Log.e(TAG, "Callback override on " + type);
	}


	/*****************************************
     * Various
     *****************************************/

	 protected void send(Object object, MsgType msgType) {
		send(OAMessage.newMsg(object, msgType));
	 }

	 protected void send(MsgType msgType) {
		send(OAMessage.newMsg(msgType));
	 }

	 private void removeInstance() {
		if (instance == this)
			instance = null;
	} 
}