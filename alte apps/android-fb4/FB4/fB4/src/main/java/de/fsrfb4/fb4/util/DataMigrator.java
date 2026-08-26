package de.fsrfb4.fb4.util;

import android.content.Context;
import android.os.Bundle;

import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.Futures;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import de.fsrfb4.fb4.realm.TimetableEvent;
import de.fsrfb4.fb4.room.AppDatabase;
import de.fsrfb4.fb4.room.RoomTimetableEvent;
import io.realm.Realm;

public final class DataMigrator {
    private DataMigrator() { }

    public static void migrateRealmToRoom(Context context, AppDatabase appDatabase) {
        OneTimeActionHelper.doOnce(context, () -> {
            FirebaseAnalytics firebaseAnalytics = FirebaseAnalytics.getInstance(context);
            firebaseAnalytics.logEvent(FirebaseAnalyticsEvents.ROOM_MIGRATION_STARTED, null);

            try (Realm realm = Realm.getDefaultInstance()) {
                List<TimetableEvent> realmEvents = realm.where(TimetableEvent.class).findAll();
                List<RoomTimetableEvent> roomEvents = new ArrayList<>();
                for (TimetableEvent rEvent : realmEvents) {
                    RoomTimetableEvent event = new RoomTimetableEvent();
                    event.setId(rEvent.getId());
                    event.setDay(rEvent.getDay());
                    event.setStartTime(rEvent.getStartTime());
                    event.setEndTime(rEvent.getEndTime());
                    event.setName(rEvent.getName());
                    event.setCourseType(rEvent.getCourseType());
                    event.setCourseId(rEvent.getCourseId());
                    event.setLecturerId(rEvent.getLecturerId());
                    event.setLecturerName(rEvent.getLecturerName());
                    event.setStudentSet(rEvent.getStudentSet());
                    event.setRoomId(rEvent.getRoomId());
                    event.setColor(rEvent.getColor());

                    if (rEvent.getTemporaryUntil() != null) {
                        event.setTemporaryUntil(LocalDateTime.ofInstant(rEvent.getTemporaryUntil().toInstant(), ZoneId.systemDefault()));
                    }
                    if (rEvent.getInvalidUntil() != null) {
                        event.setInvalidUntil(LocalDateTime.ofInstant(rEvent.getInvalidUntil().toInstant(), ZoneId.systemDefault()));
                    }

                    roomEvents.add(event);
                }
                Futures.addCallback(appDatabase.timetableEventDao().insertAllAsync(roomEvents), new FutureCallback<>() {
                    @Override
                    public void onSuccess(List<Long> result) {
                        firebaseAnalytics.logEvent(FirebaseAnalyticsEvents.ROOM_MIGRATION_FINISHED, null);
                    }

                    @Override
                    public void onFailure(Throwable t) {
                        Bundle bundle = new Bundle();
                        bundle.putString(FirebaseAnalyticsEvents.Param.EXCEPTION, t.toString());
                        firebaseAnalytics.logEvent(FirebaseAnalyticsEvents.ROOM_MIGRATION_FAILED, bundle);
                        FirebaseCrashlytics.getInstance().recordException(t);
                    }
                }, ContextCompat.getMainExecutor(context));

            } catch (Exception e) {
                Bundle bundle = new Bundle();
                bundle.putString(FirebaseAnalyticsEvents.Param.EXCEPTION, e.toString());
                firebaseAnalytics.logEvent(FirebaseAnalyticsEvents.ROOM_MIGRATION_FAILED, bundle);
                FirebaseCrashlytics.getInstance().recordException(e);
            }
        }, "migrate_realm_to_room_v1");
    }
}
