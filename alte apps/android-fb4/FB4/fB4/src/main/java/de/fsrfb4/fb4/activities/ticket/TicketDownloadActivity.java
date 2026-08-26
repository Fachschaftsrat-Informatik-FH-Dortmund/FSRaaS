package de.fsrfb4.fb4.activities.ticket;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.MenuItem;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.navigation.NavController;
import androidx.navigation.Navigation;

import com.afollestad.materialdialogs.MaterialDialog;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.firebase.messaging.FirebaseMessaging;

import java.io.IOException;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.firebase.DefaultFirebaseMessagingService;
import de.fsrfb4.fb4.fragments.ticket.LoginFragmentArgs;
import de.fsrfb4.fb4.util.TicketUtil;

@AndroidEntryPoint
public class TicketDownloadActivity extends AppCompatActivity {
    private static final int REQUEST_CODE_SELECTTICKET = 1;

    public static final String INTENT_EXTRA_ONLY_LOGIN = "only_login";

    private Toolbar toolbar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ticket_download);
        
        toolbar = findViewById(R.id.toolbar);

        setSupportActionBar(toolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        getSupportActionBar().setHomeButtonEnabled(true);
        getSupportActionBar().setIcon(android.R.color.transparent);

        Bundle extras = getIntent().getExtras();
        boolean onlyLogin = extras != null && extras.getBoolean(INTENT_EXTRA_ONLY_LOGIN, false);
        Bundle args = new LoginFragmentArgs.Builder(onlyLogin)
            .build()
            .toBundle();

        NavController navController = Navigation.findNavController(this, R.id.nav_host_fragment);
        navController.setGraph(R.navigation.nav_graph, args);
    }

    public void selectFile() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/pdf");

        startActivityForResult(intent, REQUEST_CODE_SELECTTICKET);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent resultData) {
        if (requestCode == REQUEST_CODE_SELECTTICKET) {
            if (resultCode == Activity.RESULT_OK) {
                if (resultData != null) {
                    Uri uri = resultData.getData();
                    copyTicket(uri);
                }
            }
        } else {
            super.onActivityResult(requestCode, resultCode, resultData);
        }
    }

    private void copyTicket(Uri uri) {
        MaterialDialog pd = new MaterialDialog.Builder(this)
            .content(getString(R.string.copying_ticket))
            .progress(true, 0)
            .cancelable(false)
            .show();

        new Thread(() -> {
            try {
                boolean success = TicketUtil.saveTicketAsFile(this, uri);
                new Handler(Looper.getMainLooper()).post(() -> {
                    if (success) {
                        ticketAdded();
                    } else {
                        Toast.makeText(this, R.string.ticket_konnte_nicht_kopiert_werden, Toast.LENGTH_LONG).show();
                    }
                    pd.dismiss();
                });
            } catch (IOException e) {
                new Handler(Looper.getMainLooper()).post(() -> {
                    FirebaseCrashlytics.getInstance().recordException(e);
                    Toast.makeText(this, getString(R.string.ticket_konnte_nicht_kopiert_werden) + ": " + e.getMessage(), Toast.LENGTH_LONG).show();
                    pd.dismiss();
                });
            }
        }).start();
    }

    private void ticketAdded() {
        if (TicketUtil.ticketExists(this)) {
            Toast.makeText(this, R.string.ticket_copied, Toast.LENGTH_LONG).show();
            launchShortCutActivity();
            FirebaseMessaging.getInstance().subscribeToTopic(DefaultFirebaseMessagingService.TOPIC_TICKET);

            Intent i = new Intent(this, TicketViewActivity.class);
            startActivity(i);
            finish();
        }
    }

    private void launchShortCutActivity() {
        Intent i = new Intent(this, ShortCutActivity.class);
        startActivity(i);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                onBackPressed();
                break;
        }

        return false;
    }
}
