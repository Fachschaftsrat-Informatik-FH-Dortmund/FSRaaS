package de.fsrfb4.fb4.fragments.timetable;

import android.os.Bundle;

import androidx.fragment.app.Fragment;

import java.time.DayOfWeek;

import lombok.Getter;
import lombok.Setter;

import static lombok.AccessLevel.PROTECTED;

public class AbstractDayFragment extends Fragment {

    public static final String ARG_DAY = "day";

    @Getter
    @Setter(PROTECTED)
    private DayOfWeek day;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        day = (DayOfWeek) getArguments().getSerializable(ARG_DAY);
    }
}
