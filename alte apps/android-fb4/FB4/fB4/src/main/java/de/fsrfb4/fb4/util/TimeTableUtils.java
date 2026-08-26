package de.fsrfb4.fb4.util;

import android.content.Context;
import android.util.Log;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.Executors;

import dagger.hilt.EntryPoints;
import de.fsrfb4.fb4.room.AppDatabase;
import de.fsrfb4.fb4.room.DatabaseEntryPoint;
import de.fsrfb4.fb4.room.RoomTimetableEvent;
import de.fsrfb4.fb4.room.TimetableEventDao;

/**
 * Created by Özgür on 30.03.2017.
 */

public final class TimeTableUtils {
    private static final String BACKUP_FILENAME = "Stundenplan.json";

    private TimeTableUtils() {
    }

    private static Gson getGson() {
        return new GsonBuilder()
            .registerTypeAdapter(LocalDateTime.class, new TypeAdapter<LocalDateTime>() {
                @Override
                public void write(JsonWriter out, LocalDateTime value) throws IOException {
                    if (value == null) {
                        out.nullValue();
                    } else {
                        out.value(value.toEpochSecond(ZoneOffset.UTC));
                    }
                }

                @Override
                public LocalDateTime read(JsonReader in) throws IOException {
                    if (in.peek() == JsonToken.NULL) {
                        in.nextNull();
                        return null;
                    }
                    return LocalDateTime.ofEpochSecond(in.nextLong(), 0, ZoneOffset.UTC);
                }
            })
            .registerTypeAdapter(LocalTime.class, new TypeAdapter<LocalTime>() {
                @Override
                public void write(JsonWriter out, LocalTime value) throws IOException {
                    if (value == null) {
                        out.nullValue();
                    } else {
                        out.value(value.toNanoOfDay());
                    }
                }

                @Override
                public LocalTime read(JsonReader in) throws IOException {
                    if (in.peek() == JsonToken.NULL) {
                        in.nextNull();
                        return null;
                    }
                    return LocalTime.ofNanoOfDay(in.nextLong());
                }
            })
            .create();
    }

    public static boolean backupExists(Context context) {
        File file = new File(context.getExternalFilesDir(null), BACKUP_FILENAME);
        return file.exists();
    }

    public static ListenableFuture<Boolean> restoreBackup(Context context) {
        return Futures.submitAsync(() -> {
            if (!backupExists(context)) {
                return Futures.immediateFuture(false);
            }
            File backup = new File(context.getExternalFilesDir(null), BACKUP_FILENAME);

            try (FileReader reader = new FileReader(backup)) {
                Gson gson = getGson();
                Type listType = new TypeToken<List<RoomTimetableEvent>>() { }.getType();
                List<RoomTimetableEvent> events = gson.fromJson(reader, listType);

                if (events != null && !events.isEmpty()) {
                    AppDatabase db = EntryPoints.get(context.getApplicationContext(), DatabaseEntryPoint.class).getAppDatabase();
                    TimetableEventDao dao = db.timetableEventDao();
                    db.runInTransaction(() -> {
                        dao.deleteAll();
                        dao.insertAll(events);
                    });
                    return Futures.immediateFuture(true);
                }
                return Futures.immediateFuture(false);
            } catch (Exception e) {
                FirebaseCrashlytics.getInstance().recordException(e);
                Log.e("TimeTableUtils", "restoreBackup", e);
                throw e;
            }
        }, Executors.newSingleThreadExecutor());
    }

    public static ListenableFuture<Boolean> createBackup(Context context) {
        AppDatabase db = EntryPoints.get(context.getApplicationContext(), DatabaseEntryPoint.class).getAppDatabase();
        TimetableEventDao dao = db.timetableEventDao();

        return Futures.transform(
            dao.getAllAsync(),
            events -> {
                if (events != null && !events.isEmpty()) {
                    try {
                        File file = new File(context.getExternalFilesDir(null), BACKUP_FILENAME);
                        if (file.exists()) {
                            file.delete();
                        }
                        Gson gson = getGson();
                        String json = gson.toJson(events);
                        try (FileWriter writer = new FileWriter(file)) {
                            writer.write(json);
                        }
                        return true;
                    } catch (Exception e) {
                        FirebaseCrashlytics.getInstance().recordException(e);
                        Log.e("TimeTableUtils", "createBackup", e);
                        return false;
                    }
                } else {
                    return false;
                }
            },
            Executors.newSingleThreadExecutor()
        );
    }
}
