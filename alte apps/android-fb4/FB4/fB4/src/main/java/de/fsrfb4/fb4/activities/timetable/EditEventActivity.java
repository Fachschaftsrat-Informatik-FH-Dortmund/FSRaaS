package de.fsrfb4.fb4.activities.timetable;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.common.util.concurrent.Futures;
import com.wdullaer.materialdatetimepicker.time.TimePickerDialog;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.EventBinding;
import de.fsrfb4.fb4.room.RoomTimetableEvent;
import de.fsrfb4.fb4.room.TimetableEventDao;
import de.fsrfb4.fb4.util.CallbackUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@AndroidEntryPoint
public class EditEventActivity extends AppCompatActivity {

    public static final String ARG_EVENT_ID = "eventId";

    private EventBinding binding;

    @Inject
    public TimetableEventDao timetableEventDao;

    private RoomTimetableEvent event;

    @SuppressLint("WrongConstant")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = EventBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setSupportActionBar(binding.toolbarLayout.toolbar);
        getSupportActionBar().setIcon(android.R.color.transparent);
        getSupportActionBar().setHomeButtonEnabled(true);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);

        ViewCompat.setOnApplyWindowInsetsListener(binding.toolbarLayout.getRoot(), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), systemBars.top, v.getPaddingRight(), v.getPaddingBottom());
            return insets;
        });

        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(this,
            R.array.wochentage, android.R.layout.simple_spinner_item);
        // Specify the layout to use when the list of choices appears
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        // Apply the adapter to the spinner
        binding.spinnerWeekday.setAdapter(adapter);

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        binding.inputTimeStart.setOnClickListener(v -> {

            TimePickerDialog mTimePicker;

            LocalTime currentZeitVon = LocalTime.parse(binding.inputTimeStart.getText().toString());

            mTimePicker = TimePickerDialog.newInstance(
                (radialPickerLayout, selectedHour, selectedMinute, selectedSecond) -> {
                    LocalTime selectedTime = LocalTime.of(selectedHour, selectedMinute, selectedSecond);

                    binding.inputTimeStart.setText(selectedTime.format(timeFormatter));

                    if (LocalTime.parse(binding.inputTimeEnd.getText().toString()).isBefore(selectedTime)) {
                        binding.inputTimeEnd.setText(selectedTime.plusMinutes(1).format(timeFormatter));
                    }
                },
                currentZeitVon.getHour(),
                currentZeitVon.getMinute(),
                true);
            mTimePicker.dismissOnPause(true);
            mTimePicker.show(getFragmentManager(), "TimerPicker Von");
        });


        binding.inputTimeEnd.setOnClickListener(v -> {

            TimePickerDialog mTimePicker;

            LocalTime currentZeitBis = LocalTime.parse(binding.inputTimeEnd.getText().toString());
            mTimePicker = TimePickerDialog.newInstance(
                (radialPickerLayout, selectedHour, selectedMinute, selectedSecond) -> {
                    LocalTime selectedTime = LocalTime.of(selectedHour, selectedMinute, selectedSecond);

                    binding.inputTimeEnd.setText(selectedTime.format(timeFormatter));

                    if (LocalTime.parse(binding.inputTimeStart.getText().toString()).isAfter(selectedTime)) {
                        binding.inputTimeStart.setText(selectedTime.minusMinutes(1).format(timeFormatter));
                    }
                },
                currentZeitBis.getHour(),
                currentZeitBis.getMinute(),
                true);
            mTimePicker.dismissOnPause(true);
            mTimePicker.show(getFragmentManager(), "TimerPicker Bis");
        });

        if (!getIntent().hasExtra(ARG_EVENT_ID)) {
            log.warn("eventId not set");
        } else {
            int eventId = getIntent().getIntExtra(ARG_EVENT_ID, -1);
            Futures.addCallback(
                timetableEventDao.getByIdAsync(eventId),
                CallbackUtil.onSuccess(result -> {
                    event = result;
                    if (event != null) {
                        binding.inputCourseName.setText(event.getName());
                        binding.editTextEventType.setText(event.getCourseType());
                        binding.spinnerWeekday.setSelection(event.getDay().ordinal());
                        binding.inputRoom.setText(event.getRoomId());
                        binding.inputLecturerName.setText(event.getLecturerName());
                        binding.inputLecturerId.setText(event.getLecturerId());

                        binding.inputTimeStart.setText(event.getStartTime().format(timeFormatter));
                        binding.inputTimeEnd.setText(event.getEndTime().format(timeFormatter));
                    }
                }),
                ContextCompat.getMainExecutor(this)
            );
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }
    
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.eintrag, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {

        switch (item.getItemId()) {

            case R.id.speichern:

                if (!binding.inputCourseName.getText().toString().isEmpty()) {
                    event.setName(binding.inputCourseName.getText().toString());
                    event.setCourseType(binding.editTextEventType.getText().toString());
                    event.setRoomId(binding.inputRoom.getText().toString());
                    event.setLecturerName(binding.inputLecturerName.getText().toString());
                    event.setLecturerId(binding.inputLecturerId.getText().toString());
                    event.setStartTime(LocalTime.parse(binding.inputTimeStart.getText().toString()));
                    event.setEndTime(LocalTime.parse(binding.inputTimeEnd.getText().toString()));
                    event.setDay(getSelectedDay());
                    Futures.addCallback(
                        timetableEventDao.insertAsync(event),
                        CallbackUtil.onSuccess(result -> {
                            Intent returnIntent = new Intent();
                            setResult(RESULT_OK, returnIntent);
                            finish();
                        }),
                        ContextCompat.getMainExecutor(this)
                    );
                } else {
                    Toast.makeText(this, getString(R.string.kursnamenEingeben), Toast.LENGTH_SHORT).show();
                }

                break;

            case android.R.id.home:
                onBackPressed();
                break;
        }

        return false;
    }

    private DayOfWeek getSelectedDay() {
        return DayOfWeek.values()[binding.spinnerWeekday.getSelectedItemPosition()];
    }

}
