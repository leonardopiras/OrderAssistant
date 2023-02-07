package com.orderassistant.connection;

import com.orderassistant.models.*;

public interface OAConnection {

    public String getUsername();
    public WorkService getWorkService();
    public ItemTypeConfiguration getItemTypeConfiguration();


}
