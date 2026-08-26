package de.fsrfb4.fb4.fragments.timetable;

import android.app.TimePickerDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.ContextMenu;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.afollestad.materialdialogs.MaterialDialog;
import com.android.colorpicker.ColorPickerDialog;
import com.google.common.util.concurrent.Futures;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.Arrays;
import java.util.Locale;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.timetable.EditEventActivity;
import de.fsrfb4.fb4.adapter.TimetableEventAdapter;
import de.fsrfb4.fb4.databinding.FragmentTimetableDayBinding;
import de.fsrfb4.fb4.room.RoomTimetableEvent;
import de.fsrfb4.fb4.room.TimetableEventDao;
import de.fsrfb4.fb4.service.EventService;
import de.fsrfb4.fb4.util.CallbackUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * Fragment für die Ansicht eines Tages im Stundenplan
 */
@Slf4j
@AndroidEntryPoint
public class TimetableDayFragment extends AbstractDayFragment {

    private FragmentTimetableDayBinding binding;

    @Inject
    public EventService eventService;

    @Inject
    public TimetableEventDao timetableEventDao;

    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentTimetableDayBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        binding = null;
    }

    @Override
    public void onViewCreated(View rootView, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(rootView, savedInstanceState);

        ViewCompat.setOnApplyWindowInsetsListener(binding.listEvents, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
            return insets;
        });

        binding.listEvents.setClipToPadding(false);
        binding.listEvents.setEmptyView(binding.textNoEvents);

        registerForContextMenu(binding.listEvents);

        prepareListData();
    }

    @Override
    public void onCreateContextMenu(ContextMenu menu, View v,
                                    ContextMenu.ContextMenuInfo menuInfo) {
        super.onCreateContextMenu(menu, v, menuInfo);
        if (getActivity() != null) {
            getActivity().getMenuInflater().inflate(R.menu.menu_timetable_event, menu);
            AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo) menuInfo;

            TimetableEventAdapter adapter = (TimetableEventAdapter) binding.listEvents.getAdapter();
            if (adapter != null && info.position < adapter.getCount()) {
                RoomTimetableEvent event = adapter.getItem(info.position);
                if (event != null) {
                    menu.setHeaderTitle(event.getName());
                    MenuItem cancelItem = menu.findItem(R.id.action_toggle_cancel);
                    if (cancelItem != null) {
                        if (!event.isInvalid()) {
                            cancelItem.setTitle(R.string.fälltAus);
                        } else {
                            cancelItem.setTitle(R.string.findetStatt);
                        }
                    }
                }
            }
        }
    }

    @Override
    public boolean onContextItemSelected(MenuItem item) {
        AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo) item.getMenuInfo();

        final int eventId = (int) info.id;

        switch (item.getItemId()) {
            case R.id.action_delete:
                new MaterialDialog.Builder(getActivity())
                    .title(R.string.eintragLöschen_Frage)
                    .content(R.string.eintragLöschen_Frage_Lang)
                    .positiveText(R.string.ja)
                    .negativeText(R.string.nein)
                    .callback(new MaterialDialog.ButtonCallback() {
                        @Override
                        public void onPositive(MaterialDialog dialog) {
                            eventService.deleteEvent(eventId);
                        }
                    })
                    .show();
                return true;

            case R.id.action_edit:
                Intent i = new Intent(getActivity(), EditEventActivity.class);
                i.putExtra(EditEventActivity.ARG_EVENT_ID, eventId);
                getActivity().startActivityForResult(i, 1);
                return true;

            case R.id.action_toggle_cancel:
                Futures.addCallback(
                    timetableEventDao.getByIdAsync(eventId),
                    CallbackUtil.onSuccess(event -> {
                        if (event != null) {
                            if (!event.isInvalid()) {
                                LocalDateTime now = LocalDateTime.now();
                                LocalDateTime invalidUntil = now
                                    .withHour(event.getEndTime().getHour())
                                    .withMinute(event.getEndTime().getMinute())
                                    .with(event.getDay());

                                if (now.isAfter(invalidUntil)) {
                                    invalidUntil = invalidUntil.plusWeeks(1);
                                }

                                event.setInvalidUntil(invalidUntil);
                            } else {
                                event.setInvalidUntil(null);
                            }
                            timetableEventDao.insertAsync(event);
                        }
                    }),
                    ContextCompat.getMainExecutor(getContext())
                );
                return true;

            case R.id.action_change_color:
                changeColor(eventId);
                return true;

            case R.id.action_move:
                moveOnce(eventId);
                return true;

            default:
                return super.onContextItemSelected(item);
        }
    }

    private void changeColor(final int eventId) {
        Futures.addCallback(
            timetableEventDao.getByIdAsync(eventId),
            CallbackUtil.onSuccess(event -> {
                if (event != null && getActivity() != null) {
                    ColorPickerDialog colorcalendar = ColorPickerDialog.newInstance(
                        com.android.colorpicker.R.string.color_picker_default_title,
                        colorChoice(getActivity()),
                        event.getColor(),
                        5,
                        ColorPickerDialog.SIZE_SMALL, R.string.default_color);

                    colorcalendar.setOnColorSelectedListener(color -> {
                        eventService.changeColor(eventId, color);
                    });

                    colorcalendar.setOnDefaultClickListener((dialogInterface, i) -> {
                        eventService.changeColor(eventId, 0);
                    });

                    colorcalendar.show(getActivity().getFragmentManager(), "cal");
                }
            }),
            ContextCompat.getMainExecutor(getContext())
        );
    }

    private void moveOnce(final int eventId) {
        final DayOfWeek[] dayValues = DayOfWeek.values();
        final String[] days = Arrays.stream(dayValues).map(day -> day.getDisplayName(TextStyle.FULL, Locale.getDefault())).toArray(String[]::new);

        new AlertDialog.Builder(getActivity())
            .setTitle(R.string.new_day)
            .setItems(days, (dialog, which) -> {
                final DayOfWeek newDay = dayValues[which];
                log.info("Neuer Tag: {}", newDay);

                Futures.addCallback(
                    timetableEventDao.getByIdAsync(eventId),
                    CallbackUtil.onSuccess(event -> {
                        if (event != null && getActivity() != null) {
                            TimePickerDialog timePickerDialog = new TimePickerDialog(getActivity(), (view, hourOfDay, minute) -> {
                                log.info("Neue Zeit: {}:{}Uhr", hourOfDay, minute);
                                Futures.addCallback(
                                    eventService.moveOnce(eventId, newDay, LocalTime.of(hourOfDay, minute)),
                                    CallbackUtil.onSuccess(result -> Toast.makeText(getActivity(), R.string.successfully_moved, Toast.LENGTH_SHORT).show()),
                                    ContextCompat.getMainExecutor(getContext())
                                );
                            }, event.getStartTime().getHour(), event.getStartTime().getMinute(), true);
                            timePickerDialog.show();
                        }
                    }),
                    ContextCompat.getMainExecutor(getContext())
                );
            })
            .show();
    }

    private void prepareListData() {
        timetableEventDao.getEventsForDayLiveData(getDay()).observe(getViewLifecycleOwner(), events -> {
            if (getContext() != null) {
                if (binding.listEvents.getAdapter() == null) {
                    TimetableEventAdapter timetableEventAdapter = new TimetableEventAdapter(events);
                    binding.listEvents.setAdapter(timetableEventAdapter);
                }
                else {
                    ((TimetableEventAdapter) binding.listEvents.getAdapter()).updateData(events);
                }
            }
        });
    }

    public int[] colorChoice(Context context) {

        int[] mColorChoices = null;
        String[] color_array = context.getResources().
            getStringArray(R.array.default_color_choice_values);

        if (color_array.length > 0) {
            mColorChoices = new int[color_array.length];
            for (int i = 0; i < color_array.length; i++) {
                mColorChoices[i] = Color.parseColor(color_array[i]);
            }
        }
        return mColorChoices;
    }
}
