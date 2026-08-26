package de.fsrfb4.fb4.util;

import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import androidx.annotation.Nullable;
import android.util.Log;

/**
 * Created by oezgu on 11.05.2016.
 */
public class RemoteService extends Service {

    private Handler myHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            switch (msg.what) {
                default:
                    Log.d("Nix", "Nix");
            }
        }
    };

    Messenger messenger = new Messenger(myHandler);

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return messenger.getBinder();
    }
}
