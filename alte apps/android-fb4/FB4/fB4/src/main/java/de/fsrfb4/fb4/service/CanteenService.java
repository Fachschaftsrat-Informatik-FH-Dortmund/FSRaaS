package de.fsrfb4.fb4.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import de.fsrfb4.fb4.model.Canteen;

public class CanteenService {
    private final Map<String, Canteen> canteens;

    public CanteenService(DataService dataService) {
        canteens = new HashMap<>();
        String json = dataService.getCanteens();
        List<Canteen> canteenList = new Gson().fromJson(json, new TypeToken<List<Canteen>>() { }.getType());

        for (Canteen canteen : canteenList) {
            canteens.put(canteen.getId(), canteen);
        }
    }

    public Map<String, Canteen> getCanteens() {
        return canteens;
    }
}
