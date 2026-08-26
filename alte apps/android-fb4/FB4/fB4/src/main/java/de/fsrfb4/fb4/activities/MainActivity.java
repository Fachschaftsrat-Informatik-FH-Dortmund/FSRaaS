package de.fsrfb4.fb4.activities;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Dialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.preference.PreferenceManager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.URLUtil;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatDialog;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;

import com.afollestad.materialdialogs.MaterialDialog;
import com.ferfalk.simplesearchview.SimpleSearchView;
import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.navigation.NavigationView;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.net.UnknownHostException;
import java.util.Locale;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.BuildConfig;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.model.ServerMessage;
import de.fsrfb4.fb4.databinding.ActivityMainBinding;
import de.fsrfb4.fb4.fragments.MenuItemFragment;
import de.fsrfb4.fb4.fragments.news.NewsEconomyFragment;
import de.fsrfb4.fb4.fragments.news.NewsFragment;
import de.fsrfb4.fb4.fragments.roomsearch.RoomSearchFragment;
import de.fsrfb4.fb4.fragments.menu.MenuFragment;
import de.fsrfb4.fb4.dialog.CalendarExportDialog;
import de.fsrfb4.fb4.fragments.timetable.TimetableFragment;
import de.fsrfb4.fb4.retrofit.ServerMessageApi;
import de.fsrfb4.fb4.service.DataService;
import de.fsrfb4.fb4.service.NewsService;
import permissions.dispatcher.NeedsPermission;
import permissions.dispatcher.RuntimePermissions;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@RuntimePermissions
@AndroidEntryPoint
public class MainActivity extends AppCompatActivity {
    private static final String EXTRA_SHORTCUT_FRAGMENT = "shortcut_fragment";

    private ActionBarDrawerToggle mDrawerToggle;

    private CharSequence mDrawerTitle;
    private CharSequence mTitle;
    int aktuellePos = -1;
    boolean IntentHandled;
    DownloadManager manager;
    long DownloadID;
    Fragment fragment;

    private ActivityMainBinding binding;

    @Inject
    public ServerMessageApi service;

    @Inject
    public DataService dataService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(this);

        mDrawerTitle = getTitle();
        mTitle = mDrawerTitle;

        setSupportActionBar(binding.toolbarLayout.toolbar);

        setNavDrawerActivityParams(binding.navigationView);

        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        getSupportActionBar().setHomeButtonEnabled(true);
        getSupportActionBar().setIcon(android.R.color.transparent);

        mDrawerToggle = new ActionBarDrawerToggle(this, binding.drawerLayout,
            R.string.app_name, // nav drawer open - description for accessibility
            R.string.app_name // nav drawer close - description for accessibility
        ) {
            public void onDrawerClosed(View view) {
                getSupportActionBar().setTitle(mTitle);
                // calling onPrepareOptionsMenu() to show action bar icons
                invalidateOptionsMenu();
            }

            public void onDrawerOpened(View drawerView) {
                getSupportActionBar().setTitle(mDrawerTitle);
                // calling onPrepareOptionsMenu() to hide action bar icons
                getSupportActionBar().setDisplayOptions(
                    ActionBar.DISPLAY_HOME_AS_UP | ActionBar.DISPLAY_SHOW_TITLE);
                invalidateOptionsMenu();
            }
        };
        binding.drawerLayout.addDrawerListener(mDrawerToggle);

        if (savedInstanceState == null) {
            boolean intent = handleIntent();
            if (!intent) {
                if (getIntent().hasExtra(EXTRA_SHORTCUT_FRAGMENT)) {
                    openShortcutFragment();
                } else {
                    int view = Integer.valueOf(appSharedPrefs.getString(getString(R.string.preference_key_launch_screen),
                        getString(R.string.preference_default_launch_screen)));
                    displayViewByIndex(view);
                }
            }
        } else {
            aktuellePos = savedInstanceState.getInt("Pos", R.id.stundenplan);
            setTitle(binding.navigationView.getMenu().findItem(aktuellePos).getTitle());
        }

        binding.navigationView.setNavigationItemSelectedListener(new SlideMenuClickListener());

