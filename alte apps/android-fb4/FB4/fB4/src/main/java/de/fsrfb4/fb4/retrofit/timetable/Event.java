package de.fsrfb4.fb4.retrofit.timetable;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Event implements Serializable {

    @SerializedName("name")
    private String name;

    @SerializedName("eventType")
    private String eventType;

    @SerializedName("courseId")
    private String courseId;

    @SerializedName("courseOfStudy")
    private String courseOfStudy;

    @SerializedName("termId")
    private String termId;

    @SerializedName("grade")
    private String grade;

    @SerializedName("courseType")
    private String courseType;

    @SerializedName("lecturerId")
    private String lecturerId;

    @SerializedName("lecturerName")
    private String lecturerName;

    @SerializedName("studentSet")
    private String studentSet;

    @SerializedName("roomId")
    private String roomId;

    @SerializedName("dateBegin")
    private LocalDate dateBegin;

    @SerializedName("dateEnd")
    private LocalDate dateEnd;

    @SerializedName("timeBegin")
    private LocalTime timeBegin;

    @SerializedName("timeEnd")
    private LocalTime timeEnd;

    @SerializedName("timeSlotBegin")
    private int timeSlotBegin;

    @SerializedName("timeSlotDuration")
    private int timeSlotDuration;

    @SerializedName("timeSlotColum")
    private int timeSlotColumn;

    @SerializedName("weekday")
    private String weekday;

    @SerializedName("interval")
    private String interval;

    public DayOfWeek getDayOfWeek() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);
        return DayOfWeek.from(formatter.parse(getWeekday()));
    }

    public boolean isSameEvent(Event event) {
        if (this == event) {
            return true;
        }

        if (!grade.equals(event.grade)) {
            return false;
        }
        if (name != null ? !name.equals(event.name) : event.name != null) {
            return false;
        }
        if (eventType != null ? !eventType.equals(event.eventType) : event.eventType != null) {
            return false;
        }
        if (courseId != null ? !courseId.equals(event.courseId) : event.courseId != null) {
            return false;
        }
        if (courseOfStudy != null ? !courseOfStudy.equals(event.courseOfStudy) : event.courseOfStudy != null) {
            return false;
        }
        if (termId != null ? !termId.equals(event.termId) : event.termId != null) {
            return false;
        }
        if (courseType != null ? !courseType.equals(event.courseType) : event.courseType != null) {
            return false;
        }
        if (lecturerId != null ? !lecturerId.equals(event.lecturerId) : event.lecturerId != null) {
            return false;
        }
        if (lecturerName != null ? !lecturerName.equals(event.lecturerName) : event.lecturerName != null) {
            return false;
        }
        if (studentSet != null ? !studentSet.equals(event.studentSet) : event.studentSet != null) {
            return false;
        }
        if (roomId != null ? !roomId.equals(event.roomId) : event.roomId != null) {
            return false;
        }
        if (weekday != null ? !weekday.equals(event.weekday) : event.weekday != null) {
            return false;
        }
        return interval != null ? interval.equals(event.interval) : event.interval == null;

    }
}
