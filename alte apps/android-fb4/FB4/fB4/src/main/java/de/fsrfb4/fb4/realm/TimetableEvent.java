package de.fsrfb4.fb4.realm;


import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Date;

import de.fsrfb4.fb4.fragments.timetable.TimetableFragment;
import de.fsrfb4.fb4.util.Convert;
import io.realm.RealmObject;
import io.realm.annotations.PrimaryKey;
import lombok.Getter;
import lombok.Setter;

/**
 * @author Lars Grefer
 */
@Getter
@Setter
public class TimetableEvent extends RealmObject {

    @PrimaryKey
    private int id;

    private String name;

    private int day;
    private int startTime;
    private int endTime;

    private String courseType;
    private String courseId;

    private String lecturerId;
    private String lecturerName;
    private String studentSet;
    private String roomId;

    private int color;

    private Date invalidUntil;
    private Date temporaryUntil;

    public LocalTime getStartTime() {
        return Convert.toLocalTime(startTime);
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = Convert.toInt(startTime);
    }

    public LocalTime getEndTime() {
        return Convert.toLocalTime(endTime);
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = Convert.toInt(endTime);
        if (isInvalid()) {
            setInvalidUntil(true);
        } else if (isTemporary()) {
            setTemporary();
        }
    }

    public void setDay(DayOfWeek day) {
        this.day = day.getValue();
        if (isInvalid()) {
            setInvalidUntil(true);
        } else if (isTemporary()) {
            setTemporary();
        }
    }

    public DayOfWeek getDay() {
        return DayOfWeek.of(day);
    }

    public void setInvalidUntil(LocalDateTime invalidUntil) {
        this.invalidUntil = invalidUntil == null ? null : Date.from(invalidUntil.atZone(ZoneId.systemDefault()).toInstant());
    }

    private void setInvalidUntil(boolean invalid) {
        if (invalid) {
            invalidUntil = Date.from(TimetableFragment.nextDayOfWeek(getDay(), LocalDateTime.now(), getEndTime()).atZone(ZoneId.systemDefault()).toInstant());
        } else {
            invalidUntil = null;
        }
    }

    public boolean isInvalid() {
        return invalidUntil != null && LocalDateTime.ofInstant(invalidUntil.toInstant(), ZoneId.systemDefault()).isAfter(LocalDateTime.now());
    }

    public void setTemporaryUntil(LocalDateTime temporaryUntil) {
        this.temporaryUntil = Date.from(temporaryUntil.atZone(ZoneId.systemDefault()).toInstant());
    }

    private void setTemporary() {
        temporaryUntil = Date.from(TimetableFragment.nextDayOfWeek(getDay(), LocalDateTime.now(), getEndTime()).atZone(ZoneId.systemDefault()).toInstant());
    }

    private boolean isTemporary() {
        return temporaryUntil != null;
    }

}
