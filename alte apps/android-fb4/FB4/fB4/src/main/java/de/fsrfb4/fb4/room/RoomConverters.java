package de.fsrfb4.fb4.room;

import androidx.room.TypeConverter;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Date;

public class RoomConverters {
    @TypeConverter
    public static Date fromTimestamp(Long value) {
        return value == null ? null : new Date(value);
    }

    @TypeConverter
    public static Long dateToTimestamp(Date date) {
        return date == null ? null : date.getTime();
    }

    @TypeConverter
    public static LocalDateTime fromTimestampToLocalDateTime(Long value) {
        return value == null ? null : LocalDateTime.ofInstant(Instant.ofEpochMilli(value), ZoneId.systemDefault());
    }

    @TypeConverter
    public static Long localDateTimeToTimestamp(LocalDateTime date) {
        return date == null ? null : date.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    @TypeConverter
    public static LocalTime fromLongToLocalTime(Long value) {
        return value == null ? null : LocalTime.ofNanoOfDay(value);
    }

    @TypeConverter
    public static Long localTimeToLong(LocalTime time) {
        return time == null ? null : time.toNanoOfDay();
    }

    @TypeConverter
    public static DayOfWeek fromIntegerToDayOfWeek(Integer value) {
        return value == null ? null : DayOfWeek.of(value);
    }

    @TypeConverter
    public static Integer dayOfWeekToInteger(DayOfWeek day) {
        return day == null ? null : day.getValue();
    }
}
