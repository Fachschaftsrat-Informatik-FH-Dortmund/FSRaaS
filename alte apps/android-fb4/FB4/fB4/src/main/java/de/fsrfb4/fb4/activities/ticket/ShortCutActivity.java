package de.fsrfb4.fb4.activities.ticket;

import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;

/**
 * Created by Özgür on 14.08.2016.
 */
@AndroidEntryPoint
public class ShortCutActivity extends AppCompatActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        Intent.ShortcutIconResource icon = Intent.ShortcutIconResource.fromContext(this, R.mipmap.ic_ticket_shortcut);

        Intent intent = new Intent();

        Intent launchIntent = new Intent(this, TicketViewActivity.class);
        intent.putExtra(Intent.EXTRA_SHORTCUT_INTENT, launchIntent);
        intent.putExtra(Intent.EXTRA_SHORTCUT_NAME, "NRW-Ticket");
        intent.putExtra(Intent.EXTRA_SHORTCUT_ICON_RESOURCE, icon);
        // intent.setFlags(Intent.FLAG_ACTIVITY_MULTIPLE_TASK|Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);

        setResult(RESULT_OK, intent);
        finish();
    }
}
