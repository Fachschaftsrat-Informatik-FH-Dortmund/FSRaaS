package de.fsrfb4.fb4.room;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.google.common.util.concurrent.ListenableFuture;

import java.util.List;

@Dao
public interface NewsEconomyDao {
    @Query("SELECT * FROM news_economy ORDER BY pinned DESC")
    List<RoomNewsEconomy> getAll();

    @Query("SELECT * FROM news_economy ORDER BY pinned DESC")
    LiveData<List<RoomNewsEconomy>> getAllLiveData();

    @Query("SELECT * FROM news_economy ORDER BY pinned DESC")
    ListenableFuture<List<RoomNewsEconomy>> getAllAsync();

    @Query("SELECT * FROM news_economy WHERE pinned = 1")
    List<RoomNewsEconomy> getPinnedNews();

    @Query("SELECT * FROM news_economy WHERE pinned = 0")
    List<RoomNewsEconomy> getUnpinnedNews();

    @Query("SELECT * FROM news_economy WHERE pinned = 0")
    ListenableFuture<List<RoomNewsEconomy>> getUnpinnedNewsAsync();

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<RoomNewsEconomy> newsList);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    ListenableFuture<List<Long>> insertAllAsync(List<RoomNewsEconomy> newsList);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(RoomNewsEconomy newsEconomy);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    ListenableFuture<Long> insertAsync(RoomNewsEconomy newsEconomy);

    @Delete
    void delete(RoomNewsEconomy news);

    @Delete
    ListenableFuture<Integer> deleteAsync(RoomNewsEconomy news);
}
