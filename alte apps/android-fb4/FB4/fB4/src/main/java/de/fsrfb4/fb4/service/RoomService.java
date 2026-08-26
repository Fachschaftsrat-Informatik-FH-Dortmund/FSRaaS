package de.fsrfb4.fb4.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import de.fsrfb4.fb4.model.Room;
import de.fsrfb4.fb4.retrofit.TimetableApi;
import de.fsrfb4.fb4.retrofit.timetable.Event;
import de.fsrfb4.fb4.util.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RoomService {
    private final DataService dataService;
    private final TimetableApi timetableApi;

    @Inject
    public RoomService(DataService dataService, TimetableApi timetableApi) {
        this.dataService = dataService;
        this.timetableApi = timetableApi;
    }

    public List<Room> getRooms() {
        String json = dataService.getRooms();
        if (json != null) {
            return new Gson().fromJson(json, new TypeToken<List<Room>>() { }.getType());
        } else {
            return new ArrayList<>();
        }
    }

    public Call<List<Room>> getFreeRooms(LocalDateTime start, LocalDateTime end) {
        return callback -> timetableApi.getAllEvents().enqueue(new Callback<>() {
            @Override
            public void onResponse(retrofit2.Call<List<Event>> call, Response<List<Event>> response) {
                if (response.isSuccessful()) {
                    List<Event> events = response.body();
                    List<Room> rooms = getRooms();


                    events.stream().filter(event -> event.getDateBegin().isEqual(start.toLocalDate())).forEach(event -> {
                        var roomOptional = rooms.stream().filter(r -> r.getName().equals(event.getRoomId())).findFirst();
                        if (roomOptional.isEmpty()) {
                            return;
                        }
                        var room = roomOptional.get();

                        if (start.toLocalTime().isBefore(event.getTimeEnd()) && event.getTimeBegin().isBefore(end.toLocalTime())) {
                            rooms.remove(room);
                        } else if (event.getTimeBegin().isAfter(end.toLocalTime()) && (room.getFreeUntil() == null || event.getTimeBegin().isBefore(room.getFreeUntil()))) {
                            room.setFreeUntil(event.getTimeBegin());
                        }
                    });

                    rooms.stream()
                        .filter(r -> r.getFreeUntil() == null)
                        .forEach(r -> r.setFreeUntil(LocalTime.of(21, 30))); //TODO

                    callback.onSuccess(rooms);
                } else {
                    callback.onFailure(new IOException(response.message()));
                }
            }

            @Override
            public void onFailure(retrofit2.Call<List<Event>> call, Throwable throwable) {
                callback.onFailure(throwable);
            }
        });
    }
}
