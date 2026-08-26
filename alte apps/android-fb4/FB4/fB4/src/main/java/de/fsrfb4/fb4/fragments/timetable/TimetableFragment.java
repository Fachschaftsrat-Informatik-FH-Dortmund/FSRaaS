package de.fsrfb4.fb4.fragments.timetable;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentStatePagerAdapter;
import androidx.preference.PreferenceManager;
import androidx.viewpager.widget.ViewPager;

import com.google.android.material.tabs.TabLayout;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.leinardi.android.speeddial.SpeedDialActionItem;
import com.leinardi.android.speeddial.SpeedDialView;

import java.io.Serializable;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.MainActivity;
import de.fsrfb4.fb4.activities.timetable.AddEventsActivity;
import de.fsrfb4.fb4.activities.timetable.CustomEventActivity;
import de.fsrfb4.fb4.room.RoomTimetableEvent;
import de.fsrfb4.fb4.room.TimetableEventDao;
import de.fsrfb4.fb4.service.EventService;
import lombok.extern.slf4j.Slf4j;


@Slf4j
@AndroidEntryPoint
public class TimetableFragment extends Fragment {
    private static final String SIS_KEY_DAYS = "days";

    private ViewPager viewPager;

    private TabLayout tabLayout;

    private List<DayOfWeek> days = Collections.emptyList();

    private SpeedDialView fam;

    @Inject
    public EventService eventService;

    @Inject
    public TimetableEventDao timetableEventDao;
    
