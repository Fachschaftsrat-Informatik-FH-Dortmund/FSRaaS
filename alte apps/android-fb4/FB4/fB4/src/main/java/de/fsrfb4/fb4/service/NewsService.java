package de.fsrfb4.fb4.service;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.core.app.NotificationCompat;
import androidx.preference.PreferenceManager;

import com.google.firebase.analytics.FirebaseAnalytics;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ExecutorService;
import java.util.ArrayList;

import java.util.concurrent.Executors;

import javax.inject.Inject;
import javax.inject.Singleton;

import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.MainActivity;
import de.fsrfb4.fb4.fragments.news.NewsFragment;
import de.fsrfb4.fb4.retrofit.NewsApi;
import de.fsrfb4.fb4.room.AppDatabase;
import de.fsrfb4.fb4.room.NewsDao;
import de.fsrfb4.fb4.room.NewsEconomyDao;
import de.fsrfb4.fb4.room.RoomNews;
import de.fsrfb4.fb4.room.RoomNewsEconomy;
import de.fsrfb4.fb4.util.Call;
import de.fsrfb4.fb4.util.Callback;
import de.fsrfb4.fb4.util.FirebaseAnalyticsEvents;
import de.fsrfb4.fb4.util.NewsEconomyParser;
import de.fsrfb4.fb4.util.NewsEconomyParserImpl;
import de.fsrfb4.fb4.util.NewsParser;
import de.fsrfb4.fb4.util.NewsParserImpl;
import de.fsrfb4.fb4.util.NotificationBroadcastReceiver;

@Singleton
public class NewsService {
    private static final int TIMELIMIT_MILLIS = 9000;
    public static final String NOTIFICATION_CHANNEL_NEWS = "news_channel";
    public static final String NOTIF_COUNT = "Notif_Anzahl";
    public static final String NOTIF_TEXT = "Notif_Text";


    private final Context context;
    private final NewsParser newsParser;
    private final NewsEconomyParser newsEconomyParser;
    private final NewsApi newsApi;
    private final NewsDao newsDao;
    private final NewsEconomyDao newsEconomyDao;

    @Inject
    public NewsService(NewsApi newsApi, Context context, AppDatabase appDatabase) {
        this.newsParser = new NewsParserImpl();
        this.newsEconomyParser = new NewsEconomyParserImpl();
        this.newsApi = newsApi;
        this.context = context;
        this.newsDao = appDatabase.newsDao();
        this.newsEconomyDao = appDatabase.newsEconomyDao();
    }

    public Call<List<RoomNews>> getNews() {
        return new Call<>() {
            private boolean cancelled;

            @Override
            public void enqueue(Callback<List<RoomNews>> callback) {
                newsApi.getNews().enqueue(new retrofit2.Callback<>() {
                    @Override
                    public void onResponse(retrofit2.Call<String> call, retrofit2.Response<String> response) {
                        if (cancelled) {
                            return;
                        }

                        if (response.isSuccessful()) {
                            List<RoomNews> newsList = newsParser.parseNews(response.body());
                            callback.onSuccess(newsList);
                        } else {
                            callback.onFailure(new IOException(response.message()));
                        }
                    }

                    @Override
                    public void onFailure(retrofit2.Call<String> call, Throwable t) {
                        if (!cancelled) {
                            callback.onFailure(t);
                        }
                    }
                });
            }

            @Override
            public void cancel() {
                cancelled = true;
            }
        };
    }

    public Call<List<RoomNews>> getNewsPage(int page) {
        return new Call<>() {
            private boolean cancelled;

            @Override
            public void enqueue(Callback<List<RoomNews>> callback) {
                newsApi.getNewsPage(page).enqueue(new retrofit2.Callback<>() {
                    @Override
                    public void onResponse(retrofit2.Call<String> call, retrofit2.Response<String> response) {
                        if (cancelled) {
                            return;
                        }

                        if (response.isSuccessful()) {
                            List<RoomNews> newsList = newsParser.parseNews(response.body());
                            callback.onSuccess(newsList);
                        } else if (response.code() == 404) {
                            callback.onSuccess(new ArrayList<>());
                        } else {
                            callback.onFailure(new IOException(response.message()));
                        }
                    }

                    @Override
                    public void onFailure(retrofit2.Call<String> call, Throwable t) {
                        if (!cancelled) {
                            callback.onFailure(t);
                        }
                    }
                });
            }

            @Override
            public void cancel() {
                cancelled = true;
            }
        };
    }