        getMessagesFromServer();
    }

    private void openShortcutFragment() {
        String fragment = getIntent().getStringExtra(EXTRA_SHORTCUT_FRAGMENT);

        if (fragment != null) {
            switch (fragment) {
                case "timetable":
                    displayViewByIndex(1);
                    break;
                case "news":
                    displayViewByIndex(2);
                    break;
                case "news_w":
                    displayViewByIndex(3);
                    break;
                case "menu":
                    displayViewByIndex(4);
                    break;
                case "room":
                    displayViewByIndex(5);
                    break;

            }
        }
    }

    private void setNavDrawerActivityParams(View view) {
        ViewCompat.setOnApplyWindowInsetsListener(binding.toolbarLayout.getRoot(), (v, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(0, systemBars.top, 0, 0);
            return windowInsets;
        });
    }

    @Override
    public void onSaveInstanceState(Bundle savedInstanceState) {
        savedInstanceState.putInt("Pos", aktuellePos);
        super.onSaveInstanceState(savedInstanceState);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // toggle nav drawer on selecting action bar app icon/title
        if (mDrawerToggle.onOptionsItemSelected(item)) {
            return true;
        }

        switch (item.getItemId()) {
            case R.id.calendar:
                MainActivityPermissionsDispatcher.showCalendarDialogWithPermissionCheck(this);
                break;
            default:
                return super.onOptionsItemSelected(item);
        }
        return false;
    }

    @NeedsPermission({Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR})
    protected void showCalendarDialog() {
        CalendarExportDialog export = new CalendarExportDialog(this, dataService);
        export.showDialog();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (resultCode == RESULT_OK) {
            if (requestCode == 1 || requestCode == 65537) {
                aktuellePos = -1;
                displayView(R.id.stundenplan);
            } else if (requestCode == 2) {
                if (aktuellePos == R.id.speiseplan || aktuellePos == R.id.stundenplan) {
                    int tmp = aktuellePos;
                    aktuellePos = -1;
                    displayView(tmp);
                }

            } else {
                super.onActivityResult(requestCode, resultCode, data);
            }
        }
    }

    /***
     * Called when invalidateOptionsMenu() is triggered
     */
    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        // if nav drawer is opened, hide the action items
        boolean drawerOpen = binding.drawerLayout.isDrawerOpen(binding.navigationView);
        menu.findItem(R.id.calendar).setVisible(false);

        if (!drawerOpen) {
            if (aktuellePos != R.id.stundenplan) {
                menu.findItem(R.id.calendar).setVisible(false);
            } else {
                menu.findItem(R.id.calendar).setVisible(true);
            }

        }

        if (fragment != null) {
            if (fragment instanceof MenuItemFragment) {
                ((MenuItemFragment) fragment).setMenuVisible(!drawerOpen);
            }
        }

        return super.onPrepareOptionsMenu(menu);
    }
    
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }


    @Override
    public void setTitle(CharSequence title) {
        mTitle = title;
        getSupportActionBar().setTitle(mTitle);
    }

    /**
     * When using the ActionBarDrawerToggle, you must call it during
     * onPostCreate() and onConfigurationChanged()...
     */

    @Override
    protected void onPostCreate(Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
        // Sync the toggle state after onRestoreInstanceState has occurred.
        mDrawerToggle.syncState();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Pass any configuration change to the drawer toggls
        mDrawerToggle.onConfigurationChanged(newConfig);
    }

    private void displayViewByIndex(int index) {
        MenuItem menuItem = binding.navigationView.getMenu().getItem(index - 1);
        if (menuItem != null) {
            menuItem.setChecked(true);
            displayView(menuItem);
        }
    }

    private void displayView(int id) {
        MenuItem menuItem = binding.navigationView.getMenu().findItem(id);
        if (menuItem != null) {
            menuItem.setChecked(true);
            displayView(menuItem);
        }
    }

    @SuppressLint("SetTextI18n")
    private void displayView(MenuItem menuItem) {
        // update the main content by replacing fragments
        Intent i;

        fragment = null;
        switch (menuItem.getItemId()) {
            case R.id.stundenplan:
                fragment = new TimetableFragment();
                break;
            case R.id.aktuelles:
                fragment = new NewsFragment();
                break;
            case R.id.aktuelles_wirtschaft:
                fragment = new NewsEconomyFragment();
                break;
            case R.id.speiseplan:
                fragment = new MenuFragment();
                break;
            case R.id.leeren_raum_suchen:
                fragment = new RoomSearchFragment();
                break;
            case R.id.links_downloads:
                i = new Intent(MainActivity.this, PreferenceActivity.class);
                i.putExtra(PreferenceActivity.INTENT_EXTRA_FRAGMENT, PreferenceActivity.FRAGMENT_LINKSDOWNLOADS);
                startActivity(i);
                break;
            case R.id.feedback:
                startFeedbackIntent();
                break;
            case R.id.einstellungen:
                i = new Intent(MainActivity.this, PreferenceActivity.class);
                i.putExtra(PreferenceActivity.INTENT_EXTRA_FRAGMENT, PreferenceActivity.FRAGMENT_SETTINGS);
                startActivityForResult(i, 2);
                break;
            case R.id.über:
                Dialog dialog = new AppCompatDialog(this);
                dialog.setContentView(R.layout.about);
                final TextView version = (TextView) dialog.findViewById(R.id.textViewVersion);

                version.setText("v" + BuildConfig.VERSION_NAME);
                dialog.show();
                break;
            /*case R.id.ticket:
                i = new Intent(NavDrawerActivity.this, TicketViewActivity.class);
                startActivity(i);
                break;*/
            default:
                break;
        }

        if (fragment != null && aktuellePos != menuItem.getItemId()) {
            FragmentManager fragmentManager = getSupportFragmentManager();
            fragmentManager.beginTransaction()
                .replace(R.id.frame_container, fragment).commitAllowingStateLoss();
            setTitle(menuItem.getTitle());
            aktuellePos = menuItem.getItemId();
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // onResume gets called after this to handle the intent
        super.onNewIntent(intent);
        setIntent(intent);
        IntentHandled = false;
    }

    @Override
    public void onResume() {
        super.onResume();
        handleIntent();
    }

    private boolean handleIntent() {
        if (!IntentHandled) {
            IntentHandled = true;
            if (getIntent().getIntExtra("Fragment", -1) == R.id.aktuelles) {
                SharedPreferences.Editor edit = PreferenceManager.getDefaultSharedPreferences(this).edit();
                edit.putInt(NewsService.NOTIF_COUNT, 0);
                edit.putString(NewsService.NOTIF_TEXT, "");
                edit.commit();

                aktuellePos = -1;
                displayView(getIntent().getIntExtra("Fragment", -1));
                return true;
            }
        }
        return false;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        MainActivityPermissionsDispatcher.onRequestPermissionsResult(this, requestCode, grantResults);
    }

    private void getMessagesFromServer() {
        String sprache = Locale.getDefault().getLanguage();
        Log.e("Sprache:", sprache);
        String api = String.valueOf(Build.VERSION.SDK_INT);
        String version;
        try {
            PackageInfo pinfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            version = String.valueOf(pinfo.versionCode);
        } catch (NameNotFoundException e) {
            version = "0";
        }

        Call<ServerMessage[]> messages = service.getMessage(sprache, api, version);

        messages.enqueue(new Callback<ServerMessage[]>() {
            @Override
            public void onResponse(Call<ServerMessage[]> call, Response<ServerMessage[]> response) {
                try {
                    if (response.isSuccessful()) {
                        ServerMessage[] messages = response.body();
                        SharedPreferences appSharedPrefs = PreferenceManager
                            .getDefaultSharedPreferences(MainActivity.this);
                        for (ServerMessage m : messages) {
                            if (appSharedPrefs.getInt("Meldung", 0) < Integer.valueOf(m.getID()) || m.getDauerhaft() == 1) {
                                showMessage(m);
                                SharedPreferences.Editor edit = appSharedPrefs.edit();
                                edit.putInt("Meldung", Integer.valueOf(m.getID()));
                                edit.commit();
                            }
                        }
                    }
                } catch (Exception e) {
                    FirebaseCrashlytics.getInstance().recordException(e);
                    Log.e("getMessagesFromServer:", "Exception", e);
                }
            }

            @Override
            public void onFailure(Call<ServerMessage[]> call, Throwable t) {
                if (!(t instanceof UnknownHostException)) {
                    FirebaseCrashlytics.getInstance().recordException(t);
                }
                Log.e("getMessagesFromServer:", "onFailure", t);
            }
        });

    }

    private void showMessage(final ServerMessage serverMessage) {
        MaterialDialog.Builder dialog = new MaterialDialog.Builder(this)
            .title(serverMessage.getTitel())
            .content(serverMessage.getText())
            .cancelable(false);

        if (!serverMessage.getButton1Text().isEmpty()) {
            dialog.positiveText(serverMessage.getButton1Text())
                .onPositive((dialog1, which) -> {
                    if (!serverMessage.getButton1Action().isEmpty()) {
                        if (URLUtil.isValidUrl(serverMessage.getButton1Action())) {
                            Intent i = new Intent(Intent.ACTION_VIEW);
                            i.setData(Uri.parse(serverMessage.getButton1Action()));
                            startActivity(i);
                        }
                    }
                });
        }

        if (!serverMessage.getButton2Text().isEmpty()) {
            dialog.negativeText(serverMessage.getButton2Text())
                .onNegative((dialog12, which) -> {
                    if (!serverMessage.getButton2Action().isEmpty()) {
                        if (URLUtil.isValidUrl(serverMessage.getButton2Action())) {
                            Intent i = new Intent(Intent.ACTION_VIEW);
                            i.setData(Uri.parse(serverMessage.getButton2Action()));
                            startActivity(i);
                        }
                    }
                });
        }
        dialog.show();

        String api = String.valueOf(Build.VERSION.SDK_INT);
        String version;
        try {
            PackageInfo pinfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            version = String.valueOf(pinfo.versionCode);
        } catch (NameNotFoundException e) {
            version = "-1";
        }
    }

    private BroadcastReceiver downloadReceiver = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {

            Intent i = new Intent(Intent.ACTION_VIEW);
            try {
                i.setDataAndType(manager.getUriForDownloadedFile(DownloadID), "application/vnd.android.package-archive");
                startActivity(i);
                unregisterReceiver(downloadReceiver);
            } catch (Exception e) {
            }
        }
    };


    public static void lockOrientation(Activity ac) {
        if (ac == null) {
            return;
        }

        int currentOrientation = ac.getResources().getConfiguration().orientation;
        if (currentOrientation == Configuration.ORIENTATION_PORTRAIT) {
            ac.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            ac.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        }
    }

    public static void unlockOrientation(Activity ac) {
        if (ac == null) {
            return;
        }

        ac.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
    }

    public AppBarLayout getAppBarLayout() {
        return (AppBarLayout) binding.toolbarLayout.appBar;
    }

    public SimpleSearchView getSearchView() {
        return binding.toolbarLayout.searchView;
    }

    @Override
    public void onBackPressed() {
        if (binding.toolbarLayout.searchView.onBackPressed()) {
            return;
        }

        super.onBackPressed();
    }

    private void startFeedbackIntent() {
        int api = Build.VERSION.SDK_INT;
        int version = -1;
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            version = pInfo.versionCode;
        } catch (NameNotFoundException e) {
        }

        String body = "\n\n\n" +
            "Version: " + version + "\n" +
            "API: " + api;

        Intent intent = new Intent(Intent.ACTION_SENDTO);
        intent.setData(Uri.parse("mailto:"));
        intent.putExtra(Intent.EXTRA_EMAIL, new String[]{"app@fsrfb4.de"});
        intent.putExtra(Intent.EXTRA_SUBJECT, "FB4-App");
        intent.putExtra(Intent.EXTRA_TEXT, body);
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, R.string.noMailClientFound, Toast.LENGTH_SHORT).show();
        }
    }

    private class SlideMenuClickListener implements NavigationView.OnNavigationItemSelectedListener {

        @Override
        public boolean onNavigationItemSelected(@NonNull MenuItem menuItem) {
            //Closing drawer on item click
            binding.drawerLayout.closeDrawers();

            displayView(menuItem);
            return true;
        }
    }
}
