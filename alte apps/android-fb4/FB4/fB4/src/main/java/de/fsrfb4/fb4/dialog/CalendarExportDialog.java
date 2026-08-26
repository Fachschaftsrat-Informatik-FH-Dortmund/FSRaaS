package de.fsrfb4.fb4.dialog;

import android.app.Activity;
import android.app.DatePickerDialog;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import android.provider.CalendarContract.Events;
import android.view.LayoutInflater;
import android.widget.ArrayAdapter;
import android.widget.DatePicker;
import android.widget.Toast;

import androidx.core.content.ContextCompat;

import com.afollestad.materialdialogs.MaterialDialog;
import com.google.common.util.concurrent.Futures;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import dagger.hilt.EntryPoints;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.adapter.TimetableEventAdapter;
import de.fsrfb4.fb4.databinding.CalendarexportBinding;
import de.fsrfb4.fb4.fragments.timetable.TimetableFragment;
import de.fsrfb4.fb4.room.DatabaseEntryPoint;
import de.fsrfb4.fb4.room.RoomTimetableEvent;
import de.fsrfb4.fb4.room.TimetableEventDao;
import de.fsrfb4.fb4.service.DataService;
import de.fsrfb4.fb4.util.CallbackUtil;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Created by oezgu on 01.10.2015.
 */
@Slf4j
@RequiredArgsConstructor
public class CalendarExportDialog {

    private CalendarexportBinding binding;
    private List<CalendarIDs> calIds;
    private DatePickerDialog datePickerVon;
    private DatePickerDialog datePickerBis;
    private DateTimeFormatter dateFormatter;
    private final Context context;
    private final DataService dataService;

    private List<CalendarIDs> getCalendarIDs() {
        List<CalendarIDs> cals = new ArrayList<>();

        try {
            String[] projection = new String[]{CalendarContract.Calendars._ID, CalendarContract.Calendars.NAME, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, CalendarContract.Calendars.ACCOUNT_NAME, CalendarContract.Calendars.ACCOUNT_TYPE};

            Cursor calCursor = context.getContentResolver().query(CalendarContract.Calendars.CONTENT_URI, projection, null, null, CalendarContract.Calendars._ID + " ASC");
            try {
                if (calCursor != null && calCursor.moveToFirst()) {
                    do {
                        long id = calCursor.getLong(0);
                        String displayName = calCursor.getString(2);
                        if (displayName != null) {
                            cals.add(new CalendarIDs(id, displayName));
                        }
                    } while (calCursor.moveToNext());
                }
            } finally {
                if (calCursor != null) {
                    calCursor.close();
                }
            }
        } catch (SecurityException e) {
            log.info(e.getLocalizedMessage(), e);
        }

        return cals;
    }

    private List<String> getCalendarNames(List<CalendarIDs> list) {
        List<String> names = new ArrayList<>();
        for (CalendarIDs cal : list) {
            names.add(cal.name);
        }
        return names;
    }

    private void exportTimeTable(long calendarID) {
        TimetableEventDao dao = EntryPoints.get(context.getApplicationContext(), DatabaseEntryPoint.class).getAppDatabase().timetableEventDao();
        Futures.addCallback(
            dao.getAllAsync(),
            CallbackUtil.onSuccess(all -> {
                new Thread(() -> {
                    boolean exported = all.stream().map(timetableEvent -> exportEvent(timetableEvent, timetableEvent.getDay(), calendarID)).reduce(true, (a, b) -> a && b);

                    ((Activity) context).runOnUiThread(() -> {
                        if (exported) {
                            Toast.makeText(context, context.getString(R.string.stundenplanExportiert), Toast.LENGTH_SHORT).show();
                        } else {
                            Toast.makeText(context, context.getString(R.string.stundenplanNichtExportiert), Toast.LENGTH_SHORT).show();
                        }
                    });
                }).start(); // exportEvent uses ContentResolver and takes time, better to keep it in a thread/executor
            }),
            ContextCompat.getMainExecutor(context)
        );
    }

    private boolean exportEvent(RoomTimetableEvent ev, DayOfWeek dow, long calendarID) {
        LocalDateTime calStart = TimetableFragment.nextDayOfWeek(dow, getDateFromDatePickerDialog(datePickerVon).atTime(LocalTime.MIDNIGHT), LocalTime.of(23, 59));
        calStart = calStart.toLocalDate().atTime(ev.getStartTime());
        long start = calStart.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();

        calStart = TimetableFragment.nextDayOfWeek(dow, getDateFromDatePickerDialog(datePickerVon).atTime(LocalTime.MIDNIGHT), LocalTime.of(23, 59));
        calStart = calStart.toLocalDate().atTime(ev.getEndTime());
        long end = calStart.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();

        LocalDate calEnd = getDateFromDatePickerDialog(datePickerBis);
        String endDate = calEnd.plusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd", Locale.GERMAN));

        LocalDateTime calEnd2 = calEnd.atTime(ev.getEndTime());

        log.info("Days between: {}", String.valueOf(daysBetween(calStart, calEnd2)));
        int count = daysBetween(calStart, calEnd2);
        if (count < 0) {
            return true;
        }
        //count = (count/7)+1;

        String day = calStart.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.US).substring(0, 2);

