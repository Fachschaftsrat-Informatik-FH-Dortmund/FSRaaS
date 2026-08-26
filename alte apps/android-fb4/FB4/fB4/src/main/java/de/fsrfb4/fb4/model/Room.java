package de.fsrfb4.fb4.model;

import android.content.Context;

import java.io.Serializable;
import java.time.LocalTime;

import de.fsrfb4.fb4.R;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode(of = "name")
@AllArgsConstructor
@NoArgsConstructor
public class Room implements Serializable {
    private String name;
    private LocalTime freeUntil;

    private RoomSize size;
    private boolean ekey;

    public Room(String name) {
        this.name = name;
    }

    public String getSizeAsString(Context context) {
        switch (size) {
            case BIG:
                return context.getString(R.string.Groß);
            case MEDIUM:
                return context.getString(R.string.Medium);
            case SMALL:
                return context.getString(R.string.Klein);
        }
        return null;
    }

    public enum RoomSize {
        SMALL,
        MEDIUM,
        BIG
    }
}
