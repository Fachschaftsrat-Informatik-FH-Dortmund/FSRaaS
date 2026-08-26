package de.fsrfb4.fb4.retrofit;

import java.util.List;
import java.util.Map;

import de.fsrfb4.fb4.model.MenuInformationDto;
import de.fsrfb4.fb4.model.MenuDto;
import de.fsrfb4.fb4.model.OpeningsDto;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Path;

public interface MenuApi {
    @GET("/canteen-menu/v3/canteens/{id}/{date}")
    Call<List<MenuDto>> getMenuForDate(@Path("id") String id, @Path("date") String date);

    @GET("/canteen-menu/v3/canteens/{id}")
    Call<Map<String, List<MenuDto>>> getMenuForAllDates(@Path("id") String id);

    @GET("/canteen-menu/v3/canteens/{id}/openings/all")
    Call<OpeningsDto> getOpenings(@Path("id") String id);

    @GET("/canteen-menu/v3/types")
    Call<List<MenuInformationDto>> getTypes();

    @GET("/canteen-menu/v3/additives")
    Call<List<MenuInformationDto>> getAdditives();
}
