package de.fsrfb4.fb4.retrofit;

import de.fsrfb4.fb4.service.NewsService;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Path;

public interface NewsApi {
    @GET("/aktuelles-ni/seite")
    Call<String> getNews();

    @GET("/aktuelles-ni/seite/{page}")
    Call<String> getNewsPage(@Path("page") int page);


    @GET("/de/fb/9/studiengaenge/400/aktuelles_stud.php")
    Call<String> getNewsEconomy();
}
