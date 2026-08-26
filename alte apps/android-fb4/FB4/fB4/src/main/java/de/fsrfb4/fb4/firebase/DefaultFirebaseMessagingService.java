package de.fsrfb4.fb4.firebase;

import android.util.Log;

import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.concurrent.TimeUnit;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.service.NewsService;
import de.fsrfb4.fb4.worker.NewsWorker;
import de.fsrfb4.fb4.worker.TicketDownloadWorker;

@AndroidEntryPoint
public class DefaultFirebaseMessagingService extends FirebaseMessagingService {
    public static final String TOPIC_AKTUELLES = "Aktuelles";
    public static final String TOPIC_TICKET = "Ticket";

    @Inject
    public NewsService newsService;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d("Firebase", "Message received from: " + remoteMessage.getFrom());
        switch (remoteMessage.getFrom().replace("/topics/", "")) {
            case TOPIC_AKTUELLES:
                checkNews();
                break;
            /*case TOPIC_TICKET:
                createTicketDownloadWorkRequest();
                break;*/
            default:
                break;
        }
    }

    private void createTicketDownloadWorkRequest() {
        Log.d("Firebase", "createTicketDownloadWorkRequest");

        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();

        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(TicketDownloadWorker.class)
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 5, TimeUnit.MINUTES)
                .build();

        WorkManager.getInstance(this).enqueueUniqueWork(TicketDownloadWorker.WORK_NAME, ExistingWorkPolicy.REPLACE, request);
    }

    private void checkNews() {
        newsService.checkNewMessages(success -> {
            if (!success) {
                createNewsWorkRequest();
            }
        }, true);
    }

    private void createNewsWorkRequest() {
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();

        OneTimeWorkRequest.Builder requestBuilder = new OneTimeWorkRequest.Builder(NewsWorker.class)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.LINEAR, 5, TimeUnit.MINUTES);


        WorkManager.getInstance(this).enqueueUniqueWork(NewsWorker.WORK_NAME, ExistingWorkPolicy.KEEP, requestBuilder.build());
    }
}