    public Call<List<RoomNews>> updateNews() {
        Call<List<RoomNews>> newsCall = getNews();
        return new Call<>() {
            @Override
            public void enqueue(Callback<List<RoomNews>> callback) {
                newsCall.enqueue(new Callback<>() {
                    @Override
                    public void onSuccess(List<RoomNews> newsList) {
                        ExecutorService executor = Executors.newSingleThreadExecutor();
                        executor.execute(() -> {
                            try {
                                List<RoomNews> pinnedItems = newsDao.getPinnedNews();
                                newsList.stream().filter(pinnedItems::contains).forEach(news -> news.setPinned(true));
                                newsDao.insertAll(newsList);

                                if (!newsList.isEmpty()) {
                                    List<RoomNews> unpinnedNews = newsDao.getUnpinnedNews();
                                    LocalDateTime lastNewsTime = newsList.get(newsList.size() - 1).getDateTime();
                                    for (RoomNews news : unpinnedNews) {
                                        if (!newsList.contains(news) && (ChronoUnit.WEEKS.between(news.getDateTime(), LocalDateTime.now()) > 4 || news.getDateTime().isAfter(lastNewsTime))) {
                                            newsList.remove(news);
                                            newsDao.delete(news);
                                        }
                                    }
                                }

                                new Handler(Looper.getMainLooper()).post(() -> callback.onSuccess(newsList));
                            } catch (Exception e) {
                                new Handler(Looper.getMainLooper()).post(() -> callback.onFailure(e));
                            } finally {
                                executor.shutdown();
                            }
                        });
                    }

                    @Override
                    public void onFailure(Throwable t) {
                        callback.onFailure(t);
                    }
                });
            }

            @Override
            public void cancel() {
                newsCall.cancel();
            }
        };
    }


    public Call<List<RoomNewsEconomy>> getEconomyNews() {
        return new Call<>() {
            private boolean cancelled;

            @Override
            public void enqueue(Callback<List<RoomNewsEconomy>> callback) {
                newsApi.getNewsEconomy().enqueue(new retrofit2.Callback<>() {
                    @Override
                    public void onResponse(retrofit2.Call<String> call, retrofit2.Response<String> response) {
                        if (cancelled) {
                            return;
                        }

                        if (response.isSuccessful()) {
                            List<RoomNewsEconomy> newsList = newsEconomyParser.parseNewsEconomy(response.body());
                            callback.onSuccess(newsList);
                        } else {
                            callback.onFailure(new IOException(response.message()));
                        }
                    }

                    @Override
                    public void onFailure(retrofit2.Call<String> call, Throwable t) {
                        if (!cancelled) {
                            callback.onFailure(t);
                        }
                    }
                });
            }

            @Override
            public void cancel() {
                cancelled = true;
            }
        };
    }

    public Call<List<RoomNewsEconomy>> updateNewsEconomy() {
        Call<List<RoomNewsEconomy>> newsCall = getEconomyNews();
        return new Call<>() {
            @Override
            public void enqueue(Callback<List<RoomNewsEconomy>> callback) {
                newsCall.enqueue(new Callback<>() {
                    @Override
                    public void onSuccess(List<RoomNewsEconomy> newsList) {
                        ExecutorService executor = Executors.newSingleThreadExecutor();
                        executor.execute(() -> {
                            try {
                                List<RoomNewsEconomy> pinnedItems = newsEconomyDao.getPinnedNews();
                                newsList.stream().filter(pinnedItems::contains).forEach(news -> news.setPinned(true));
                                newsEconomyDao.insertAll(newsList);

                                List<RoomNewsEconomy> unpinnedNews = newsEconomyDao.getUnpinnedNews();
                                for (RoomNewsEconomy news : unpinnedNews) {
                                    if (!newsList.contains(news)) {
                                        newsEconomyDao.delete(news);
                                    }
                                }

                                new Handler(Looper.getMainLooper()).post(() -> callback.onSuccess(newsList));
                            } catch (Exception e) {
                                new Handler(Looper.getMainLooper()).post(() -> callback.onFailure(e));
                            } finally {
                                executor.shutdown();
                            }
                        });
                    }

                    @Override
                    public void onFailure(Throwable t) {
                        callback.onFailure(t);
                    }
                });
            }

            @Override
            public void cancel() {
                newsCall.cancel();
            }
        };
    }

