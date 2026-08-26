package de.fsrfb4.fb4.activities;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.AppCompatCheckBox;
import androidx.core.content.ContextCompat;
import androidx.core.content.res.ResourcesCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.widget.CompoundButtonCompat;
import androidx.preference.PreferenceManager;

import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.Futures;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.firebase.messaging.FirebaseMessaging;
import com.redbooth.WelcomeCoordinatorLayout;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.timetable.AddEventsActivity;
import de.fsrfb4.fb4.databinding.WelcomePageBinding;
import de.fsrfb4.fb4.firebase.DefaultFirebaseMessagingService;
import de.fsrfb4.fb4.model.Canteen;
import de.fsrfb4.fb4.service.CanteenService;
import de.fsrfb4.fb4.service.DataService;
import de.fsrfb4.fb4.util.TimeTableUtils;

import static de.fsrfb4.fb4.SplashActivity.SP_KEY_FIRSTSTART;

@AndroidEntryPoint
public class WelcomePageActivity extends AppCompatActivity {
    private static final String SIS_KEY_CURRENTPAGE = "page";

    @Inject
    CanteenService canteenService;

    @Inject
    DataService dataService;

    private WelcomePageBinding binding;

    boolean showTimeTablePage = true;
    private static int START_PAGE = -1;
    private static int BACKUP_PAGE = -1;
    private static int TIMETABLE_PAGE = -1;
    private static int MENU_PAGE = -1;
    private int counter;
    private ValueAnimator backgroundAnimator;
    private boolean animationReady;
    private Map<Canteen, CheckBox> menuCheckBoxes;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = WelcomePageBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        ViewCompat.setOnApplyWindowInsetsListener(binding.layoutWelcomeRoot, (v, insets) -> {
            Insets innerPadding = insets.getInsets(WindowInsetsCompat.Type.navigationBars() | WindowInsetsCompat.Type.statusBars());
            binding.layoutWelcomeRoot.setPadding(innerPadding.left, innerPadding.top, innerPadding.right, innerPadding.bottom);
            return insets;
        });

        binding.coordinator.showIndicators(true);
        binding.coordinator.setIndicatorColorSelected(ResourcesCompat.getColor(getResources(), android.R.color.white, getTheme()));

        initializeBackgroundTransitions();

        List<Integer> layouts = new ArrayList<>();

        findViewById(R.id.button_skip).setOnClickListener(view -> {
            firstStart();
            Intent intent = new Intent(WelcomePageActivity.this, MainActivity.class);
            startActivity(intent);
            finish();
        });

        layouts.add(R.layout.welcome_page_start);
        START_PAGE = counter++;

        if (TimeTableUtils.backupExists(this)) {
            layouts.add(R.layout.welcome_page_backup_found);
            BACKUP_PAGE = counter++;
        }

        layouts.add(R.layout.welcome_page_create_timetable);
        TIMETABLE_PAGE = counter++;

        layouts.add(R.layout.welcome_page_menu);
        MENU_PAGE = counter++;

        for (int i = layouts.size() - 1; i >= 0; i--) {
            binding.coordinator.addPage(layouts.get(i));
        }

        initializeMenuPage();
        initializeListeners();

