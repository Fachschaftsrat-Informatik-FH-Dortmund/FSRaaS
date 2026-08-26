package de.fsrfb4.fb4.room;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.google.common.util.concurrent.ListenableFuture;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.List;

@Dao
public interface TimetableEventDao {
    @Query("SELECT * FROM timetable_event")
    List<RoomTimetableEvent> getAll();

    @Query("SELECT * FROM timetable_event")
    LiveData<List<RoomTimetableEvent>> getAllLiveData();

    @Query("SELECT * FROM timetable_event")
    ListenableFuture<List<RoomTimetableEvent>> getAllAsync();

    @Query("SELECT * FROM timetable_event WHERE id = :id LIMIT 1")
    RoomTimetableEvent getById(int id);

    @Query("SELECT * FROM timetable_event WHERE id = :id LIMIT 1")
    ListenableFuture<RoomTimetableEvent> getByIdAsync(int id);

    @Query("SELECT * FROM timetable_event WHERE day = :day ORDER BY startTime ASC")
    List<RoomTimetableEvent> getEventsForDay(DayOfWeek day);

    @Query("SELECT * FROM timetable_event WHERE day = :day ORDER BY startTime ASC")
    LiveData<List<RoomTimetableEvent>> getEventsForDayLiveData(DayOfWeek day);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    long insert(RoomTimetableEvent event);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    ListenableFuture<Long> insertAsync(RoomTimetableEvent event);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<RoomTimetableEvent> events);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    ListenableFuture<List<Long>> insertAllAsync(List<RoomTimetableEvent> events);

    @Query("DELETE FROM timetable_event WHERE temporaryUntil IS NOT NULL AND temporaryUntil <= :now")
    void cleanupOldEvents(LocalDateTime now);

    @Query("DELETE FROM timetable_event WHERE temporaryUntil IS NOT NULL AND temporaryUntil <= :now")
    ListenableFuture<Integer> cleanupOldEventsAsync(LocalDateTime now);

    @Query("DELETE FROM timetable_event WHERE id = :eventId")
    void deleteById(int eventId);

    @Query("DELETE FROM timetable_event WHERE id = :eventId")
    ListenableFuture<Integer> deleteByIdAsync(int eventId);

    @Query("UPDATE timetable_event SET color = :color WHERE id = :eventId")
    void updateColor(int eventId, int color);

    @Query("UPDATE timetable_event SET color = :color WHERE id = :eventId")
    ListenableFuture<Integer> updateColorAsync(int eventId, int color);

    @Query("DELETE FROM timetable_event")
    void deleteAll();

    @Query("DELETE FROM timetable_event")
    ListenableFuture<Integer> deleteAllAsync();
}
