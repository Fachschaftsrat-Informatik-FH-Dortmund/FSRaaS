package de.fsrfb4.fb4.module;

import android.content.Context;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.android.qualifiers.ApplicationContext;
import dagger.hilt.components.SingletonComponent;
import de.fsrfb4.fb4.FB4;
import de.fsrfb4.fb4.retrofit.DataUpdateApi;
import de.fsrfb4.fb4.retrofit.HisApi;
import de.fsrfb4.fb4.retrofit.NewsApi;
import de.fsrfb4.fb4.retrofit.MenuApi;
import de.fsrfb4.fb4.retrofit.ServerMessageApi;
import de.fsrfb4.fb4.retrofit.TimeTableFallbackApi;
import de.fsrfb4.fb4.retrofit.TimetableApi;
import de.fsrfb4.fb4.service.DataService;
import de.fsrfb4.fb4.service.NewsService;
import de.fsrfb4.fb4.util.Convert;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.converter.scalars.ScalarsConverterFactory;

@Module
@InstallIn(SingletonComponent.class)
public class NetworkModule {

    @Provides
    @Singleton
    public ServerMessageApi provideServerMessageApi(OkHttpClient client, Gson gson) {
        return new Retrofit.Builder()
                .client(client)
                .baseUrl("https://app.fsrfb4.de")
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
                .create(ServerMessageApi.class);
    }

    @Provides
    @Singleton
    public DataUpdateApi provideDataUpdateApi(OkHttpClient client, Gson gson) {
        return new Retrofit.Builder()
                .client(client)
                .baseUrl("https://app.fsrfb4.de")
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
                .create(DataUpdateApi.class);
    }

    @Provides
    @Singleton
    public HisApi provideHisApi(@ApplicationContext Context context) {
        return new Retrofit.Builder()
                .client(FB4.getOkHttpClientBuilder(context, true).build())
                .baseUrl("https://portal.fh-dortmund.de")
                .addConverterFactory(ScalarsConverterFactory.create())
                .build()
                .create(HisApi.class);
    }

    @Provides
    @Singleton
    public TimetableApi provideTimetableApi(OkHttpClient client) {
        return createTimeTableRetrofit(client, "http://ws.inf.fh-dortmund.de/")
                .create(TimetableApi.class);
    }

    @Provides
    @Singleton
    public TimeTableFallbackApi provideTimeTableFallbackApi(OkHttpClient client) {
        return createTimeTableRetrofit(client, "https://app.fsrfb4.de")
                .create(TimeTableFallbackApi.class);
    }

    @Provides
    @Singleton
    public NewsApi provideNewsApi(OkHttpClient client) {
        return new Retrofit.Builder()
            .baseUrl("https://www.inf.fh-dortmund.de/")
            .addConverterFactory(ScalarsConverterFactory.create())
            .client(client)
            .build()
            .create(NewsApi.class);
    }


    @Provides
    @Singleton
    public MenuApi provideMenuApi(OkHttpClient client, Gson gson) {
        return new Retrofit.Builder()
                .client(client)
                .baseUrl("https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/")
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
                .create(MenuApi.class);
    }

    private Retrofit createTimeTableRetrofit(OkHttpClient client, String baseUrl) {
        Gson customGson = new GsonBuilder().registerTypeAdapter(LocalDate.class, new TypeAdapter<LocalDate>() {
                @Override
                public void write(JsonWriter out, LocalDate value) throws IOException {
                    if (value == null) {
                        out.nullValue();
                    } else {
                        out.value(value.atStartOfDay(ZoneId.systemDefault()).toEpochSecond());
                    }
                }

                @Override
                public LocalDate read(JsonReader in) throws IOException {
                    if (in.peek() == com.google.gson.stream.JsonToken.NULL) {
                        in.nextNull();
                        return null;
                    }
                    return Instant.ofEpochSecond(in.nextLong()).atZone(ZoneId.systemDefault()).toLocalDate();
                }
            })
            .registerTypeAdapter(LocalTime.class, new TypeAdapter<LocalTime>() {
                @Override
                public void write(JsonWriter out, LocalTime value) throws IOException {
                    if (value == null) {
                        out.nullValue();
                    } else {
                        out.value(String.valueOf(Convert.toInt(value)));
                    }
                }

                @Override
                public LocalTime read(JsonReader in) throws IOException {
                    if (in.peek() == com.google.gson.stream.JsonToken.NULL) {
                        in.nextNull();
                        return null;
                    }
                    int intValue = Integer.valueOf(in.nextString());
                    return Convert.toLocalTime(intValue);
                }
            })
            .create();

        return new Retrofit.Builder()
                .client(client)
                .baseUrl(baseUrl)
                .addConverterFactory(GsonConverterFactory.create(customGson))
                .build();
    }
}
