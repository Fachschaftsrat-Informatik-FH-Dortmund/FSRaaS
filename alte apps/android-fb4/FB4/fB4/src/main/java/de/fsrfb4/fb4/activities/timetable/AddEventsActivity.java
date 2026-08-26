package de.fsrfb4.fb4.activities.timetable;

import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;

import com.afollestad.materialdialogs.MaterialDialog;
import com.google.common.util.concurrent.Futures;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.gson.Gson;

import java.io.Serializable;
import java.net.UnknownHostException;
import java.time.DayOfWeek;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.MainActivity;
import de.fsrfb4.fb4.adapter.ThemedArrayAdapter;
import de.fsrfb4.fb4.databinding.ActivityAddEventsBinding;
import de.fsrfb4.fb4.databinding.CustomRowView2Binding;
import de.fsrfb4.fb4.databinding.FilterEdittextBinding;
import de.fsrfb4.fb4.databinding.FragmentAddEventsDayBinding;
import de.fsrfb4.fb4.fragments.timetable.AbstractDayFragment;
import de.fsrfb4.fb4.fragments.timetable.filter.Filter;
import de.fsrfb4.fb4.fragments.timetable.filter.LetterFilter;
import de.fsrfb4.fb4.retrofit.TimeTableFallbackApi;
import de.fsrfb4.fb4.retrofit.TimetableApi;
import de.fsrfb4.fb4.retrofit.timetable.CourseOfStudy;
import de.fsrfb4.fb4.retrofit.timetable.CourseOfStudyGrade;
import de.fsrfb4.fb4.room.RoomTimetableEvent;
import de.fsrfb4.fb4.room.TimetableEventDao;
import de.fsrfb4.fb4.util.CallbackUtil;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import retrofit2.Call;
import retrofit2.Callback;

@Slf4j
@AndroidEntryPoint
public class AddEventsActivity extends AppCompatActivity {
    private static final String SIS_KEY_STUNDIENGÄNGE_MIT_SEMESTER = "StudiengängeMitSemester";
    private static final String SIS_KEY_MENU_VISIBLE = "menuVisible";
    private static final String SIS_KEY_SELECTED = "selected";
    public static final String SIS_KEY_TABLE = "Table";
    private static final String SIS_KEY_DO_FILTER = "doFilter";
    private static final String SIS_KEY_LETTER = "letter";

    private ArrayList<StudiengangMitSemester> studiengängeMitSemester;
    private Map<DayOfWeek, List<Event>> table;
    private SectionsPagerAdapter mSectionsPagerAdapter;

    private String letter = "";
    private boolean doFilter;
    private StudiengangMitSemester selectedStudiengangMitSemester;
    private int AltesItem = 1;

    private boolean clicked = true;
    private Menu menu;

    private boolean menuVisible;
    private boolean selected;

    private ActivityAddEventsBinding binding;

    @Inject
    public Gson gson;

    @Inject
    public TimetableApi timetableService;

    @Inject
    public TimeTableFallbackApi timeTableFallbackService;

    @Inject
    public TimetableEventDao timetableEventDao;

