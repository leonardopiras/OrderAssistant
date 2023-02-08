package com.orderassistant.connection;

import com.orderassistant.models.*;

public interface OAConnection {

    public WorkService getWorkService();
    public ItemTypeConfiguration getItemTypeConfiguration();


}
