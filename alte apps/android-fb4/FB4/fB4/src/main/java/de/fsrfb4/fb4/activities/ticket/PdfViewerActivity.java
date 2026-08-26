package de.fsrfb4.fb4.activities.ticket;

import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import androidx.preference.PreferenceManager;
import androidx.appcompat.app.AppCompatActivity;
import android.util.Log;
import android.view.WindowManager;
import android.widget.Toast;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.io.File;
import java.io.FileNotFoundException;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.ActivityPdfViewerBinding;
import de.fsrfb4.fb4.util.TicketUtil;

@AndroidEntryPoint
public class PdfViewerActivity extends AppCompatActivity {
    public static final String PDF_URI = "PDF";
    
    private ActivityPdfViewerBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityPdfViewerBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        String path = getIntent().getStringExtra(PDF_URI);
        if (path != null) {
            try {
                showPDF(path);
            } catch (FileNotFoundException e) {
                FirebaseCrashlytics.getInstance().recordException(e);
            }
        }
    }

    public void showPDF(String path) throws FileNotFoundException {
        File f = new File(path);
        if (!f.exists()) {
            throw new FileNotFoundException(getString(R.string.ticket_nicht_gefunden));
        }

        showPDF(f);
    }

    public void showPDF(File f) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(this);

        boolean retry = false;
        do {
            try {
                int divisor = retry ? 2 : 1;
                Bitmap bitmap = Bitmap.createBitmap(TicketUtil.TICKET_DISPLAY_RESOLUTION[0] / divisor, TicketUtil.TICKET_DISPLAY_RESOLUTION[1] / divisor, Bitmap.Config.ARGB_8888);
                PdfRenderer renderer = new PdfRenderer(ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY));

                Canvas canvas = new Canvas(bitmap);
                canvas.drawColor(Color.WHITE);
                canvas.drawBitmap(bitmap, 0, 0, null);
                renderer.openPage(0).render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);

                int[] rect = TicketUtil.getTicketRect(this);
                if (preferences.getBoolean(getString(R.string.preference_key_ticket_zoom), getResources().getBoolean(R.bool.preference_default_ticket_zoom)) && rect != null && rect.length == 4) {
                    bitmap = Bitmap.createBitmap(bitmap, rect[0] / divisor, rect[1] / divisor, rect[2] / divisor, rect[3] / divisor);
                }

                binding.pdfView.setImageBitmap(bitmap);
                binding.pdfView.setMaxScaleTap(2);
                binding.pdfView.setMaxZoom(8);
                binding.pdfView.invalidate();

                if (preferences.getBoolean(getString(R.string.preference_key_ticket_brightness), getResources().getBoolean(R.bool.preference_default_ticket_brightness))) {
                    WindowManager.LayoutParams layout = getWindow().getAttributes();
                    layout.screenBrightness = 1F;
                    getWindow().setAttributes(layout);
                }

                retry = false;
            } catch (Exception | OutOfMemoryError e) {
                FirebaseCrashlytics.getInstance().setCustomKey("retry", retry);
                FirebaseCrashlytics.getInstance().recordException(e);
                Log.e("PdfViewerActivity", "Error", e);
                if (!(e instanceof OutOfMemoryError) || retry) {
                    Toast.makeText(this, R.string.ticket_anzeige_fehler, Toast.LENGTH_LONG).show();
                    retry = false;
                    finish();
                } else {
                    retry = true;
                }
            }
        } while (retry);
    }

}
