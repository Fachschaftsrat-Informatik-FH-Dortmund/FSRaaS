package de.fsrfb4.fb4.util;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import java.io.Serializable;

public interface ListItem extends Serializable {
    int getViewType();

    Object createBinding(LayoutInflater inflater, ViewGroup parent);
    
    View getRoot(Object binding);
    
    void bindView(Context context, Object binding);

    default LayoutInflater getInflater(Context context) {
        return LayoutInflater.from(context);
    }
}
