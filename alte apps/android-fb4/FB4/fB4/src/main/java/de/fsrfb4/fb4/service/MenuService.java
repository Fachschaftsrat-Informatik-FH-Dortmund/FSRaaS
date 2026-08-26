package de.fsrfb4.fb4.service;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.preference.PreferenceManager;

import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import de.fsrfb4.fb4.model.Canteen;
import de.fsrfb4.fb4.model.Dish;
import de.fsrfb4.fb4.model.MenuDto;
import de.fsrfb4.fb4.model.OpeningsDto;
import de.fsrfb4.fb4.model.MenuInformationDto;
import de.fsrfb4.fb4.model.WeeklyMenu;
import de.fsrfb4.fb4.retrofit.MenuApi;
import de.fsrfb4.fb4.util.LocalDateTimeSerializer;
import retrofit2.Response;

public class MenuService {
    private final Context context;
    private final MenuApi menuApi;

    public MenuService(Context context, MenuApi menuApi) {
        this.context = context;
        this.menuApi = menuApi;
    }

    public WeeklyMenu getWeeklyMenu(Canteen canteen) {
        WeeklyMenu weeklyMenu;
        try {
            weeklyMenu = fetchWeeklyMenu(canteen);
            weeklyMenu.setCanteenId(canteen.getId());
            writeMenuToStorage(weeklyMenu, canteen.getId());
        } catch (Exception e) {
            e.printStackTrace();
            weeklyMenu = readMenuFromStorage(canteen.getId());
            if (weeklyMenu != null) {
                weeklyMenu.setOld(true);
            }
        }
        return weeklyMenu;
    }

    private WeeklyMenu fetchWeeklyMenu(Canteen canteen) throws Exception {
        WeeklyMenu weeklyMenu = new WeeklyMenu();
        weeklyMenu.setDate(LocalDateTime.now());

        if (canteen.getItmcId() == null || canteen.getItmcId().isEmpty()) {
            return weeklyMenu;
        }

        boolean isGerman = Locale.getDefault().getLanguage().equals("de");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);

        // Fetch menu
        Response<Map<String, List<MenuDto>>> response = menuApi.getMenuForAllDates(canteen.getItmcId()).execute();

        if (response.isSuccessful() && response.body() != null) {
            Map<String, List<MenuDto>> body = response.body();

            for (Map.Entry<String, List<MenuDto>> entry : body.entrySet()) {
                String dateStr = entry.getKey();
                LocalDate parsedDate;
                try {
                    parsedDate = LocalDate.parse(dateStr, formatter);
                } catch (Exception e) {
                    continue; // Skip invalid dates
                }

                // Load current and future dates, as well as past days of the current week.
                if (parsedDate.isBefore(monday)) {
                    continue;
                }

                List<Dish> dishes = new ArrayList<>();
                for (MenuDto dto : entry.getValue()) {
                    if (dto.getCounterNames() != null && ("Beilagen".equals(dto.getCounterNames().getDe()) || "Side dishes".equals(dto.getCounterNames().getEn()))) {
                        continue;
                    }

                    if (dto.getTitle() == null) {
                        continue;
                    }
                    String description = isGerman ? dto.getTitle().getDe() : dto.getTitle().getEn();
                    if (description == null) {
                        description = dto.getTitle().getDe() != null ? dto.getTitle().getDe() : "";
                    }

                    String supplies = "";
                    if (dto.getAdditives() != null && !dto.getAdditives().isEmpty()) {
                        supplies = String.join(", ", dto.getAdditives());
                    }

                    String typesRaw = "";
                    if (dto.getType() != null && !dto.getType().isEmpty()) {
                        typesRaw = String.join(", ", dto.getType());
                    }

                    String additivesRaw = supplies;

                    String category = dto.getCategory(); // Numeric ID as string
                    String counterName = isGerman && dto.getCounterNames() != null ? dto.getCounterNames().getDe() : (dto.getCounterNames() != null ? dto.getCounterNames().getEn() : "");
                    if (counterName == null || counterName.isEmpty()) {
                        counterName = category; // Fallback
                    }

                    String priceStudent = dto.getPrice() != null && dto.getPrice().getStudent() != null ? dto.getPrice().getStudent() : "";
                    String priceStaff = dto.getPrice() != null && dto.getPrice().getStaff() != null ? dto.getPrice().getStaff() : "";
                    String priceGuest = dto.getPrice() != null && dto.getPrice().getGuest() != null ? dto.getPrice().getGuest() : "";

                    description = description.replaceAll("\\(.*?\\) ?", "").replace("*", "");

                    if (!description.isEmpty()) {
                        Dish dish = new Dish(description, supplies, counterName, priceStudent, priceStaff, priceGuest, typesRaw, additivesRaw);
                        dishes.add(dish);
                    }
                }
                weeklyMenu.setDishesForDate(dishes, parsedDate);
            }
        } else if (response.code() != 404) {
            Log.e("MenuService", "Error fetching menu: " + response.code());
        }

