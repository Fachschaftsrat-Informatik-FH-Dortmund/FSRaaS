package de.fsrfb4.fb4.model;

import android.content.Context;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import it.gmariotti.cardslib.library.internal.CardHeader;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ListItemMenu {
    private Canteen canteen;
    private LocalDate day;
    private Context context;
    private CardHeader.OnClickCardHeaderPopupMenuListener popupMenuListener;

    public boolean isOpen() {

        if (canteen.getWeeklyMenu() == null) {
            return false;
        }

        LocalTime closingTime = canteen.getWeeklyMenu().getOpeningEndForDate(day);
        if (closingTime == null) {
            return false; // Closed
        }

        LocalDate today = LocalDate.now();

        if (today.isBefore(day)) {
            return true;
        } else if (today.isAfter(day)) {
            return false;
        }

        return closingTime.isAfter(LocalTime.now());
    }

    public LocalDate getDay() {
        return day;
    }
}
