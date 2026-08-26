package de.fsrfb4.fb4.activities.ticket;

import android.content.Intent;
import android.os.Bundle;

import java.io.File;

import de.fsrfb4.fb4.util.TicketUtil;

/**
 * Created by Özgür on 29.01.2017.
 */

public class TicketViewActivity extends PdfViewerActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (!TicketUtil.ticketExists(this)) {
            Intent i = new Intent(TicketViewActivity.this, TicketDownloadActivity.class);
            startActivity(i);
            finish();
            return;
        }

        launchShortCutActivity();

        File ticket = TicketUtil.getTicket(this);
        showPDF(ticket);
    }

    private void launchShortCutActivity() {
        Intent i = new Intent(TicketViewActivity.this, ShortCutActivity.class);
        startActivity(i);
    }
}

