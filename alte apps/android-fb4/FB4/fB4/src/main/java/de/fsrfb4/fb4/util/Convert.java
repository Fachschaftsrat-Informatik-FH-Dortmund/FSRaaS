package de.fsrfb4.fb4.util;

import java.time.LocalTime;

/**
 * @author Lars Grefer
 */
public final class Convert {

    private Convert() {
    }

    public static LocalTime toLocalTime(int time) {
        int hour = time / 100;
        int minutes = time % 100;
        return LocalTime.of(hour, minutes);
    }

    public static int toInt(LocalTime localTime) {
        return (localTime.getHour() * 100) + localTime.getMinute();
    }
}
