package de.fsrfb4.fb4.service;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.MoreExecutors;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import javax.inject.Inject;
import javax.inject.Singleton;

import de.fsrfb4.fb4.room.RoomTimetableEvent;
import de.fsrfb4.fb4.room.TimetableEventDao;
import lombok.extern.slf4j.Slf4j;

/**
 * Service Klasse für {@link RoomTimetableEvent Events}
 *
 * @author Lars Grefer
 */
@Slf4j
@Singleton
public class EventService {

    private final TimetableEventDao timetableEventDao;

    @Inject
    public EventService(TimetableEventDao timetableEventDao) {
        this.timetableEventDao = timetableEventDao;
    }

    public ListenableFuture<Integer> cleanupOldEvents() {
        return timetableEventDao.cleanupOldEventsAsync(LocalDateTime.now());
    }

    public ListenableFuture<Integer> deleteEvent(final int eventId) {
        return timetableEventDao.deleteByIdAsync(eventId);
    }

    public ListenableFuture<Integer> changeColor(final int eventId, final int color) {
        return timetableEventDao.updateColorAsync(eventId, color);
    }

    public ListenableFuture<Void> moveOnce(final int eventId, final DayOfWeek newDay, final LocalTime newTime) {
        ListenableFuture<RoomTimetableEvent> future = timetableEventDao.getByIdAsync(eventId);
        return Futures.transformAsync(future, event -> {
            if (event == null) {
                return Futures.immediateFuture(null);
            }

            Duration period = Duration.between(event.getStartTime(), event.getEndTime());
            LocalTime newEndTime = newTime.plus(period);

            RoomTimetableEvent copy = new RoomTimetableEvent();
            copy.setName(event.getName());
            copy.setCourseType(event.getCourseType());
            copy.setCourseId(event.getCourseId());
            copy.setLecturerId(event.getLecturerId());
            copy.setLecturerName(event.getLecturerName());
            copy.setStudentSet(event.getStudentSet());
            copy.setRoomId(event.getRoomId());
            copy.setColor(event.getColor());
            copy.setInvalidUntil(event.getInvalidUntil());

            copy.setDay(newDay);
            copy.setStartTime(newTime);
            copy.setEndTime(newEndTime);

            LocalDate now = LocalDate.now();
            LocalDate newEventEndDate = now.with(newDay);
            if (now.isAfter(newEventEndDate)) {
                newEventEndDate = newEventEndDate.plusWeeks(1);
            }

            LocalDateTime dateTime = newEventEndDate.atTime(newEndTime);

            copy.setTemporaryUntil(dateTime);
            event.setInvalidUntil(dateTime);

            ListenableFuture<Long> insertCopy = timetableEventDao.insertAsync(copy);
            ListenableFuture<Long> updateEvent = timetableEventDao.insertAsync(event);

            return Futures.whenAllComplete(insertCopy, updateEvent).call(() -> null, MoreExecutors.directExecutor());
        }, MoreExecutors.directExecutor());
    }
}
