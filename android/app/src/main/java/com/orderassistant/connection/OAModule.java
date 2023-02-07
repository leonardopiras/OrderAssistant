package com.orderassistant.connection;

import com.orderassistant.connection.server.OAWSServer;
import com.orderassistant.connection.client.OAWSClient;
import com.orderassistant.models.*;

public interface OAModule {
    
    public void onWorkServiceUpdate(WorkService workService);
    public void onOrderUpdate(Order order);
    public void onOrderListsUpdate(OrderLists lists);
    public void onConfigurationUpdate(ItemTypeConfiguration configuration);
    public void onServerLost();
    public void onFinishStartUpClient(boolean good, int code, OAWSClient client);
    public void onFinishStartUpServer(boolean good, int code, OAWSServer server);
    public void onStopService();
}
