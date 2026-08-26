package de.fsrfb4.fb4.model;

import java.io.Serializable;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WeeklyMenu implements Serializable {
    public static final String SP_KEY_WEEKLYMENU = "WeeklyMenu";

    private Map<LocalDate, Day> days;

    private LocalDateTime date;
    private String canteenId;
    private transient boolean old;

    private Map<String, String> types;
    private Map<String, String> additives;

    public WeeklyMenu() {
        days = new HashMap<>();
        types = new HashMap<>();
        additives = new HashMap<>();
    }

    @Getter
    @Setter
    public static class Day implements Serializable {
        private List<Dish> dishes;
        private LocalTime openingStart;
        private LocalTime openingEnd;

        public Day() {
            dishes = new ArrayList<>();
        }
    }

    public void setDishesForDate(List<Dish> dishes, LocalDate date) {
        Collections.sort(dishes);
        Day day = days.computeIfAbsent(date, k -> new Day());
        day.setDishes(dishes);
    }

    public void setOpeningTimeForDate(LocalDate date, LocalTime start, LocalTime end) {
        Day day = days.computeIfAbsent(date, k -> new Day());
        day.setOpeningStart(start);
        day.setOpeningEnd(end);
    }

    public List<Dish> getDishesForDate(LocalDate date) {
        Day day = days.get(date);
        return day != null ? day.getDishes() : new ArrayList<>();
    }

    public LocalTime getOpeningStartForDate(LocalDate date) {
        Day day = days.get(date);
        return day != null ? day.getOpeningStart() : null;
    }

    public LocalTime getOpeningEndForDate(LocalDate date) {
        Day day = days.get(date);
        return day != null ? day.getOpeningEnd() : null;
    }

    // Legacy support
    public void setDishesForDay(List<Dish> dishes, DayOfWeek dayOfWeek) {
        LocalDate nextDay = LocalDate.now();
        while (nextDay.getDayOfWeek() != dayOfWeek) {
            nextDay = nextDay.plusDays(1);
        }
        setDishesForDate(dishes, nextDay);
    }

    // Legacy support
    public List<Dish> getDishesForDay(DayOfWeek dayOfWeek) {
        for (Map.Entry<LocalDate, Day> entry : days.entrySet()) {
            if (entry.getKey().getDayOfWeek() == dayOfWeek) {
                return entry.getValue().getDishes();
            }
        }
        return new ArrayList<>();
    }

    public Map<String, String> getTypes() {
        return types;
    }

    public void setTypes(Map<String, String> types) {
        this.types = types;
    }

    public Map<String, String> getAdditives() {
        return additives;
    }

    public void setAdditives(Map<String, String> additives) {
        this.additives = additives;
    }

    public List<LocalDate> getDates() {
        return days.keySet().stream().sorted().collect(Collectors.toList());
    }

    public boolean isEmpty() {
        return days.isEmpty();
    }

    public int getAgeInMinutes() {
        return (int) ChronoUnit.MINUTES.between(date, LocalDateTime.now());
    }
}
