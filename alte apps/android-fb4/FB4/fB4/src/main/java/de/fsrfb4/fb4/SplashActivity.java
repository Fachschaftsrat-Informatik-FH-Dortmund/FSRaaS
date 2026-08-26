package de.fsrfb4.fb4;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import androidx.preference.PreferenceManager;
import androidx.appcompat.app.AppCompatActivity;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.activities.MainActivity;
import de.fsrfb4.fb4.activities.WelcomePageActivity;

/**
 * Created by Özgür on 28.06.2016.
 */
@AndroidEntryPoint
public class SplashActivity extends AppCompatActivity {
    public static final String SP_KEY_FIRSTSTART = "FirstStart";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent;

        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(this);

        if (preferences.getBoolean(SP_KEY_FIRSTSTART, true)) {
            intent = new Intent(this, WelcomePageActivity.class);
        } else {
            intent = new Intent(this, MainActivity.class);
        }

        startActivity(intent);
        finish();
    }
}
