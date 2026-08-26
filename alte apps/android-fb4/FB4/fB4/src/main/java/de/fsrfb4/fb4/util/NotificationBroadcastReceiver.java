package de.fsrfb4.fb4.util;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import androidx.preference.PreferenceManager;

import de.fsrfb4.fb4.service.NewsService;

/**
 * Created by oezgu on 23.04.2015.
 */
public class NotificationBroadcastReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if ("notification_cancelled".equals(action)) {
            SharedPreferences.Editor edit = PreferenceManager.getDefaultSharedPreferences(context).edit();
            edit.putInt(NewsService.NOTIF_COUNT, 0);
            edit.putString(NewsService.NOTIF_TEXT, "");
            edit.commit();
        }
    }
}
