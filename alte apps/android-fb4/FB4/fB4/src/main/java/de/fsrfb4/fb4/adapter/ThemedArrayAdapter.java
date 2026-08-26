package de.fsrfb4.fb4.adapter;

import android.content.Context;
import android.content.res.Resources;
import androidx.annotation.LayoutRes;
import androidx.annotation.Nullable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import androidx.appcompat.widget.ThemedSpinnerAdapter;

import java.util.List;

/**
 * Created by larsgrefer on 03.10.16.
 */

public class ThemedArrayAdapter<T> extends ArrayAdapter<T> implements ThemedSpinnerAdapter {

    private ThemedSpinnerAdapter.Helper helper;

    @LayoutRes
    private int resource;

    public ThemedArrayAdapter(Context context, int resource) {
        super(context, resource);
        this.resource = resource;
        helper = new Helper(context);
    }

    public ThemedArrayAdapter(Context context, int resource, int textViewResourceId) {
        super(context, resource, textViewResourceId);
        this.resource = resource;
        helper = new Helper(context);
    }

    public ThemedArrayAdapter(Context context, int resource, T[] objects) {
        super(context, resource, objects);
        this.resource = resource;
        helper = new Helper(context);
    }

    public ThemedArrayAdapter(Context context, int resource, int textViewResourceId, T[] objects) {
        super(context, resource, textViewResourceId, objects);
        this.resource = resource;
        helper = new Helper(context);
    }

    public ThemedArrayAdapter(Context context, int resource, List<T> objects) {
        super(context, resource, objects);
        this.resource = resource;
        helper = new Helper(context);
    }

    public ThemedArrayAdapter(Context context, int resource, int textViewResourceId, List<T> objects) {
        super(context, resource, textViewResourceId, objects);
        this.resource = resource;
        helper = new Helper(context);
    }

    @Override
    public void setDropDownViewTheme(Resources.Theme theme) {
        helper.setDropDownViewTheme(theme);
    }

    @Nullable
    @Override
    public Resources.Theme getDropDownViewTheme() {
        return helper.getDropDownViewTheme();
    }

    @Override
    public void setDropDownViewResource(int resource) {
        super.setDropDownViewResource(resource);
        this.resource = resource;
    }

    @Override
    public View getDropDownView(int position, View convertView, ViewGroup parent) {
        if (convertView == null) {
            convertView = helper.getDropDownViewInflater().inflate(resource, parent, false);
        }
        return super.getDropDownView(position, convertView, parent);
    }
}