    public void checkNewMessages(OnFinishedListener onFinishedListener, boolean limitedTime) {
        FirebaseAnalytics.getInstance(context).logEvent(FirebaseAnalyticsEvents.NEW_NEWS_CHECK_STARTED, null);
        final Timer timer = new Timer();
        Call<List<RoomNews>> news = updateNews();
        news.enqueue(new Callback<>() {
            @Override
            public void onSuccess(List<RoomNews> news) {
                if (timer != null) {
                    timer.cancel();
                }

                showNotification(news);
                onFinishedListener.onFinished(true);
            }

            @Override
            public void onFailure(Throwable t) {
                if (timer != null) {
                    timer.cancel();
                }
                onFinishedListener.onFinished(false);
            }
        });

        if (limitedTime) {
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    news.cancel();
                    onFinishedListener.onFinished(false);
                }
            }, TIMELIMIT_MILLIS);
        }
    }

    private void showNotification(List<RoomNews> news) {
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = appSharedPrefs.edit();

        Long lastChecked = appSharedPrefs.getLong(context.getString(R.string.preference_key_news_last_checked), 0);
        createNotificationChannelIfNotExists();

        int newNews = 0;
        for (RoomNews newsItem : news) {
            if (lastChecked < newsItem.getDateTime().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()) {
                newNews++;
            }
        }

        if (newNews > 1 || (newNews == 1 && appSharedPrefs.getInt(NOTIF_COUNT, 0) != 0)) {
            Intent notificationIntent = new Intent(context, MainActivity.class);
            notificationIntent.putExtra("Fragment", R.id.aktuelles);
            notificationIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int intentFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pIntent = PendingIntent.getActivity(context, 0, notificationIntent, intentFlags);
            String bigText = "";

            for (int i = 0; i < newNews; i++) {
                bigText += news.get(i).getTitle() + "\n\n";

                logNewsEvent(news.get(i));
            }

            newNews += appSharedPrefs.getInt(NOTIF_COUNT, 0);
            bigText += appSharedPrefs.getString(NOTIF_TEXT, "");

            if (appSharedPrefs.getInt(NOTIF_COUNT, 0) == 0) {
                bigText = bigText.substring(0, bigText.length() - 2);
            }

            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_NEWS)
                .setSmallIcon(R.drawable.ic_notification_news)
                .setStyle(new NotificationCompat.BigTextStyle()
                    .bigText(bigText))
                .setContentTitle(String.valueOf(newNews) + " " + context.getString(R.string.neueNachrichten))
                .setContentText(context.getString(R.string.Notif_contentText))
                .setColor(context.getResources().getColor(R.color.main))
                .setAutoCancel(true)
                .setSound(alarmSound)
                .setContentIntent(pIntent)
                .setNumber(newNews)
                .setDeleteIntent(getDeleteIntent());

            editor.putInt(NOTIF_COUNT, newNews);
            editor.putString(NOTIF_TEXT, bigText);

            NotificationManager mNotificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            // mId allows you to update the notification later on.
            mNotificationManager.notify(0, mBuilder.build());
        } else if (newNews == 1) {
            logNewsEvent(news.get(0));

            Intent notificationIntent = new Intent(context, MainActivity.class);
            notificationIntent.putExtra("Fragment", R.id.aktuelles);
            notificationIntent.putExtra(NewsFragment.INTENT_EXTRA_NEWS, news.get(0).getDateTime());
            notificationIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int intentFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pIntent = PendingIntent.getActivity(context, 0, notificationIntent, intentFlags);

            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy - HH:mm:ss");
            NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_NEWS)
                .setSmallIcon(R.drawable.ic_notification_news)
                .setColor(context.getResources().getColor(R.color.main))
                .setStyle(new NotificationCompat.BigTextStyle()
                    .bigText(news.get(0).getContent()))
                .setContentText(news.get(0).getContent())
                .setContentTitle(news.get(0).getTitle())
                .setSubText(news.get(0).getAuthor() + " " + news.get(0).getDateTime().format(dateTimeFormat))
                .setAutoCancel(true)
                .setSound(alarmSound)
                .setContentIntent(pIntent)
                .setDeleteIntent(getDeleteIntent());

            editor.putInt(NOTIF_COUNT, 1);
            editor.putString(NOTIF_TEXT, news.get(0).getTitle());

            NotificationManager mNotificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            // mId allows you to update the notification later on.
            mNotificationManager.notify(0, mBuilder.build());
        }


        editor.putLong(context.getString(R.string.preference_key_news_last_checked),
            LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()).apply();
        editor.commit();
    }

    private void createNotificationChannelIfNotExists() {
        NotificationManager mNotificationManager =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (mNotificationManager.getNotificationChannel(NOTIFICATION_CHANNEL_NEWS) != null) {
            return;
        }
        String name = context.getString(R.string.notification_channel_news);
        int importance = NotificationManager.IMPORTANCE_DEFAULT;
        NotificationChannel mChannel = new NotificationChannel(NOTIFICATION_CHANNEL_NEWS, name, importance);
        mChannel.enableLights(true);
        mChannel.setLightColor(context.getColor(R.color.main));
        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_DELAYED)
            .setContentType(AudioAttributes.CONTENT_TYPE_UNKNOWN)
            .build();
        mChannel.setSound(alarmSound, audioAttributes);
        mNotificationManager.createNotificationChannel(mChannel);
    }

    protected PendingIntent getDeleteIntent() {
        Intent intent = new Intent(context, NotificationBroadcastReceiver.class);
        intent.setAction("notification_cancelled");
        int intentFlags = PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, 0, intent, intentFlags);
    }

    private void logNewsEvent(RoomNews news) {
        Bundle bundle = new Bundle();
        bundle.putString(FirebaseAnalyticsEvents.Param.TITLE, news.getTitle());
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy - HH:mm:ss");
        bundle.putString(FirebaseAnalyticsEvents.Param.DATE, news.getDateTime().format(dateTimeFormat));
        FirebaseAnalytics.getInstance(context).logEvent(FirebaseAnalyticsEvents.NEW_NEWS_FOUND, bundle);
    }

    public interface OnFinishedListener {
        void onFinished(boolean success);
    }
}
