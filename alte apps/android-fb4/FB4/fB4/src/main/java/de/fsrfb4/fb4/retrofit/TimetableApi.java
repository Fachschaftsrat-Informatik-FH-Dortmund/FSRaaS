package de.fsrfb4.fb4.retrofit;

import java.util.List;
import java.util.Map;

import de.fsrfb4.fb4.retrofit.timetable.CourseOfStudy;
import de.fsrfb4.fb4.retrofit.timetable.Event;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Path;

public interface TimetableApi {

    @GET("/timetable/current/rest/CourseOfStudy/?Accept=application/json")
    Call<Map<String, CourseOfStudy>> getListOfCourseOfStudies();

    @GET("/timetable/current/rest/CourseOfStudy/{studiengang}/{semester}/Events?Accept=application/json")
    Call<List<Event>> getEvents(
        @Path("studiengang") String studiengang,
        @Path("semester") String semester
    );

    @GET("/timetable/current/rest/Room/*/AllEvents?Accept=application/json")
    Call<List<Event>> getAllEvents();
}
