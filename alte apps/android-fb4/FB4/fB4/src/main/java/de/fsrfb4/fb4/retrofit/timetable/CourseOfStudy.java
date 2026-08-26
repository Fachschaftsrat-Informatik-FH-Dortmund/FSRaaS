package de.fsrfb4.fb4.retrofit.timetable;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseOfStudy implements Serializable {

    @SerializedName("sname")
    private String id;

    @SerializedName("name")
    private String name;

    @SerializedName("grades")
    private List<CourseOfStudyGrade> grades = new ArrayList<>();
}
