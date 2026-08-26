package de.fsrfb4.fb4.service;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.preference.PreferenceManager;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.UnknownHostException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoField;
import java.util.concurrent.TimeUnit;

import javax.inject.Inject;

import de.fsrfb4.fb4.retrofit.DataUpdateApi;
import de.fsrfb4.fb4.retrofit.dataupdate.UpdatedData;
import de.fsrfb4.fb4.worker.DataUpdateWorker;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DataService {
    private static final String SP_NAME_DATA = "data";

    public static final String KEY_EXAMPLAN = "examplan";
    public static final String KEY_TIMEPLAN = "timeplan";
    public static final String KEY_SEMESTER_BEGINNING = "semester_beginning";
    public static final String KEY_SEMESTER_END = "semester_end";
    public static final String KEY_CANTEENS = "canteens";
    public static final String KEY_WS_START = "ws_start";
    public static final String KEY_SS_START = "ss_start";
    public static final String KEY_NEWS_URL = "news_url";
    public static final String KEY_FILE_DOWNLOADS = "file_downloads";
    public static final String KEY_LINKS = "links";
    public static final String KEY_ROOMS = "rooms";

    private final Context context;
    private final DataUpdateApi dataUpdateApi;

    @Inject
    public DataService(Context context, DataUpdateApi dataUpdateApi) {
        this.context = context;
        this.dataUpdateApi = dataUpdateApi;
    }

    public void updateAllData(@Nullable OnFinishedListener onFinishedListener) {
        dataUpdateApi.getUpdatedData().enqueue(new Callback<UpdatedData[]>() {
            @Override
            public void onResponse(Call<UpdatedData[]> call, Response<UpdatedData[]> response) {
                Log.d("DataUpdater", "onResponse: " + response.message());
                if (response.isSuccessful()) {
                    UpdatedData[] updatedData = response.body();
                    saveDataToSharedPreferences(updatedData);
                }

                if (onFinishedListener != null) {
                    onFinishedListener.onFinished(response.isSuccessful());
                }
            }

            @Override
            public void onFailure(Call<UpdatedData[]> call, Throwable t) {
                Log.d("DataUpdater", "onFailure: " + t.getMessage());
                if (!(t instanceof UnknownHostException)) {
                    FirebaseCrashlytics.getInstance().recordException(t);
                }

                if (onFinishedListener != null) {
                    onFinishedListener.onFinished(false);
                }
            }
        });
    }

    public void updateData(String key, @Nullable OnFinishedListener onFinishedListener) {
        dataUpdateApi.getUpdatedData(key).enqueue(new Callback<UpdatedData>() {
            @Override
            public void onResponse(Call<UpdatedData> call, Response<UpdatedData> response) {
                if (response.isSuccessful()) {
                    UpdatedData updatedData = response.body();
                    saveDataToSharedPreferences(updatedData);
                }

                if (onFinishedListener != null) {
                    onFinishedListener.onFinished(response.isSuccessful());
                }
            }

            @Override
            public void onFailure(Call<UpdatedData> call, Throwable t) {
                if (!(t instanceof UnknownHostException)) {
                    FirebaseCrashlytics.getInstance().recordException(t);
                }

                if (onFinishedListener != null) {
                    onFinishedListener.onFinished(false);
                }
            }
        });
    }

    private void saveDataToSharedPreferences(UpdatedData... updatedData) {
        SharedPreferences.Editor editor = context.getSharedPreferences(SP_NAME_DATA, Context.MODE_PRIVATE).edit();
        for (UpdatedData data : updatedData) {
            editor.putString(data.getDataKey(), data.getValue().replace("\\\"", "\""));
        }
        editor.commit();
    }

    public LocalDate getSemesterBeginning() {
        String dateString = getData(KEY_SEMESTER_BEGINNING);
        if (dateString != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
            try {
                return LocalDate.parse(dateString, formatter);
            } catch (DateTimeParseException | IllegalArgumentException e) {
                return LocalDate.now();
            }
        } else {
            return LocalDate.now();
        }
    }

    public LocalDate getSemesterEnd() {
        String dateString = getData(KEY_SEMESTER_END);
        if (dateString != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
            try {
                return LocalDate.parse(dateString, formatter);
            } catch (DateTimeParseException | IllegalArgumentException e) {
                return LocalDate.now();
            }
        } else {
            return LocalDate.now();
        }
    }

    public String getExamPlanUrl() {
        return getData(KEY_EXAMPLAN);
    }

    public String getTimePlanUrl() {
        return getData(KEY_TIMEPLAN);
    }

    public String getCanteens() {
        String json = getData(KEY_CANTEENS);
        if (json != null) {
            return json;
        } else {
            return getDefaultValueFromFile(KEY_CANTEENS, "canteens.json");
        }
    }

    public LocalDate getNextWsStart() throws Exception {
        String dateString = getData(KEY_WS_START);
        if (dateString != null) {
            DateTimeFormatter formatter = new DateTimeFormatterBuilder()
                .appendPattern("dd.MM")
                .parseDefaulting(ChronoField.YEAR, LocalDate.now().getYear())
                .toFormatter();
            LocalDate date = LocalDate.parse(dateString, formatter);
            if (!date.isAfter(LocalDate.now())) {
                date = date.plusYears(1);
            }
            return date;
        } else {
            throw new Exception();
        }
    }

    public LocalDate getNextSsStart() throws Exception {
        String dateString = getData(KEY_SS_START);
        if (dateString != null) {
            DateTimeFormatter formatter = new DateTimeFormatterBuilder()
                .appendPattern("dd.MM")
                .parseDefaulting(ChronoField.YEAR, LocalDate.now().getYear())
                .toFormatter();
            LocalDate date = LocalDate.parse(dateString, formatter);
            if (!date.isAfter(LocalDate.now())) {
                date = date.plusYears(1);
            }
            return date;
        } else {
            throw new Exception();
        }
    }

    public String getNewsUrl() {
        return getData(KEY_NEWS_URL);
    }

    public String getFileDownloads() {
        return getData(KEY_FILE_DOWNLOADS);
    }

    public String getLinks() {
        return getData(KEY_LINKS);
    }

    public String getRooms() {
        String json = getData(KEY_ROOMS);
        if (json != null) {
            return json;
        } else {
            return getDefaultValueFromFile(KEY_ROOMS, "rooms.json");
        }
    }

    private String getData(String key) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(SP_NAME_DATA, Context.MODE_PRIVATE);
        return sharedPreferences.getString(key, null);
    }

    public void createUpdateWorkRequest(@Nullable String key) {
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();

        OneTimeWorkRequest.Builder requestBuilder = new OneTimeWorkRequest.Builder(DataUpdateWorker.class)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.LINEAR, 5, TimeUnit.MINUTES);

        if (key != null) {
            Data data = new Data.Builder()
                .putString(DataUpdateWorker.EXTRA_KEY, key)
                .build();
            requestBuilder.setInputData(data);
        }

        WorkManager.getInstance(context).enqueueUniqueWork(DataUpdateWorker.WORK_NAME, ExistingWorkPolicy.APPEND, requestBuilder.build());
    }

    private String getDefaultValueFromFile(String key, String fileName) {
        SharedPreferences.Editor editor = PreferenceManager.getDefaultSharedPreferences(context).edit();

        try {
            InputStream is = context.getAssets().open(fileName);
            String json = readTextFile(is);
            editor.putString(key, json);
            editor.apply();

            return json;
        } catch (IOException e) {
            e.printStackTrace();
        }

        return "";
    }

    private String readTextFile(InputStream inputStream) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        byte[] buf = new byte[1024];
        int len;
        try {
            while ((len = inputStream.read(buf)) != -1) {
                outputStream.write(buf, 0, len);
            }
            outputStream.close();
            inputStream.close();
        } catch (IOException e) {
            Log.e("CanteenService", "Error reading text file", e);
        }
        return outputStream.toString();
    }

    public interface OnFinishedListener {
        void onFinished(boolean success);
    }
}