        binding.coordinator.setOnPageScrollListener(new WelcomeCoordinatorLayout.OnPageScrollListener() {

            @Override
            public void onScrollPage(View v, float progress, float maximum) {
                if (!animationReady) {
                    animationReady = true;
                    backgroundAnimator.setDuration((long) maximum);
                }
                backgroundAnimator.setCurrentPlayTime((long) progress);
            }

            @Override
            public void onPageSelected(View v, int pageSelected) {
            }
        });
    }

    private void initializeMenuPage() {
        final List<Canteen> canteens = new ArrayList<>(canteenService.getCanteens().values());
        Collections.sort(canteens);

        ColorStateList colorStateList = new ColorStateList(
            new int[][]{
                new int[]{-android.R.attr.state_checked}, // unchecked
                new int[]{android.R.attr.state_checked}, // checked
            },
            new int[]{
                Color.WHITE,
                Color.WHITE,
            }
        );

        LinearLayout checkBoxLayout = binding.coordinator.findViewById(R.id.layout_checkboxes);

        menuCheckBoxes = new HashMap<>();
        for (Canteen canteen : canteens) {
            AppCompatCheckBox checkBox = new AppCompatCheckBox(checkBoxLayout.getContext());
            checkBox.setText(canteen.getName());
            checkBox.setChecked(canteen.isEnabledDefault());
            CompoundButtonCompat.setButtonTintList(checkBox, colorStateList);
            menuCheckBoxes.put(canteen, checkBox);
            checkBoxLayout.addView(checkBox);
        }
    }

    private void initializeListeners() {
        try {
            binding.coordinator.findViewById(R.id.button_restore).setOnClickListener(view -> restoreBackup());
        } catch (NullPointerException e) { }

        try {
            binding.coordinator.findViewById(R.id.button_create_timetable).setOnClickListener(view -> {
                Intent i = new Intent(WelcomePageActivity.this, AddEventsActivity.class);
                startActivityForResult(i, 1);
            });
        } catch (NullPointerException e) { }

        try {
            binding.coordinator.findViewById(R.id.button_done).setOnClickListener(view -> {
                saveMenu();
                firstStart();
                Intent intent = new Intent(WelcomePageActivity.this, MainActivity.class);
                startActivity(intent);
                finish();
            });
        } catch (NullPointerException e) { }
    }

    private void saveMenu() {
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(this);
        SharedPreferences.Editor prefsEditor = appSharedPrefs.edit();

        for (Map.Entry<Canteen, CheckBox> entry : menuCheckBoxes.entrySet()) {
            prefsEditor.putBoolean(entry.getKey().getId(), entry.getValue().isChecked());
        }

        prefsEditor.commit();
    }

    private void restoreBackup() {
        Futures.addCallback(
            TimeTableUtils.restoreBackup(this),
            new FutureCallback<>() {
                @Override
                public void onSuccess(Boolean result) {
                    if (result != null && result) {
                        binding.coordinator.setCurrentPage(TIMETABLE_PAGE, true);
                    } else {
                        binding.coordinator.setCurrentPage(MENU_PAGE, true);
                    }
                }

                @Override
                public void onFailure(Throwable t) {
                    Toast.makeText(WelcomePageActivity.this, getString(R.string.stundenplanNichtWiederhergestellt), Toast.LENGTH_SHORT).show();
                    FirebaseCrashlytics.getInstance().recordException(t);
                    if (showTimeTablePage) {
                        binding.coordinator.setCurrentPage(TIMETABLE_PAGE, true);
                    } else {
                        binding.coordinator.setCurrentPage(MENU_PAGE, true);
                    }
                }
            },
            ContextCompat.getMainExecutor(this)
        );
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (resultCode == RESULT_OK) {
            if (requestCode == 1) {
                binding.coordinator.setCurrentPage(MENU_PAGE, true);
            } else {
                super.onActivityResult(requestCode, resultCode, data);
            }
        }
    }

    private void initializeBackgroundTransitions() {
        final Resources resources = getResources();
        final int colorPage1 = ResourcesCompat.getColor(resources, R.color.page1, getTheme());
        final int colorPage2 = ResourcesCompat.getColor(resources, R.color.page2, getTheme());
        final int colorPage3 = ResourcesCompat.getColor(resources, R.color.page3, getTheme());
        final int colorPage4 = ResourcesCompat.getColor(resources, R.color.page4, getTheme());
        backgroundAnimator = ValueAnimator
            .ofObject(new ArgbEvaluator(), colorPage1, colorPage2, colorPage3, colorPage4);
        backgroundAnimator.addUpdateListener(animation -> binding.layoutWelcomeRoot.setBackgroundColor((int) animation.getAnimatedValue()));
    }

    public void firstStart() {
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(this);
        SharedPreferences.Editor edit = appSharedPrefs.edit();

        edit.putBoolean(SP_KEY_FIRSTSTART, false);

        edit.putLong(getString(R.string.preference_key_news_last_checked),
            LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()).apply();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            edit.putBoolean(getString(R.string.preference_key_news_notifications), false).apply();
        } else {
            FirebaseMessaging.getInstance().subscribeToTopic(DefaultFirebaseMessagingService.TOPIC_AKTUELLES);
        }

        edit.commit();

        dataService.createUpdateWorkRequest(null);
    }
}
