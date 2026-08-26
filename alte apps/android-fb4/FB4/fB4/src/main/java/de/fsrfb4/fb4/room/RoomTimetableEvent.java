package de.fsrfb4.fb4.room;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;

import de.fsrfb4.fb4.fragments.timetable.TimetableFragment;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity(tableName = "timetable_event")
public class RoomTimetableEvent {

    @PrimaryKey(autoGenerate = true)
    private int id;

    private String name;

    private DayOfWeek day;
    private LocalTime startTime;
    private LocalTime endTime;

    private String courseType;
    private String courseId;

    private String lecturerId;
    private String lecturerName;
    private String studentSet;
    private String roomId;

    private int color;

    private LocalDateTime invalidUntil;
    private LocalDateTime temporaryUntil;

    public void setDay(DayOfWeek day) {
        this.day = day;
        if (isInvalid()) {
            setIsInvalid(true);
        } else if (isTemporary()) {
            setTemporary();
        }
    }

    private void setIsInvalid(boolean invalid) {
        if (invalid) {
            invalidUntil = TimetableFragment.nextDayOfWeek(getDay(), LocalDateTime.now(), getEndTime());
        } else {
            invalidUntil = null;
        }
    }

    public boolean isInvalid() {
        return invalidUntil != null && invalidUntil.isAfter(LocalDateTime.now());
    }

    private void setTemporary() {
        temporaryUntil = TimetableFragment.nextDayOfWeek(getDay(), LocalDateTime.now(), getEndTime());
    }

    private boolean isTemporary() {
        return temporaryUntil != null;
    }
}
