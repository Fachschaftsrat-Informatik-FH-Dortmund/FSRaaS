package de.fsrfb4.fb4.util;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import androidx.preference.PreferenceManager;

import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.gson.Gson;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

import de.fsrfb4.fb4.R;
import lombok.AllArgsConstructor;
import okhttp3.MediaType;
import okhttp3.ResponseBody;

public final class TicketUtil {
    private static final String TICKET_NAME = "NRWTicket.pdf";

    public static final int[] TICKET_DISPLAY_RESOLUTION = new int[] {1358 * 2, 1920 * 2};

    private TicketUtil() { }

    public static boolean saveTicketAsFile(Context context, ResponseBody body) throws IOException {
        if (!body.contentType().equals(MediaType.parse("application/pdf"))) {
            throw new IOException("Not a pdf file: " + body.contentType().toString());
        }
        return saveTicketAsFile(context, body.byteStream());
    }

    public static boolean saveTicketAsFile(Context context, Uri uri) throws IOException {
        InputStream inputStream = context.getContentResolver().openInputStream(uri);
        return saveTicketAsFile(context, inputStream);
    }

    @SuppressWarnings("checkstyle:innerassignment")
    public static boolean saveTicketAsFile(Context context, InputStream input) throws IOException {
        File fileTemp = new File(context.getExternalFilesDir(null), "NRWTicketTemp.pdf");
        fileTemp.createNewFile();
        try (OutputStream output = new FileOutputStream(fileTemp)) {
            byte[] buffer = new byte[4096];
            int read;
            if ((read = input.read(buffer)) != -1 && isPdf(buffer)) {
                do {
                    output.write(buffer, 0, read);
                } while ((read = input.read(buffer)) != -1);
            } else {
                input.close();
                throw new IOException("Not a pdf file");
            }
            output.flush();
        }

        input.close();
        if (!isPdfCorrupted(fileTemp)) {
            setTicketRect(context, fileTemp);
            return fileTemp.renameTo(getTicket(context));
        }
        return false;
    }

    private static boolean isPdf(byte[] bytes) {
        return bytes != null && bytes.length > 4 &&
            bytes[0] == 0x25 && // %
            bytes[1] == 0x50 && // P
            bytes[2] == 0x44 && // D
            bytes[3] == 0x46 && // F
            bytes[4] == 0x2D;   // -
    }

