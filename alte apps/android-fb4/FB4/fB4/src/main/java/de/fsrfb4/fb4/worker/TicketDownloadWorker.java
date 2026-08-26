package de.fsrfb4.fb4.worker;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.preference.PreferenceManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.util.Map;

import de.fsrfb4.fb4.FB4;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.ticket.TicketDownloadActivity;
import de.fsrfb4.fb4.activities.ticket.TicketViewActivity;
import de.fsrfb4.fb4.model.TicketPageModel;
import de.fsrfb4.fb4.retrofit.HisApi;
import de.fsrfb4.fb4.util.FirebaseAnalyticsEvents;
import de.fsrfb4.fb4.util.HisUtil;
import de.fsrfb4.fb4.util.TicketUtil;
import de.fsrfb4.fb4.util.UserCredentialsHelper;
import okhttp3.ResponseBody;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.scalars.ScalarsConverterFactory;

public class TicketDownloadWorker extends Worker {
    public static final String WORK_NAME = "ticket_download";
    public static final String NOTIFICATION_CHANNEL_TICKET = "ticket_channel";
    private static final int NOTIFICATION_ID = 100;

    private HisApi hisService;
    private Context context;
    private FirebaseAnalytics mFirebaseAnalytics;

    public TicketDownloadWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
        this.context = context;
        mFirebaseAnalytics = FirebaseAnalytics.getInstance(context);
    }

    @Override
    public Result doWork() {
        Log.d("Firebase", "doWork");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            UserCredentialsHelper.UserCredentials odsCredentials;
            mFirebaseAnalytics.logEvent(FirebaseAnalyticsEvents.AUTOMATIC_TICKET_DOWNLOAD_STARTED, null);
            try {
                odsCredentials = UserCredentialsHelper.getOdsCredentials(getApplicationContext());
            } catch (Exception e) {
                FirebaseCrashlytics.getInstance().recordException(e);
                showTicketDownloadFailedNotification();
                return Result.failure();
            }

            try {
                SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
                if (odsCredentials != null && sharedPreferences.getBoolean(getApplicationContext().getString(R.string.preference_key_update_ticket),
                    getApplicationContext().getResources().getBoolean(R.bool.preference_default_update_ticket))) {
                    Retrofit retrofit = new Retrofit.Builder()
                        .client(FB4.getOkHttpClientBuilder(getApplicationContext(), true).build())
                        .baseUrl("https://portal.fh-dortmund.de")
                        .addConverterFactory(ScalarsConverterFactory.create())
                        .build();

                    hisService = retrofit.create(HisApi.class);
                    login(odsCredentials);
                } else {
                    showUpdateTicketNotification();
                }
            } catch (Exception e) {
                Log.e("Firebase", "doWork", e);
                if (getRunAttemptCount() >= 5) {
                    showTicketDownloadFailedNotification();
                    return Result.failure();
                }
                return Result.retry();
            }
        } else {
            showUpdateTicketNotification();
        }

        return Result.success();
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void login(UserCredentialsHelper.UserCredentials odsCredentials) throws Exception {
        Response<String> response = hisService.login(odsCredentials.username, odsCredentials.password).execute();
        response = HisUtil.convertLoginResponse(response);
        if (response.isSuccessful()) {
            loadTicketPage();
        } else {
            throw new Exception("Login failed");
        }
    }

    private void loadTicketPage() throws Exception {
        Response<String> response = hisService.getNrwTicketPage().execute();
        Response<TicketPageModel> convertedResponse = HisUtil.convertTicketPageResponse(response, null);
        if (convertedResponse.isSuccessful()) {
            TicketPageModel ticketPageModel = convertedResponse.body();
            downloadTicket(ticketPageModel.getAuthenticityToken(), ticketPageModel.getCurrentSemester().getDownloadParameter());
        } else {
            throw new Exception("Loading ticket page failed");
        }
    }

    private void downloadTicket(String authenticityToken, String ticketParameter) throws Exception {
        Map<String, String> fieldMap = HisUtil.getFieldMapForTicketDownload(authenticityToken, ticketParameter);
        Response<ResponseBody> response = hisService.downloadTicket(fieldMap).execute();
        if (response.isSuccessful()) {
            if (TicketUtil.saveTicketAsFile(context, response.body())) {
                showTicketDownloadedNotification();
            } else {
                throw new Exception("Could not save ticket");
            }
        } else {
            throw new Exception("Download failed");
        }
    }

    private void showTicketDownloadedNotification() {
        Intent intent = new Intent(getApplicationContext(), TicketViewActivity.class);
        showNotification(getApplicationContext().getString(R.string.ticket_updated), getApplicationContext().getString(R.string.ticket_downloaded_for_new_semester), intent);
        mFirebaseAnalytics.logEvent(FirebaseAnalyticsEvents.AUTOMATIC_TICKET_DOWNLOAD_FINISHED, null);
    }

    private void showTicketDownloadFailedNotification() {
        Intent intent = new Intent(getApplicationContext(), TicketDownloadActivity.class);
        showNotification(getApplicationContext().getString(R.string.ticket_not_updated), getApplicationContext().getString(R.string.ticket_not_updated_long), intent);
        mFirebaseAnalytics.logEvent(FirebaseAnalyticsEvents.AUTOMATIC_TICKET_DOWNLOAD_FAILED, null);
    }

    private void showUpdateTicketNotification() {
        Intent intent = new Intent(getApplicationContext(), TicketDownloadActivity.class);
        showNotification(getApplicationContext().getString(R.string.ticket_expired), getApplicationContext().getString(R.string.ticket_is_no_longer_valid), intent);
        mFirebaseAnalytics.logEvent(FirebaseAnalyticsEvents.AUTOMATIC_TICKET_DOWNLOAD_SHOW_NOTIFICATION, null);
    }

    private void showNotification(String title, String content, Intent intent) {
        if (ActivityCompat.checkSelfPermission(getApplicationContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        int intentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            intentFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(getApplicationContext(), 0, intent, intentFlags);

        createNotificationChannelIfNotExists();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(getApplicationContext(), NOTIFICATION_CHANNEL_TICKET)
            .setSmallIcon(R.drawable.bus)
            .setColor(getApplicationContext().getResources().getColor(R.color.main))
            .setContentTitle(title)
            .setContentText(content)
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText(content))
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(getApplicationContext());
        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }

    private void createNotificationChannelIfNotExists() {
        NotificationManager mNotificationManager =
            (NotificationManager) getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (mNotificationManager.getNotificationChannel(NOTIFICATION_CHANNEL_TICKET) != null) {
            return;
        }
        String name = getApplicationContext().getString(R.string.notification_channel_ticket);
        int importance = NotificationManager.IMPORTANCE_LOW;
        NotificationChannel mChannel = new NotificationChannel(NOTIFICATION_CHANNEL_TICKET, name, importance);
        mChannel.enableLights(false);
        mNotificationManager.createNotificationChannel(mChannel);
    }
}