        // Fetch openings and apply only to populated dates
        try {
            Response<OpeningsDto> openingsResponse = menuApi.getOpenings(canteen.getItmcId()).execute();
            if (openingsResponse.isSuccessful() && openingsResponse.body() != null) {
                OpeningsDto openings = openingsResponse.body();

                for (LocalDate target : weeklyMenu.getDates()) {
                    long targetTimestamp = target.atStartOfDay(ZoneId.systemDefault()).toEpochSecond();

LocalTime start = null;
                    LocalTime end = null;
                    if (openings.getGroups() != null) {
                        for (OpeningsDto.Group g : openings.getGroups()) {
                            if (targetTimestamp >= g.getDateStart() && targetTimestamp <= g.getDateEnd()) {
                                if (g.getPeriods() != null) {
                                    for (OpeningsDto.Period p : g.getPeriods()) {
                                        if (p.includesDay(target.getDayOfWeek())) {
                                            if (p.getMorningStartTime() != null && p.getMorningEndTime() != null) {
                                                try {
                                                    start = LocalTime.parse(p.getMorningStartTime());
                                                    end = LocalTime.parse(p.getMorningEndTime());
                                                } catch (Exception parseException) {
                                                    // Ignore invalid times
                                                }
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    weeklyMenu.setOpeningTimeForDate(target, start, end);
                }
            }
        } catch (Exception e) {
            Log.e("MenuService", "Error fetching openings", e);
        }

        // Fetch Types
        try {
            Response<List<MenuInformationDto>> typesResponse = menuApi.getTypes().execute();
            if (typesResponse.isSuccessful() && typesResponse.body() != null) {
                Map<String, String> types = new HashMap<>();
                for (MenuInformationDto dto : typesResponse.body()) {
                    if (dto.getId() != null && dto.getName() != null) {
                        String name = isGerman ? dto.getName().getDe() : dto.getName().getEn();
                        if (name == null) {
                            name = dto.getName().getDe();
                        }
                        if (name != null) {
                            types.put(dto.getId(), name);
                        }
                    }
                }
                weeklyMenu.setTypes(types);
            }
        } catch (Exception e) {
            Log.e("MenuService", "Error fetching types", e);
        }

        // Fetch Additives
        try {
            Response<List<MenuInformationDto>> additivesResponse = menuApi.getAdditives().execute();
            if (additivesResponse.isSuccessful() && additivesResponse.body() != null) {
                Map<String, String> additives = new HashMap<>();
                for (MenuInformationDto dto : additivesResponse.body()) {
                    if (dto.getId() != null && dto.getName() != null) {
                        String name = isGerman ? dto.getName().getDe() : dto.getName().getEn();
                        if (name == null) {
                            name = dto.getName().getDe();
                        }
                        if (name != null) {
                            additives.put(dto.getId(), name);
                        }
                    }
                }
                weeklyMenu.setAdditives(additives);
            }
        } catch (Exception e) {
            Log.e("MenuService", "Error fetching additives", e);
        }

        return weeklyMenu;
    }

    private void writeMenuToStorage(WeeklyMenu weeklyMenu, String id) {
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(context);

        GsonBuilder builder = new GsonBuilder()
            .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeSerializer());
        Gson gson = builder.create();
        SharedPreferences.Editor prefsEditor = appSharedPrefs.edit();

        String json = gson.toJson(weeklyMenu);
        prefsEditor.putString(WeeklyMenu.SP_KEY_WEEKLYMENU + id, json);
        prefsEditor.commit();
    }

    private WeeklyMenu readMenuFromStorage(String id) {
        WeeklyMenu res = null;
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(context);

        GsonBuilder builder = new GsonBuilder()
            .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeSerializer());
        Gson gson = builder.create();

        String json = appSharedPrefs.getString(WeeklyMenu.SP_KEY_WEEKLYMENU + id, "");
        if (!json.isEmpty()) {
            res = gson.fromJson(json, WeeklyMenu.class);
        }
        return res;
    }
}
