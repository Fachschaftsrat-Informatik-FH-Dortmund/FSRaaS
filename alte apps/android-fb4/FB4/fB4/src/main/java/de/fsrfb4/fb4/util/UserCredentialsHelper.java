package de.fsrfb4.fb4.util;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.preference.PreferenceManager;

import de.fsrfb4.fb4.R;
import lombok.AllArgsConstructor;

public final class UserCredentialsHelper {
    private UserCredentialsHelper() {
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public static UserCredentials getOdsCredentials(Context context) throws Exception {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        String encryptedUsername = sharedPreferences.getString(context.getString(R.string.preference_key_ods_username), null);
        String encryptedPassword = sharedPreferences.getString(context.getString(R.string.preference_key_ods_password), null);
        if (encryptedUsername != null && encryptedPassword != null) {
            Cryptography cryptography = new Cryptography();
            UserCredentials userCredentials = new UserCredentials(
                cryptography.decryptData(encryptedUsername),
                cryptography.decryptData(encryptedPassword));
            return userCredentials;
        }

        return null;
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public static void storeOdsCredentials(Context context, String username, String password) throws Exception {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        Cryptography cryptography = new Cryptography();

        String encryptedUsername = cryptography.encryptData(username);
        String encryptedPassword = cryptography.encryptData(password);
        editor.putString(context.getString(R.string.preference_key_ods_username), encryptedUsername);
        editor.putString(context.getString(R.string.preference_key_ods_password), encryptedPassword);
        editor.apply();
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public static void storeOdsCredentials(Context context, UserCredentials userCredentials) throws Exception {
        storeOdsCredentials(context, userCredentials.username, userCredentials.password);
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public static void deleteCredentials(Context context) {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.remove(context.getString(R.string.preference_key_ods_username))
            .remove(context.getString(R.string.preference_key_ods_password))
            .apply();
    }

    public static boolean credentialsExists(Context context) {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        return sharedPreferences.contains(context.getString(R.string.preference_key_ods_username)) &&
            sharedPreferences.contains(context.getString(R.string.preference_key_ods_password));
    }

    @AllArgsConstructor
    public static class UserCredentials {
        public String username;
        public String password;
    }
}
