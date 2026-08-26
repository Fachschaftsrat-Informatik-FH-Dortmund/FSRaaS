package de.fsrfb4.fb4.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class MenuDay implements Serializable {
    private LocalDate date;
    private List<Canteen> canteens;

    public int getSize() {
        int count = 0;
        for (Canteen canteen : canteens) {
            count += canteen.getWeeklyMenu().getDishesForDate(date).size();
        }
        return count;
    }
}
