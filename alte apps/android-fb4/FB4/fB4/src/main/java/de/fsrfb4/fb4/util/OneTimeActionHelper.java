package de.fsrfb4.fb4.util;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

public final class OneTimeActionHelper {
    private static final String SP_NAME_ONE_TIME_ACTION = "OneTimeAction";

    private OneTimeActionHelper() { }

    /**
     * Executes an action if it was never executed before.
     *
     * @param context The given context.
     * @param oneTimeAction An instance of OneTimeAction which will be executed.
     * @param id The identifier of the action.
     * @return Returns true if the action was executed, otherwise false.
     */
    public static boolean doOnce(Context context, OneTimeAction oneTimeAction, String id) {
        SharedPreferences preferences = context.getSharedPreferences(SP_NAME_ONE_TIME_ACTION, Context.MODE_PRIVATE);
        if (!preferences.getBoolean(id, false)) {
            oneTimeAction.doOnce();
            SharedPreferences.Editor editor = preferences.edit();
            editor.putBoolean(id, true);
            editor.commit();
            Log.d("OneTimeActionHelper", "Executed action: " + id);
            return true;
        }
        return false;
    }

    public interface OneTimeAction {
        void doOnce();
    }
}