    private static boolean isPdfCorrupted(File file) throws IOException {
        new PdfRenderer(ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY));
        return false;
    }

    public static boolean ticketExists(Context context) {
        File ticket = getTicket(context);
        return ticket.exists();
    }

    public static File getTicket(Context context) {
        return new File(context.getExternalFilesDir(null), TICKET_NAME);
    }

    public static void setTicketRect(Context context, File ticket) {
        try {
            Bitmap bitmap = Bitmap.createBitmap(TICKET_DISPLAY_RESOLUTION[0], TICKET_DISPLAY_RESOLUTION[1], Bitmap.Config.ARGB_8888);

            Canvas canvas = new Canvas(bitmap);
            canvas.drawColor(Color.WHITE);
            canvas.drawBitmap(bitmap, 0, 0, null);
            PdfRenderer renderer = new PdfRenderer(ParcelFileDescriptor.open(ticket, ParcelFileDescriptor.MODE_READ_ONLY));
            renderer.openPage(0).render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);

            int[] rect = TicketUtil.calculateTicketRect(bitmap);
            String json = null;
            if (rect != null) {
                json = new Gson().toJson(rect);
            }
            SharedPreferences appSharedPrefs = PreferenceManager.getDefaultSharedPreferences(context);
            SharedPreferences.Editor editor = appSharedPrefs.edit();
            editor.putString(context.getString(R.string.preference_key_ticket_rect), json)
                .apply();
        } catch (IOException e) {
            FirebaseCrashlytics.getInstance().recordException(e);
        }
    }

    public static int[] getTicketRect(Context context) {
        SharedPreferences appSharedPrefs = PreferenceManager.getDefaultSharedPreferences(context);
        String json = appSharedPrefs.getString(context.getString(R.string.preference_key_ticket_rect), null);
        if (json != null) {
            int[] rect = new Gson().fromJson(json, int[].class);
            return rect;
        } else {
            return null;
        }
    }

    private static int[] calculateTicketRectBackup(Bitmap bitmap) {
        int startX = Integer.MAX_VALUE;
        int startY = Integer.MAX_VALUE;
        int endX = -1;
        int endY = -1;
        for (int i = 0; i < bitmap.getWidth(); i++) {
            for (int j = 0; j < bitmap.getHeight(); j++) {
                int pixel = bitmap.getPixel(i, j);
                if (!Integer.toHexString(pixel).endsWith("ffffff")) {
                    startX = Math.min(i, startX);
                    startY = Math.min(j, startY);
                    endX = Math.max(i, endX);
                    endY = Math.max(j, endY);
                }
            }
        }
        return new int[] {startX, startY, endX - startX + 1, endY - startY + 1};
    }

    private static int[] calculateTicketRect(Bitmap bitmap) {
        List<Line> lines = getLines(bitmap);
        for (int i = 0; i < lines.size(); i++) {
            Line top = lines.get(i);
            for (int j = lines.size() - 1; j > i; j--) {
                Line bottom = lines.get(j);
                if (isRectangle(top, bottom)) {
                    int startX = Math.min(top.startX, bottom.startX);
                    int endX = Math.max(top.endX, bottom.endX);
                    return new int[] {startX, top.startY, endX - startX + 1, bottom.startY - top.startY + 1};
                }
            }
        }
        return calculateTicketRectBackup(bitmap);
    }

    private static boolean isRectangle(Line top, Line bottom) {
        if (bottom.startY - top.startY < 100) {
            return false;
        }

        return !(Math.abs(top.startX - bottom.startX) > 2) &&
            !(Math.abs(top.endX - bottom.endX) > 2);
    }

    private static List<Line> getLines(Bitmap bitmap) {
        List<Line> lines = new ArrayList<>();
        for (int y = 0; y < bitmap.getHeight(); y++) {
            inner:
            for (int x = 0; x < bitmap.getWidth(); x += 2) {
                if (isFilled(bitmap.getPixel(x, y))) {
                    int startX = x;
                    while (isFilled(bitmap.getPixel(startX - 1, y))) {
                        startX--;
                    }
                    Line line = findAtStart(bitmap, startX, y);
                    if (line != null) {
                        lines.add(line);
                    }
                    break inner;
                }
            }
        }
        return lines;
    }

    private static Line findAtStart(Bitmap bitmap, int startX, int y) {
        for (int endX = bitmap.getWidth() - 1; endX >= 0; endX--) {
            if (isFilled(bitmap.getPixel(endX, y))) {
                if (endX - startX > 100 && isLine(bitmap, startX, y, endX)) {
                    return new Line(startX, y, endX, y);
                } else {
                    return null;
                }
            }
        }
        return null;
    }

    private static boolean isLine(Bitmap bitmap, int startX, int y, int endX) {
        for (int i = startX; i <= endX; i++) {
            if (!isFilled(bitmap.getPixel(i, y))) {
                startX = i;
                break;
            } else if (i == endX) {
                return true;
            }
        }

        if (startX < endX) {
            boolean filledMode = false;
            int filledSize = -1;
            int emptySize = -1;
            int lastStart = startX;
            int foundMiddleLines = -1;
            for (int i = startX; i <= endX; i++) {
                if (filledMode ^ isFilled(bitmap.getPixel(i, y))) {
                    if (filledMode) {
                        if (filledSize == -1) {
                            filledSize = i - 1 - lastStart;
                        } else {
                            int size = i - 1 - lastStart;
                            if (Math.abs(size - filledSize) > 1) {
                                return false;
                            }
                        }
                    } else {
                        if (emptySize == -1) {
                            emptySize = i - 1 - lastStart;
                        } else {
                            int size = i - 1 - lastStart;
                            if (Math.abs(size - emptySize) > 1) {
                                return false;
                            }
                        }
                    }
                    lastStart = i;
                    filledMode = !filledMode;
                    foundMiddleLines++;
                }
            }
            return foundMiddleLines > 0;
        }
        return false;
    }

    private static boolean isFilled(int rgb) {
        /*float[] hsv = new float[3];
        Color.colorToHSV(rgb, hsv);
        return hsv[2] < 0.93;*/
        return rgb != -1; //!Integer.toHexString(rgb).endsWith("ffffff");
    }

    @AllArgsConstructor
    private static class Line {
        public int startX;
        public int startY;
        public int endX;
        public int endY;
    }
}