    private List<RoomTimetableEvent> events;
    private DayFragmentAdapter dayFragmentAdapter;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_timetable, container, false);
    }

    @Override
    public void onStart() {
        super.onStart();
        eventService.cleanupOldEvents();

        timetableEventDao.getAllLiveData().observe(getViewLifecycleOwner(), roomTimetableEvents -> {
            events = roomTimetableEvents;
            boolean hideEmptyDays = PreferenceManager.getDefaultSharedPreferences(getContext())
                .getBoolean(getString(R.string.preference_key_hide_empty_pages), getResources().getBoolean(R.bool.preference_default_hide_empty_pages));

            List<DayOfWeek> oldDays = days;

            if (hideEmptyDays) {
                List<DayOfWeek> newDays = Arrays.stream(DayOfWeek.values()).filter(d -> events.stream().anyMatch(e -> e.getDay() == d)).collect(Collectors.toList());

                if (!newDays.isEmpty()) {
                    days = newDays;
                } else {
                    days = Arrays.asList(DayOfWeek.values());
                }
            } else {
                days = Arrays.asList(DayOfWeek.values());
            }

            if (!oldDays.equals(days)) {
                log.debug("Die Liste der anzuzeigenden Tage hat sich geändert");
                dayFragmentAdapter.notifyDataSetChanged();
                prepareDay();
            }
        });

        fam.addActionItem(
            new SpeedDialActionItem.Builder(R.id.fab_import, R.drawable.ic_assignment_24dp)
                .setLabel(getString(R.string.offStundenplan))
                .create()
        );
        fam.addActionItem(
            new SpeedDialActionItem.Builder(R.id.fab_custom, R.drawable.ic_assignment_ind_24dp)
                .setLabel(getString(R.string.eigenerEintrag))
                .create()
        );

        fam.setOnActionSelectedListener(speedDialActionItem -> {
            Intent i;
            switch (speedDialActionItem.getId()) {
                case R.id.fab_import:
                    i = new Intent(getActivity(), AddEventsActivity.class);
                    startActivityForResult(i, 1);
                    return false;
                case R.id.fab_custom:
                    i = new Intent(getActivity(), CustomEventActivity.class);
                    int pos = viewPager.getCurrentItem();
                    int day = days.get(pos).ordinal();
                    i.putExtra(CustomEventActivity.EXTRA_DAY, day);
                    startActivityForResult(i, 1);
                    return false;
                default:
                    return false;
            }
        });
    }

    @Override
    public void onStop() {
        super.onStop();
    }

    @Override
    public void onResume() {
        super.onResume();

        fam.show();
    }

    @Override
    public void onViewCreated(View rootView, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(rootView, savedInstanceState);
        
        viewPager = rootView.findViewById(R.id.pager);
        tabLayout = rootView.findViewById(R.id.tabLayout);
        fam = rootView.findViewById(R.id.fab_menu);

        tabLayout.setElevation(getResources().getDimension(R.dimen.elevation));
        ((MainActivity) getActivity()).getAppBarLayout().setElevation(0);
        ((MainActivity) getActivity()).getAppBarLayout().setStateListAnimator(null);

        ViewCompat.setOnApplyWindowInsetsListener(fam, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
            return insets;
        });

        if (savedInstanceState != null) {
            this.days = (List<DayOfWeek>) savedInstanceState.getSerializable(SIS_KEY_DAYS);
        }

        dayFragmentAdapter = new DayFragmentAdapter(getChildFragmentManager());

        // Set up the ViewPager with the sections adapter.
        viewPager.setAdapter(dayFragmentAdapter);

        // nicht schön, muss aber sein:
        // http://stackoverflow.com/questions/38722325/fragmentmanager-is-already-executing-transactions-when-is-it-safe-to-initialise
        new Handler(Looper.myLooper()).post(() -> viewPager.setOffscreenPageLimit(5));
    }

    @Override
    public void onSaveInstanceState(Bundle savedInstanceState) {
        super.onSaveInstanceState(savedInstanceState);
        try {
            savedInstanceState.putSerializable(SIS_KEY_DAYS, (Serializable) days);
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().log("TimetableFragment.onSaveInstanceState");
            FirebaseCrashlytics.getInstance().recordException(e);
        }
    }


    private void prepareDay() {
        DayOfWeek dayToShow = getDayToShow();

        int position;

        do {
            position = days.indexOf(dayToShow);
            if (dayToShow == DayOfWeek.SUNDAY) {
                dayToShow = DayOfWeek.MONDAY;
            } else {
                dayToShow = dayToShow.plus(1);
            }
        } while (position == -1);

        viewPager.setCurrentItem(position, true);
    }

    /**
     * @return Der Tag der angezeigt werden soll. (In der Woche der aktuelle Tag, an Wochenenden der nächste Montag)
     */
    private DayOfWeek getDayToShow() {
        DayOfWeek today = LocalDate.now().getDayOfWeek();

        long remainingEventsForToday = 0;
        if (events != null) {
            remainingEventsForToday = events.stream()
                .filter(e -> e.getDay() == today)
                .filter(e -> e.getEndTime().isAfter(LocalTime.now()) || e.getEndTime().equals(LocalTime.now()))
                .filter(e -> e.getInvalidUntil() == null || e.getInvalidUntil().isBefore(LocalDateTime.now()))
                .count();
        }

        if (remainingEventsForToday >= 1) {
            return today;
        } else if (today == DayOfWeek.SUNDAY) {
            return DayOfWeek.MONDAY;
        } else {
            //noinspection WrongConstant
            return today.plus(1);
        }
    }

    public static LocalDateTime nextDayOfWeek(DayOfWeek dow, LocalDateTime start, LocalTime timeEnd) {
        LocalDateTime date = start;
        int diff = dow.getValue() - date.getDayOfWeek().getValue();
        if (diff < 0) {
            diff += 7;
        } else if (diff == 0) {
            LocalTime timeNow = date.toLocalTime();
            if (timeNow.isAfter(timeEnd)) {
                diff += 7;
            }
        }

        date = date.plusDays(diff);
        date = date.withMinute(timeEnd.getMinute());
        date = date.withHour(timeEnd.getHour());
        return date;
    }

    private class DayFragmentAdapter extends FragmentStatePagerAdapter {

        DayFragmentAdapter(FragmentManager fragmentManager) {
            super(fragmentManager);
        }

        @Override
        public Fragment getItem(int position) {
            // getItem is called to instantiate the fragment for the given page.
            // Return a AddEventsDayFragment (defined as a static inner class
            // below) with the page number as its lone argument.
            TimetableDayFragment fragment = new TimetableDayFragment();
            DayOfWeek day = days.get(position);
            Bundle args = new Bundle();
            args.putSerializable(TimetableDayFragment.ARG_DAY, day);
            fragment.setArguments(args);
            return fragment;
        }

        @Override
        public int getCount() {
            return days.size();
        }

        @Override
        public CharSequence getPageTitle(int position) {
            DayOfWeek day = days.get(position);
            return day.getDisplayName(TextStyle.FULL, Locale.getDefault()).toUpperCase();
        }

        @Override
        public int getItemPosition(Object object) {
            TimetableDayFragment fragment = (TimetableDayFragment) object;

            DayOfWeek day = fragment.getDay();

            if (days.contains(day)) {
                return days.indexOf(day);
            } else {
                return POSITION_NONE;
            }
        }
    }

}
