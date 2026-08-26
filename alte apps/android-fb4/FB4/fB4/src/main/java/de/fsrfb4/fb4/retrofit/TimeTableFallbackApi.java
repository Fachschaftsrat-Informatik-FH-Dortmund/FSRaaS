package de.fsrfb4.fb4.retrofit;

import java.util.Map;

import de.fsrfb4.fb4.retrofit.timetable.CourseOfStudy;
import retrofit2.Call;
import retrofit2.http.GET;

/**
 * Created by Özgür on 29.03.2017.
 */

public interface TimeTableFallbackApi {

    @GET("/studiengaenge.json")
    Call<Map<String, CourseOfStudy>> getListOfCourseOfStudies();
}
