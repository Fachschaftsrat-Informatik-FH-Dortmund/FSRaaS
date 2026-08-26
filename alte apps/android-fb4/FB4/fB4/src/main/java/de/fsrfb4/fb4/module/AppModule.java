package de.fsrfb4.fb4.module;

import android.content.Context;

import androidx.room.Room;

import com.google.gson.Gson;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.android.qualifiers.ApplicationContext;
import dagger.hilt.components.SingletonComponent;
import de.fsrfb4.fb4.FB4;
import de.fsrfb4.fb4.retrofit.DataUpdateApi;
import de.fsrfb4.fb4.retrofit.MenuApi;
import de.fsrfb4.fb4.retrofit.NewsApi;
import de.fsrfb4.fb4.retrofit.TimetableApi;
import de.fsrfb4.fb4.room.AppDatabase;
import de.fsrfb4.fb4.room.NewsDao;
import de.fsrfb4.fb4.room.NewsEconomyDao;
import de.fsrfb4.fb4.room.TimetableEventDao;
import de.fsrfb4.fb4.service.CanteenService;
import de.fsrfb4.fb4.service.DataService;
import de.fsrfb4.fb4.service.EventService;
import de.fsrfb4.fb4.service.LinkService;
import de.fsrfb4.fb4.service.MenuService;
import de.fsrfb4.fb4.service.NewsService;
import de.fsrfb4.fb4.service.RoomService;
import okhttp3.OkHttpClient;

@Module
@InstallIn(SingletonComponent.class)
public class AppModule {

    @Provides
    @Singleton
    public Gson provideGson() {
        return new Gson();
    }

    @Provides
    @Singleton
    public EventService provideEventService(TimetableEventDao timetableEventDao) {
        return new EventService(timetableEventDao);
    }

    @Provides
    @Singleton
    public CanteenService provideCanteenService(DataService dataService) {
        return new CanteenService(dataService);
    }

    @Provides
    @Singleton
    public MenuService provideMenuService(@ApplicationContext Context context, MenuApi menuApi) {
        return new MenuService(context, menuApi);
    }

    @Provides
    @Singleton
    public NewsService provideNewsService(@ApplicationContext Context context, NewsApi newsApi, AppDatabase appDatabase) {
        return new NewsService(newsApi, context, appDatabase);
    }

    @Provides
    @Singleton
    public AppDatabase provideAppDatabase(@ApplicationContext Context context) {
        return Room.databaseBuilder(context, AppDatabase.class, "database-name").build();
    }

    @Provides
    @Singleton
    public TimetableEventDao provideTimetableEventDao(AppDatabase appDatabase) {
        return appDatabase.timetableEventDao();
    }

    @Provides
    @Singleton
    public NewsDao provideNewsDao(AppDatabase appDatabase) {
        return appDatabase.newsDao();
    }

    @Provides
    @Singleton
    public NewsEconomyDao provideNewsEconomyDao(AppDatabase appDatabase) {
        return appDatabase.newsEconomyDao();
    }

    @Provides
    @Singleton
    public LinkService provideLinkService(DataService dataService) {
        return new LinkService(dataService);
    }

    @Provides
    @Singleton
    public DataService provideDataService(@ApplicationContext Context context, DataUpdateApi dataUpdateApi) {
        return new DataService(context, dataUpdateApi);
    }

    @Provides
    @Singleton
    public OkHttpClient provideOkHttpClient(@ApplicationContext Context context) {
        return FB4.getOkHttpClientBuilder(context, false).build();
    }

    @Provides
    @Singleton
    public RoomService provideRoomService(DataService dataService, TimetableApi timetableApi) {
        return new RoomService(dataService, timetableApi);
    }
}
