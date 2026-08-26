package de.fsrfb4.fb4.room;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.google.common.util.concurrent.ListenableFuture;

import java.time.LocalDateTime;
import java.util.List;

@Dao
public interface NewsDao {
    @Query("SELECT * FROM news ORDER BY pinned DESC, dateTime DESC")
    List<RoomNews> getAll();

    @Query("SELECT * FROM news ORDER BY pinned DESC, dateTime DESC")
    LiveData<List<RoomNews>> getAllLiveData();

    @Query("SELECT * FROM news ORDER BY pinned DESC, dateTime DESC")
    ListenableFuture<List<RoomNews>> getAllAsync();

    @Query("SELECT * FROM news WHERE pinned = 1")
    List<RoomNews> getPinnedNews();

    @Query("SELECT * FROM news WHERE pinned = 0")
    List<RoomNews> getUnpinnedNews();

    @Query("SELECT * FROM news WHERE pinned = 0")
    ListenableFuture<List<RoomNews>> getUnpinnedNewsAsync();

    @Query("SELECT * FROM news WHERE dateTime = :id LIMIT 1")
    RoomNews getById(LocalDateTime id);

    @Query("SELECT * FROM news WHERE dateTime = :id LIMIT 1")
    ListenableFuture<RoomNews> getByIdAsync(LocalDateTime id);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<RoomNews> newsList);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    ListenableFuture<List<Long>> insertAllAsync(List<RoomNews> newsList);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(RoomNews news);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    ListenableFuture<Long> insertAsync(RoomNews news);

    @Delete
    void delete(RoomNews news);

    @Delete
    ListenableFuture<Integer> deleteAsync(RoomNews news);
}
