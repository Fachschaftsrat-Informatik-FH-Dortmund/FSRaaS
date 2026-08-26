package de.fsrfb4.fb4.util;

import android.content.Intent;
import android.os.Build;

import java.io.Serializable;

public final class IntentHelper {
    private IntentHelper() {
    }

    @SuppressWarnings("deprecation")
    public static <T extends Serializable> T getSerializable(Intent intent, String key, Class<T> clazz) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getSerializableExtra(key, clazz);
        } else {
            return (T) intent.getSerializableExtra(key);
        }
    }
}
