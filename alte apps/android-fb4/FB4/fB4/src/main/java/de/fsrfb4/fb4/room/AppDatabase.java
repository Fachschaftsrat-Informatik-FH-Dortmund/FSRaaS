package de.fsrfb4.fb4.room;

import androidx.room.Database;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;

@Database(entities = {RoomTimetableEvent.class, RoomNews.class, RoomNewsEconomy.class}, version = 1, exportSchema = false)
@TypeConverters({RoomConverters.class})
public abstract class AppDatabase extends RoomDatabase {
    public abstract TimetableEventDao timetableEventDao();
    public abstract NewsDao newsDao();
    public abstract NewsEconomyDao newsEconomyDao();
}
