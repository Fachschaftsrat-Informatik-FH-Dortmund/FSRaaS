package de.fsrfb4.fb4.model;

import androidx.annotation.Keep;

import java.io.Serializable;
import java.time.DayOfWeek;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Keep
public class Canteen implements Serializable, Comparable<Canteen> {
    private String name;
    private String id;
    private String url;
    private String pdfUrl;
    private String itmcId;
    private boolean enabledDefault;
    private List<String> openingTime;
    private int defaultOrder;

    private WeeklyMenu weeklyMenu;

    public String getOpeningTimeForDay(DayOfWeek day) {
        return openingTime.get(day.ordinal());
    }

    @Override
    public int compareTo(Canteen canteen) {
        return defaultOrder - canteen.defaultOrder;
    }

    @Override
    public String toString() {
        return name;
    }
}