        //Log.e("Count:", String.valueOf(count));
        log.info("Day: {}", day);
        log.info("endDate: {}", endDate);

        ContentValues values = new ContentValues();
        values.put(Events.DTSTART, start);
        values.put(Events.DTEND, end);
        values.put(Events.RRULE,
            "FREQ=WEEKLY;"
                /*COUNT="+String.valueOf(count)+*/ + ";" +
                "UNTIL=" + endDate + ";" +
                "BYDAY=" + day + ";" +
                "WKST=MO");
        values.put(Events.TITLE, TimetableEventAdapter.formatCourseType(ev.getCourseType()) + ev.getName());
        values.put(Events.EVENT_LOCATION, ev.getRoomId());
        values.put(Events.CALENDAR_ID, calendarID);
        values.put(Events.EVENT_TIMEZONE, "Europe/Berlin");
        values.put(Events.DESCRIPTION,
            ev.getLecturerName());

        values.put(Events.ACCESS_LEVEL, CalendarContract.Events.ACCESS_PRIVATE);
        values.put(CalendarContract.Events.ALL_DAY, 0);
        Uri uri = null;
        try {
            uri = context.getContentResolver().insert(CalendarContract.Events.CONTENT_URI, values);
        } catch (SecurityException e) {
            log.warn(e.getLocalizedMessage(), e);
        }
        return !(uri == null);
    }

    private static LocalDate getDateFromDatePickerDialog(DatePickerDialog datePickerDialog) {
        DatePicker datePicker = datePickerDialog.getDatePicker();
        int day = datePicker.getDayOfMonth();
        int month = datePicker.getMonth() + 1;
        int year = datePicker.getYear();

        return LocalDate.of(year, month, day);
    }

    private static int daysBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return (int) Duration.between(startDate, endDate).toDays();
    }

    public void showDialog() {
        LayoutInflater mInflater = (LayoutInflater) context
            .getSystemService(Activity.LAYOUT_INFLATER_SERVICE);
        binding = CalendarexportBinding.inflate(mInflater);

        binding.inputDateStart.setOnClickListener(view -> datePickerVon.show());
        binding.inputDateEnd.setOnClickListener(view -> datePickerBis.show());

        dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");

        calIds = getCalendarIDs();
        List<String> names = getCalendarNames(calIds);

        ArrayAdapter<String> adapter = new ArrayAdapter<>(context, android.R.layout.simple_spinner_item, names);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        binding.spinnerCalendar.setAdapter(adapter);

        LocalDate localDate = dataService.getSemesterBeginning();
        datePickerVon = new DatePickerDialog(context, (view, year, monthOfYear, dayOfMonth) -> {
            LocalDate localDateFrom = LocalDate.of(year, monthOfYear + 1, dayOfMonth);
            binding.inputDateStart.setText(localDateFrom.format(dateFormatter));
            if (localDateFrom.isAfter(getDateFromDatePickerDialog(datePickerBis))) {
                datePickerBis.updateDate(year, monthOfYear, dayOfMonth);
                binding.inputDateEnd.setText(localDateFrom.format(dateFormatter));
            }
        }, localDate.getYear(), localDate.getMonthValue() - 1, localDate.getDayOfMonth());
        binding.inputDateStart.setText(localDate.format(dateFormatter));

        localDate = dataService.getSemesterEnd();
        datePickerBis = new DatePickerDialog(context, (view, year, monthOfYear, dayOfMonth) -> {
            LocalDate localDateTo = LocalDate.of(year, monthOfYear + 1, dayOfMonth);
            binding.inputDateEnd.setText(localDateTo.format(dateFormatter));
            if (localDateTo.isBefore(getDateFromDatePickerDialog(datePickerVon))) {
                datePickerVon.updateDate(year, monthOfYear, dayOfMonth);
                binding.inputDateStart.setText(localDateTo.format(dateFormatter));
            }
        }, localDate.getYear(), localDate.getMonthValue() - 1, localDate.getDayOfMonth());
        binding.inputDateEnd.setText(localDate.format(dateFormatter));

        new MaterialDialog.Builder(context)
            .title(context.getString(R.string.kalender_export))
            .positiveText(R.string.exportieren)
            .negativeText(R.string.abbrechen)
            .customView(binding.getRoot(), false)
            .callback(new MaterialDialog.ButtonCallback() {
                @Override
                public void onPositive(MaterialDialog dialog) {
                    int item = binding.spinnerCalendar.getSelectedItemPosition();
                    if (item != -1) {
                        long calID = calIds.get(item).id;
                        exportTimeTable(calID);
                    }
                }
            })
            .show();
    }

    @AllArgsConstructor
    private static class CalendarIDs {
        long id;
        String name;
    }
}