    private Callback<Map<String, CourseOfStudy>> callback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAddEventsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        setSupportActionBar(binding.toolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        getSupportActionBar().setHomeButtonEnabled(true);
        getSupportActionBar().setDisplayShowTitleEnabled(false);
        getSupportActionBar().setIcon(android.R.color.transparent);

        ViewCompat.setOnApplyWindowInsetsListener(binding.toolbar, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), systemBars.top, v.getPaddingRight(), v.getPaddingBottom());
            return insets;
        });

        binding.tabLayout.setElevation(getResources().getDimension(R.dimen.elevation));
        getSupportActionBar().setElevation(0);

        mSectionsPagerAdapter = null;

        doFilter = false;
        letter = "";

        String table = getIntent().getStringExtra(SIS_KEY_TABLE);
        if (table != null) {
            ActionBar bar = getSupportActionBar();
            bar.setTitle(getString(R.string.hinzufügen));

            mSectionsPagerAdapter = new SectionsPagerAdapter(
                getSupportFragmentManager());

            // Set up the ViewPager with the sections adapter.
            binding.pager.setOffscreenPageLimit(5);
            binding.pager.setAdapter(mSectionsPagerAdapter);
        } else if (savedInstanceState == null) {
            loadCourses();
        } else {
            menuVisible = savedInstanceState.getBoolean(SIS_KEY_MENU_VISIBLE, false);
            selected = savedInstanceState.getBoolean(SIS_KEY_SELECTED, false);
            doFilter = savedInstanceState.getBoolean(SIS_KEY_DO_FILTER, false);
            letter = savedInstanceState.getString(SIS_KEY_LETTER, "");

            studiengängeMitSemester = (ArrayList<StudiengangMitSemester>) savedInstanceState.getSerializable(SIS_KEY_STUNDIENGÄNGE_MIT_SEMESTER);
            if (studiengängeMitSemester != null) {
                if (selected) {
                    clicked = false;
                    initializeSpinner(-1);
                } else {
                    clicked = true;
                    showCourseDialog();
                }
            }

            if (selected) {
                this.table = (HashMap<DayOfWeek, List<Event>>) savedInstanceState.getSerializable(SIS_KEY_TABLE);
                if (this.table != null) {

                    mSectionsPagerAdapter = new SectionsPagerAdapter(
                        getSupportFragmentManager());

                    // Set up the ViewPager with the sections adapter.
                    binding.pager.setOffscreenPageLimit(5);
                    binding.pager.setAdapter(mSectionsPagerAdapter);
                }
            }
        }

    }

    private void loadCourses() {

        MainActivity.lockOrientation(this);

        final MaterialDialog dialog = new MaterialDialog.Builder(this)
            .content(R.string.warten_dialog)
            .progress(true, 0)
            .cancelable(false)
            .show();

        callback = new Callback<Map<String, CourseOfStudy>>() {
            @Override
            public void onResponse(Call<Map<String, CourseOfStudy>> call, retrofit2.Response<Map<String, CourseOfStudy>> response) {
                Collection<CourseOfStudy> studiengänge = response.body().values();

                studiengängeMitSemester = new ArrayList<>();

                for (CourseOfStudy courseOfStudy : studiengänge) {
                    for (CourseOfStudyGrade courseOfStudyGrade : courseOfStudy.getGrades()) {
                        studiengängeMitSemester.add(new StudiengangMitSemester(courseOfStudy, courseOfStudyGrade));
                    }
                }

                dialog.dismiss();
                showCourseDialog();

                MainActivity.unlockOrientation(AddEventsActivity.this);
            }

            @Override
            public void onFailure(Call<Map<String, CourseOfStudy>> call, Throwable t) {
                log.error("Fehler beim Laden der Studiengänge", t);
                if (!(t instanceof UnknownHostException)) {
                    FirebaseCrashlytics.getInstance().recordException(t);
                }

                if (!timeTableFallbackService.getListOfCourseOfStudies().request().url().equals(call.request().url())) {
                    timeTableFallbackService.getListOfCourseOfStudies().enqueue(callback);
                } else {
                    dialog.dismiss();

                    MainActivity.unlockOrientation(AddEventsActivity.this);

                    Toast.makeText(AddEventsActivity.this, R.string.fehlerBeimLaden_Studiengänge, Toast.LENGTH_SHORT).show();
                    finish();
                }
            }
        };

        timetableService.getListOfCourseOfStudies().enqueue(callback);
    }

    @Override
    public void onSaveInstanceState(Bundle savedInstanceState) {
        super.onSaveInstanceState(savedInstanceState);

        try {
            savedInstanceState.putSerializable(SIS_KEY_TABLE, (Serializable) table);
            savedInstanceState.putSerializable(SIS_KEY_STUNDIENGÄNGE_MIT_SEMESTER, studiengängeMitSemester);

            savedInstanceState.putBoolean(SIS_KEY_MENU_VISIBLE, menuVisible);
            savedInstanceState.putBoolean(SIS_KEY_SELECTED, selected);
            savedInstanceState.putBoolean(SIS_KEY_DO_FILTER, doFilter);
            savedInstanceState.putString(SIS_KEY_LETTER, letter);
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().log("AddEventsActivity.onSaveInstanceState");
            FirebaseCrashlytics.getInstance().recordException(e);
        }
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.hinzufuegen, menu);
        this.menu = menu;

        if (getIntent().getStringExtra(SIS_KEY_TABLE) != null || menuVisible) {
            menu.findItem(R.id.speichern).setVisible(true);
            menu.findItem(R.id.gruppenbuchstabe).setVisible(true);
        }
        return true;
    }


    @Override
    public boolean onOptionsItemSelected(MenuItem item) {

        switch (item.getItemId()) {

            case R.id.speichern:

                save();
                finish();

                break;

            case R.id.gruppenbuchstabe:

                filter();

                break;

            case android.R.id.home:
                onBackPressed();
                break;
        }

        return false;
    }

    private void save() {
        List<RoomTimetableEvent> eventsToInsert = table.values().stream().flatMap(Collection::stream).filter(Event::isChecked).map(event -> {
            RoomTimetableEvent newEvent = new RoomTimetableEvent();
            newEvent.setName(event.getRealEvent().getName());
            newEvent.setStartTime(event.getRealEvent().getTimeBegin());
            newEvent.setEndTime(event.getRealEvent().getTimeEnd());
            newEvent.setRoomId(event.getRealEvent().getRoomId());
            newEvent.setLecturerId(event.getRealEvent().getLecturerId());
            newEvent.setLecturerName(event.getRealEvent().getLecturerName());
            newEvent.setDay(event.getRealEvent().getDayOfWeek());
            newEvent.setCourseType(event.getRealEvent().getCourseType());
            newEvent.setCourseId(event.getRealEvent().getCourseId());
            newEvent.setStudentSet(event.getRealEvent().getStudentSet());
            return newEvent;
        }).collect(Collectors.toList());

        Futures.addCallback(
            timetableEventDao.insertAllAsync(eventsToInsert),
            CallbackUtil.onSuccess(result -> {
                Intent returnIntent = new Intent();
                setResult(RESULT_OK, returnIntent);
                finish();
            }),
            ContextCompat.getMainExecutor(AddEventsActivity.this)
        );
    }

    private void filter() {
        FilterEdittextBinding dialogBinding = FilterEdittextBinding.inflate(getLayoutInflater());
        new MaterialDialog.Builder(this)
            .title(R.string.gruppenbuchstAnpassen)
            .positiveText(R.string.ok)
            .negativeText(R.string.abbrechen)
            .customView(dialogBinding.getRoot(), true)
            .callback(new MaterialDialog.ButtonCallback() {
                @Override
                public void onPositive(MaterialDialog dialog) {
                    String value = dialogBinding.inputFilter.getText().toString();
                    if (!Pattern.matches("[A-Z][0-9]+", value.toUpperCase()) && !value.isEmpty()) {
                        Toast.makeText(AddEventsActivity.this, R.string.error_validLetter, Toast.LENGTH_SHORT).show();
                        filter();
                    } else {

                        doFilter = !value.isEmpty();

                        letter = value.toUpperCase();

                        mSectionsPagerAdapter = new SectionsPagerAdapter(
                            getSupportFragmentManager());

                        int position = binding.pager.getCurrentItem();

                        binding.pager.setAdapter(mSectionsPagerAdapter);
                        binding.pager.setCurrentItem(position);
                    }
                }
            })
            .show();
    }

    private void showCourseDialog() {
        String[] dialogItems = new String[studiengängeMitSemester.size()];

        for (int i = 0; i < studiengängeMitSemester.size(); i++) {
            dialogItems[i] = studiengängeMitSemester.get(i).toString();
        }

        new AlertDialog.Builder(this)
            .setOnCancelListener(dialogInterface -> finish())
            .setTitle(R.string.studiengangWählen)
            .setItems(dialogItems, (dialogInterface, i) -> {
                selected = true;
                initializeSpinner(i);
            })
            .setNegativeButton(android.R.string.cancel, (dialogInterface, i) -> finish())
            .show();
    }

    private void initializeSpinner(int selectedItem) {
        ArrayAdapter<StudiengangMitSemester> spinnerAdapter = new ThemedArrayAdapter<>(getSupportActionBar().getThemedContext(), android.R.layout.simple_spinner_item, studiengängeMitSemester);
        spinnerAdapter.setDropDownViewResource(androidx.appcompat.R.layout.support_simple_spinner_dropdown_item);
        binding.spinner1.setAdapter(spinnerAdapter);
        if (selectedItem != -1) {
            binding.spinner1.setSelection(selectedItem);
        }
        binding.spinner1.setOnItemSelectedListener(new OnItemSelectedListener() {

            @Override
            public void onItemSelected(AdapterView<?> parent, View view,
                                       int position, long id) {

                StudiengangMitSemester selected = (StudiengangMitSemester) parent.getItemAtPosition(position);

                if (clicked) {
                    selectedStudiengangMitSemester = selected;

                    if (table != null && table.values().stream().anyMatch(day -> day.stream().anyMatch(Event::isChecked))) {
                        verlassenSpeichern(false);
                    } else {
                        loadTimetable(selected);
                    }
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
            }
        });

        binding.spinner1.setOnTouchListener((v, event) -> {
            AltesItem = binding.spinner1.getSelectedItemPosition();
            clicked = true;

            return false;
        });

        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        getSupportActionBar().setHomeButtonEnabled(true);
    }

    private void loadTimetable(StudiengangMitSemester studiengangMitSemester) {

        MainActivity.lockOrientation(this);

        final MaterialDialog dialog = new MaterialDialog.Builder(this)
            .content(R.string.warten_dialog)
            .progress(true, 0)
            .cancelable(false)
            .show();

        String studiengangId = studiengangMitSemester.getStudiengang().getId();
        String semester = studiengangMitSemester.getSemester().getGrade();

        timetableService.getEvents(studiengangId, semester).enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<List<de.fsrfb4.fb4.retrofit.timetable.Event>> call, retrofit2.Response<List<de.fsrfb4.fb4.retrofit.timetable.Event>> response) {
                table = Arrays.stream(DayOfWeek.values()).filter(d -> d != DayOfWeek.SATURDAY && d != DayOfWeek.SUNDAY)
                    .collect(Collectors.toMap(d -> d, d -> new LinkedList<>()));

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);
                for (de.fsrfb4.fb4.retrofit.timetable.Event event : response.body()) {
                    addToDay(table.get(DayOfWeek.from(formatter.parse(event.getWeekday()))), event);
                }

                table.values().forEach(Collections::sort);

                menu.findItem(R.id.speichern).setVisible(true);
                menu.findItem(R.id.gruppenbuchstabe).setVisible(true);
                menuVisible = true;

                mSectionsPagerAdapter = new SectionsPagerAdapter(
                    getSupportFragmentManager());

                // Set up the ViewPager with the sections adapter.
                binding.pager.setOffscreenPageLimit(5);
                binding.pager.setAdapter(mSectionsPagerAdapter);

                dialog.dismiss();
                MainActivity.unlockOrientation(AddEventsActivity.this);
            }

            @Override
            public void onFailure(Call<List<de.fsrfb4.fb4.retrofit.timetable.Event>> call, Throwable t) {
                log.error("Fehler beim Laden des Stundenplanes", t);
                if (!(t instanceof UnknownHostException)) {
                    FirebaseCrashlytics.getInstance().recordException(t);
                }
                dialog.dismiss();
                MainActivity.unlockOrientation(AddEventsActivity.this);

                Toast.makeText(AddEventsActivity.this, R.string.fehlerbeimLaden_Stundenpläne, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void addToDay(List<Event> day, de.fsrfb4.fb4.retrofit.timetable.Event newEvent) {
        for (Event event : day) {
            de.fsrfb4.fb4.retrofit.timetable.Event realEvent = event.realEvent;
            if (realEvent != null && realEvent.isSameEvent(newEvent) && (realEvent.getTimeSlotBegin() == newEvent.getTimeSlotBegin() - realEvent.getTimeSlotDuration() || newEvent.getTimeSlotBegin() == realEvent.getTimeSlotBegin() - newEvent.getTimeSlotDuration())) {
                if (realEvent.getTimeSlotBegin() < newEvent.getTimeSlotBegin()) {
                    realEvent.setTimeEnd(newEvent.getTimeEnd());
                    realEvent.setTimeSlotDuration(realEvent.getTimeSlotDuration() + newEvent.getTimeSlotDuration());
                } else {
                    realEvent.setTimeBegin(newEvent.getTimeBegin());
                    realEvent.setTimeSlotBegin(newEvent.getTimeSlotDuration());
                }
                return;
            }
        }

        day.add(new Event(newEvent));
    }

    private void verlassenSpeichern(final boolean exit) {
        new MaterialDialog.Builder(this)
            .title(R.string.speichern_Frage)
            .content(R.string.speichernStundenplan_Frage_Lang)
            .positiveText(R.string.ja)
            .negativeText(R.string.nein)
            .neutralText(R.string.abbrechen)
            .onPositive((dialog, which) -> {
                save();
                if (!exit) {
                    loadTimetable(selectedStudiengangMitSemester);
                } else {
                    finish();
                }
            })
            .onNegative((dialog, which) -> {
                if (!exit) {
                    loadTimetable(selectedStudiengangMitSemester);
                } else {
                    finish();
                }
            })
            .onNeutral((dialog, which) -> {
                if (!exit) {
                    binding.spinner1.setSelection(AltesItem);
                    clicked = false;
                }
            })
            .show();
    }

    @Override
    public void onBackPressed() {
        boolean checked = false;
        for (List<Event> events : table.values()) {
            if (events != null) {
                for (Event event : events) {
                    if (event.isChecked()) {
                        checked = true;
                        break;
                    }
                }
                if (checked) {
                    break;
                }
            }
        }

        if (checked) {
            verlassenSpeichern(true);
        } else {
            super.onBackPressed();
        }
    }

    private class SectionsPagerAdapter extends FragmentPagerAdapter {

        SectionsPagerAdapter(FragmentManager fm) {
            super(fm);
        }

        @Override
        public Fragment getItem(int position) {
            // getItem is called to instantiate the fragment for the given page.
            // Return a AddEventsDayFragment (defined as a static inner class
            // below) with the page number as its lone argument.
            Fragment fragment = new AddEventsDayFragment();
            Bundle args = new Bundle();
            args.putSerializable(AddEventsDayFragment.ARG_DAY, DayOfWeek.values()[position]);
            fragment.setArguments(args);
            return fragment;
        }

        @Override
        public int getCount() {
            return table.size();
        }

        @Override
        public CharSequence getPageTitle(int position) {
            return DayOfWeek.values()[position].getDisplayName(TextStyle.FULL, Locale.getDefault()).toUpperCase();
        }
    }

    @AndroidEntryPoint
    public static class AddEventsDayFragment extends AbstractDayFragment {

        private FragmentAddEventsDayBinding binding;

        CustomListViewAdapter adapter;

        AddEventsActivity parentActivity;

        @Override
        public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
            binding = FragmentAddEventsDayBinding.inflate(inflater, container, false);
            return binding.getRoot();
        }

        @Override
        public void onDestroyView() {
            super.onDestroyView();
            binding = null;
        }

        @Override
        public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
            super.onViewCreated(view, savedInstanceState);

            ViewCompat.setOnApplyWindowInsetsListener(binding.listEvents, (v, insets) -> {
                Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
                return insets;
            });

            parentActivity = (AddEventsActivity) getActivity();

            binding.listEvents.setClipToPadding(false);

            binding.listEvents.setOnItemClickListener((parent, view1, position, id) -> {
                CustomListViewAdapter customListViewAdapter = adapter;
                Event item = customListViewAdapter.getItem(position);
                item.setChecked(!customListViewAdapter.isChecked(position));
                customListViewAdapter.notifyDataSetChanged();
            });

            prepareListData();
        }

        private void prepareListData() {
            adapter = new CustomListViewAdapter(getActivity(), getEvents());

            if (parentActivity.doFilter) {
                adapter.addFilter(new LetterFilter(parentActivity.letter));
            }

            if (getEvents().size() > 0) {
                binding.listEvents.setAdapter(adapter);

                binding.textNoEvents.setVisibility(View.GONE);
            } else {
                binding.textNoEvents.setVisibility(View.VISIBLE);
            }

        }

        private List<Event> getEvents() {
            return parentActivity.table.get(getDay());
        }

        static class CustomListViewAdapter extends ArrayAdapter<Event> {

            private Context context;
            private List<Filter> filter;
            private ViewHolder holder;

            CustomListViewAdapter(Context context, List<Event> items) {
                super(context, R.layout.custom_row_view2, items);
                this.context = context;
                filter = new ArrayList<>();
            }

            @NonNull
            public View getView(final int position, View convertView, @NonNull ViewGroup parent) {
                holder = null;
                final Event rowItem = getItem(position);

                LayoutInflater mInflater = LayoutInflater.from(parent.getContext());
                if (convertView == null) {
                    CustomRowView2Binding binding = CustomRowView2Binding.inflate(mInflater, null, false);
                    convertView = binding.getRoot();
                    holder = new ViewHolder(binding);
                    convertView.setTag(holder);
                } else {
                    holder = (ViewHolder) convertView.getTag();
                }

                de.fsrfb4.fb4.retrofit.timetable.Event realEvent = rowItem.getRealEvent();
                holder.binding.textTime.setText(realEvent.getTimeBegin().format(DateTimeFormatter.ofPattern("HH:mm", Locale.GERMANY)) + "\n" + realEvent.getTimeEnd().format(DateTimeFormatter.ofPattern("HH:mm", Locale.GERMANY)));
                holder.binding.textCourseName.setText("[" + realEvent.getCourseType() + "] " + realEvent.getName());
                holder.binding.textDetails.setText(realEvent.getStudentSet() + " | " + realEvent.getLecturerName() + " (" + realEvent.getLecturerId() + ")");
                holder.binding.textRoom.setText(String.valueOf(realEvent.getRoomId()));


                boolean isFiltered = !filter.isEmpty();

                for (Filter<Event> f : filter) {
                    isFiltered = isFiltered && f.accept(rowItem);
                }

                if (isFiltered) {
                    Resources res = context.getResources();
                    holder.binding.cardView.setCardBackgroundColor(res.getColor(R.color.card_orange));
                    holder.binding.textTime.setTextColor(res.getColor(R.color.textorangefilter));
                    holder.binding.textCourseName.setTextColor(res.getColor(R.color.textorangefilter));
                    holder.binding.textDetails.setTextColor(res.getColor(R.color.textorangefilter));
                    holder.binding.textRoom.setTextColor(res.getColor(R.color.textorangefilter));
                }

                holder.binding.checkboxSelect.setChecked(rowItem.isChecked());

                holder.binding.checkboxSelect.setOnCheckedChangeListener((buttonView, isChecked) -> rowItem.setChecked(isChecked));

                return convertView;
            }

            @Override
            public int getViewTypeCount() {

                return getCount();
            }

            @Override
            public int getItemViewType(int position) {

                return position;
            }

            public boolean isChecked(int pos) {
                return getItem(pos).isChecked();
            }

            public void addFilter(Filter<Event> f) {
                filter.add(f);
            }

            public void removeFilter(Filter<Event> f) {
                filter.remove(f);
            }

            private class ViewHolder {
                CustomRowView2Binding binding;

                public ViewHolder(CustomRowView2Binding binding) {
                    this.binding = binding;
                }
            }
        }
    }

    @Getter
    @AllArgsConstructor
    @EqualsAndHashCode
    private static class StudiengangMitSemester implements Serializable {
        private final CourseOfStudy studiengang;
        private final CourseOfStudyGrade semester;

        @Override
        public String toString() {
            String name = this.studiengang.getName();
            String semester = this.semester.getGrade();

            if ("*".equals(semester)) {
                return name;
            } else {
                return semester + ". Sem. " + name;
            }
        }
    }

    @Getter
    @Setter
    @RequiredArgsConstructor
    public static class Event implements Comparable<Event>, Serializable {
        boolean checked;
        final de.fsrfb4.fb4.retrofit.timetable.Event realEvent;

        @Override
        public int compareTo(@NonNull Event e) {
            if (realEvent.getTimeBegin().equals(e.getRealEvent().getTimeBegin())) {
                return 0;
            }
            return realEvent.getTimeBegin().isAfter(e.getRealEvent().getTimeBegin()) ? 1 : -1;
        }
    }
}
