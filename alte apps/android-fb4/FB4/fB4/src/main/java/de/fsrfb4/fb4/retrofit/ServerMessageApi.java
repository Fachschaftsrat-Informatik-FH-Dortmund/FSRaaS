package de.fsrfb4.fb4.retrofit;

import de.fsrfb4.fb4.model.ServerMessage;
import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.POST;

/**
 * Created by Özgür on 24.09.2016.
 */

public interface ServerMessageApi {

    @FormUrlEncoded
    @POST("/messages/messages.php")
    Call<ServerMessage[]> getMessage(@Field("Sprache") String lang, @Field("API") String api, @Field("VersionCode") String version);
}
