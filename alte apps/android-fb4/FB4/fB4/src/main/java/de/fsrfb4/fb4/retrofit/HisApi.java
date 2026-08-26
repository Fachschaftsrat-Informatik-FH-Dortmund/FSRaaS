package de.fsrfb4.fb4.retrofit;

import java.util.Map;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FieldMap;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface HisApi {
    @FormUrlEncoded
    @POST("/qisserver/rds?state=user&type=1&category=auth.login")
    Call<String> login(@Field("asdf") String username, @Field("fdsa") String password);

    @GET("/qisserver/rds?state=user&type=3&category=auth.logout")
    Call<Void> logout();

    @GET("/qisserver/pages/fhdo/cm/stu/fhService/start.xhtml?_flowId=fhService-flow")
    Call<String> getNrwTicketPage();

    @FormUrlEncoded
    @POST("/qisserver/pages/fhdo/cm/stu/fhService/start.xhtml?_flowId=fhService-flow&_flowExecutionKey=e1s1")
    Call<ResponseBody> downloadTicket(@FieldMap Map<String, String> fields);
}
