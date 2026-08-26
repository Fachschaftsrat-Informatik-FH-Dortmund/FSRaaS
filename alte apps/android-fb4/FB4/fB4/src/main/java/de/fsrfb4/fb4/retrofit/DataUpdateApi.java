package de.fsrfb4.fb4.retrofit;

import de.fsrfb4.fb4.retrofit.dataupdate.UpdatedData;
import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface DataUpdateApi {
    @FormUrlEncoded
    @POST("/data")
    Call<UpdatedData> getUpdatedData(@Field("Key") String key);

    @GET("/data")
    Call<UpdatedData[]> getUpdatedData();
}
