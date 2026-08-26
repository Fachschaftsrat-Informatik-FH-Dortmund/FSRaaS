package de.fsrfb4.fb4.retrofit.timetable;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseOfStudyGrade implements Serializable {

    @SerializedName("grade")
    private String grade;
}
