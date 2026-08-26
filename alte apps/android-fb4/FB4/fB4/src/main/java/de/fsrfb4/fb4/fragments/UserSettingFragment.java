package de.fsrfb4.fb4.fragments;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.preference.CheckBoxPreference;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;
import androidx.preference.PreferenceManager;
import androidx.recyclerview.widget.RecyclerView;

import com.afollestad.materialdialogs.MaterialDialog;
import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.Futures;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.firebase.messaging.FirebaseMessaging;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.MenuSortActivity;
import de.fsrfb4.fb4.activities.ticket.ShortCutActivity;
import de.fsrfb4.fb4.firebase.DefaultFirebaseMessagingService;
import de.fsrfb4.fb4.model.Canteen;
import de.fsrfb4.fb4.room.TimetableEventDao;
import de.fsrfb4.fb4.service.CanteenService;
import de.fsrfb4.fb4.util.CallbackUtil;
import de.fsrfb4.fb4.util.TicketUtil;
import de.fsrfb4.fb4.util.TimeTableUtils;
import permissions.dispatcher.NeedsPermission;
import permissions.dispatcher.OnNeverAskAgain;
import permissions.dispatcher.OnPermissionDenied;
import permissions.dispatcher.RuntimePermissions;

@AndroidEntryPoint
@RuntimePermissions
public class UserSettingFragment extends PreferenceFragmentCompat implements SharedPreferences.OnSharedPreferenceChangeListener {
    private static final int REQUEST_CODE_MENUSORT = 1;

    @Inject
    public TimetableEventDao timetableEventDao;
    private static final int REQUEST_CODE_SELECTTICKET = 2;

    Preference PrefSpeisepläne;
    Preference PrefSpeisepläneSort;
    Preference PrefLöschen;
    Preference PrefBackup;
    Preference PrefRestore;
    Preference PrefChooseTicket;
    Preference PrefDownloadTicket;
    CheckBoxPreference prefUpdateTicket;
    CheckBoxPreference prefNewsNotifications;
    Editor edit;

    @Inject
    CanteenService canteenService;

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {

    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        addPreferencesFromResource(R.xml.settings);

        View view = super.onCreateView(inflater, container, savedInstanceState);

        RecyclerView recyclerView = getListView();
        if (recyclerView != null) {
            recyclerView.setClipToPadding(false);

            ViewCompat.setOnApplyWindowInsetsListener(recyclerView, (v, insets) -> {
                Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
                return insets;
            });
        }

        edit = PreferenceManager.getDefaultSharedPreferences(getActivity()).edit();

        PrefSpeisepläne = findPreference(getString(R.string.preference_key_menus));
        PrefSpeisepläne.setOnPreferenceClickListener(preference -> {
            final List<Canteen> canteens = new ArrayList<>(canteenService.getCanteens().values());
            Collections.sort(canteens);

            SharedPreferences appSharedPrefs = PreferenceManager
                .getDefaultSharedPreferences(getActivity().getApplicationContext());

            List<String> values = new ArrayList<>();
            List<Integer> checkedValues = new ArrayList<>();
            for (Canteen canteen : canteens) {
                values.add(canteen.getName());
                if (appSharedPrefs.getBoolean(canteen.getId(), canteen.isEnabledDefault())) {
                    checkedValues.add(values.size() - 1);
                }
            }

            new MaterialDialog.Builder(getActivity())
                .title(R.string.speisepläne)
                .content(R.string.speisepläneWählen)
                .items(values)
                .itemsCallbackMultiChoice(checkedValues.toArray(new Integer[checkedValues.size()]), (dialog, which, text) -> {
                    SharedPreferences appSharedPrefs1 = PreferenceManager
                        .getDefaultSharedPreferences(getActivity().getApplicationContext());
                    Editor prefsEditor = appSharedPrefs1.edit();

                    List<Integer> checked = Arrays.asList(which);
                    int i = 0;
                    for (Canteen canteen : canteens) {
                        prefsEditor.putBoolean(canteen.getId(), checked.contains(i));
                        i++;
                    }
                    prefsEditor.commit();

                    Intent returnIntent = new Intent();
                    getActivity().setResult(Activity.RESULT_OK, returnIntent);
                    return true;
                })
                .positiveText(R.string.ok)
                .negativeText(R.string.abbrechen)
                .show();

            return true;
        });

        PrefSpeisepläneSort = findPreference(getString(R.string.preference_key_menus_sort));
        PrefSpeisepläneSort.setOnPreferenceClickListener(preference -> {
            Intent i = new Intent(getActivity(), MenuSortActivity.class);
            startActivityForResult(i, REQUEST_CODE_MENUSORT);
            return true;
        });

        PrefLöschen = findPreference(getString(R.string.preference_key_delete_timetable));
        PrefLöschen.setOnPreferenceClickListener(preference -> {

            new MaterialDialog.Builder(getActivity())
                .title(R.string.stundenplanLöschen_Frage)
                .content(R.string.stundenplanLöschen_Frage_Lang)
                .positiveText(R.string.ja)
                .negativeText(R.string.nein)
                .callback(new MaterialDialog.ButtonCallback() {
                    @Override
                    public void onPositive(MaterialDialog dialog) {
                        Futures.addCallback(
                            timetableEventDao.deleteAllAsync(),
                            CallbackUtil.onSuccess(result -> {
                                Intent returnIntent = new Intent();
                                getActivity().setResult(Activity.RESULT_OK, returnIntent);
                                Toast.makeText(getActivity(), getString(R.string.stundenplanWurdeGelöscht), Toast.LENGTH_SHORT).show();
                            }),
                            ContextCompat.getMainExecutor(getContext())
                        );
                    }
                })
                .show();

            return true;
        });

        PrefBackup = findPreference(getString(R.string.preference_key_backup_timetable));
        PrefBackup.setOnPreferenceClickListener(preference -> {
            createBackup();
            return true;
        });

        PrefRestore = findPreference(getString(R.string.preference_key_restore_timetable));
        PrefRestore.setOnPreferenceClickListener(preference -> {
            restoreBackup();
            return true;
        });

        /*PrefDownloadTicket = findPreference(getString(R.string.preference_key_ticket_download));
        PrefDownloadTicket.setOnPreferenceClickListener(preference -> {
            Intent i = new Intent(getActivity(), TicketDownloadActivity.class);
            startActivity(i);
            return true;
        });

        PrefChooseTicket = findPreference(getString(R.string.preference_key_choose_ticket));
        PrefChooseTicket.setOnPreferenceClickListener(preference -> {
            selectFile();
            return true;
        });

        prefUpdateTicket = findPreference(getString(R.string.preference_key_update_ticket));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            prefUpdateTicket.setOnPreferenceClickListener(preference -> {
                if (!UserCredentialsHelper.credentialsExists(getContext())) {
                    prefUpdateTicket.setChecked(false);
                    Intent i = new Intent(getContext(), TicketDownloadActivity.class);
                    i.putExtra(TicketDownloadActivity.INTENT_EXTRA_ONLY_LOGIN, true);
                    startActivity(i);
                } else if (((CheckBoxPreference) preference).isChecked()) {
                    askTicketNotificationPermissionRationale();
                }
                return true;
            });
        } else {
            prefUpdateTicket.setVisible(false);
        }*/

        prefNewsNotifications = findPreference(getString(R.string.preference_key_news_notifications));

        getPreferenceScreen().getSharedPreferences()
            .registerOnSharedPreferenceChangeListener(this);

        return view;
    }

    private void createBackup() {
        Futures.addCallback(
            TimeTableUtils.createBackup(getContext()),
            new FutureCallback<>() {
                @Override
                public void onSuccess(Boolean result) {
                    if (result != null && result) {
                        Toast.makeText(getActivity(), getString(R.string.backupWurdeErstellt), Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(getActivity(), getString(R.string.backupWurdeNichtErstellt), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Throwable t) {
                    Toast.makeText(getActivity(), getString(R.string.backupWurdeNichtErstellt), Toast.LENGTH_SHORT).show();
                }
            },
            ContextCompat.getMainExecutor(getContext())
        );
    }

    private void restoreBackup() {
        Futures.addCallback(
            TimeTableUtils.restoreBackup(getContext()),
            new FutureCallback<>() {
                @Override
                public void onSuccess(Boolean result) {
                    if (result != null && result) {
                        Intent returnIntent = new Intent();
                        getActivity().setResult(Activity.RESULT_OK, returnIntent);
                        Toast.makeText(getActivity(), getString(R.string.stundenplanWiederhergestellt), Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(getContext(), getString(R.string.backupDoesNotExist), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Throwable t) {
                    Toast.makeText(getActivity(), getString(R.string.stundenplanNichtWiederhergestellt), Toast.LENGTH_SHORT).show();
                    FirebaseCrashlytics.getInstance().recordException(t);
                }
            },
            ContextCompat.getMainExecutor(getContext())
        );
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        if (getString(R.string.preference_key_news_notifications).equals(key)) {
            if (sharedPreferences.getBoolean(key, true)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    UserSettingFragmentPermissionsDispatcher.activateNewsNotificationsWithPermissionCheck(this);
                } else {
                    activateNewsNotifications();
                }
            } else {
                FirebaseMessaging.getInstance().unsubscribeFromTopic(DefaultFirebaseMessagingService.TOPIC_AKTUELLES);
            }
            Log.d("Firebase", (sharedPreferences.getBoolean(key, true)
                ? "Subscribed" : "Unsubscribed") + " to topic Aktuelles");
        }
        if (getString(R.string.preference_key_hide_empty_pages).equals(key)) {
            Intent returnIntent = new Intent();
            getActivity().setResult(Activity.RESULT_OK, returnIntent);
        }
        if (getString(R.string.preference_key_theme).equals(key)) {
            //final int mode = Integer.valueOf(sharedPreferences.getString(s, String.valueOf(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)));

            new MaterialDialog.Builder(getContext())
                .title(R.string.app_neustarten)
                .content(R.string.app_neustarten_beschreibung)
                .positiveText(R.string.app_neustarten_positiv)
                .negativeText(R.string.app_neustarten_negativ)
                .onPositive((dialog, which) -> doRestart(getContext()))
                .show();
        }
        if (getString(R.string.preference_key_update_ticket).equals(key)) {
            prefUpdateTicket.setChecked(sharedPreferences.getBoolean(key, getResources().getBoolean(R.bool.preference_default_update_ticket)));
            FirebaseMessaging.getInstance().subscribeToTopic(DefaultFirebaseMessagingService.TOPIC_TICKET);
        }
    }

    @NeedsPermission(Manifest.permission.POST_NOTIFICATIONS)
    protected void activateNewsNotifications() {
        FirebaseMessaging.getInstance().subscribeToTopic(DefaultFirebaseMessagingService.TOPIC_AKTUELLES);
    }

    @OnPermissionDenied(Manifest.permission.POST_NOTIFICATIONS)
    protected void onNotificationPermissionDenied() {
        prefNewsNotifications.setChecked(false);
    }

    @OnNeverAskAgain(Manifest.permission.POST_NOTIFICATIONS)
    protected void onNotificationPermissionNeverAskAgain() {
        onNotificationPermissionDenied();
        new MaterialDialog.Builder(getContext())
            .title(R.string.permission_not_granted)
            .content(R.string.permission_never_ask_again_content)
            .positiveText(R.string.go_to_settings)
            .onPositive((dialog, which) -> {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
                intent.setData(uri);
                startActivity(intent);
            })
            .negativeText(R.string.abbrechen)
            .show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        // Unregister the listener whenever a key changes
        getPreferenceScreen().getSharedPreferences()
            .unregisterOnSharedPreferenceChangeListener(this);
    }

    public void selectFile() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/pdf");

        startActivityForResult(intent, REQUEST_CODE_SELECTTICKET);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent resultData) {
        if (resultCode == Activity.RESULT_OK) {
            if (requestCode == REQUEST_CODE_SELECTTICKET) {
                if (resultData != null) {
                    Uri uri = resultData.getData();
                    copyTicket(uri);
                }
            } else if (requestCode == REQUEST_CODE_MENUSORT) {
                Intent returnIntent = new Intent();
                getActivity().setResult(Activity.RESULT_OK, returnIntent);
            } else {
                super.onActivityResult(requestCode, resultCode, resultData);
            }
        } else {
            super.onActivityResult(requestCode, resultCode, resultData);
        }
    }

    private void copyTicket(Uri uri) {
        MaterialDialog pd = new MaterialDialog.Builder(getContext())
            .content(getString(R.string.copying_ticket))
            .progress(true, 0)
            .cancelable(false)
            .show();

        new Thread(() -> {
            try {
                boolean success = TicketUtil.saveTicketAsFile(getContext(), uri);
                new Handler(Looper.getMainLooper()).post(() -> {
                    if (success) {
                        ticketAdded();
                    } else {
                        Toast.makeText(getContext(), R.string.ticket_konnte_nicht_kopiert_werden, Toast.LENGTH_LONG).show();
                    }
                    pd.dismiss();
                });
            } catch (IOException e) {
                new Handler(Looper.getMainLooper()).post(() -> {
                    FirebaseCrashlytics.getInstance().recordException(e);
                    Toast.makeText(getContext(), getContext().getString(R.string.ticket_konnte_nicht_kopiert_werden) + ": " + e.getMessage(), Toast.LENGTH_LONG).show();
                    pd.dismiss();
                });
            }
        }).start();
    }

    private void ticketAdded() {
        if (TicketUtil.ticketExists(getContext())) {
            launchShortCutActivity();
            Toast.makeText(getContext(), R.string.ticket_copied, Toast.LENGTH_LONG).show();
            askTicketNotificationPermissionRationale();
        }
        FirebaseMessaging.getInstance().subscribeToTopic(DefaultFirebaseMessagingService.TOPIC_TICKET);
    }

    private void launchShortCutActivity() {
        Intent i = new Intent(getActivity(), ShortCutActivity.class);
        startActivity(i);
    }

    private void askTicketNotificationPermissionRationale() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            new MaterialDialog.Builder(getContext())
                .title(R.string.permission_needed)
                .content(R.string.ticket_notification_prompt)
                .positiveText(R.string.ok)
                .onPositive((dialog, which) -> UserSettingFragmentPermissionsDispatcher.requestTicketNotificationPermissionWithPermissionCheck(this))
                .negativeText(R.string.abbrechen)
                .show();
        }
    }

    @NeedsPermission(Manifest.permission.POST_NOTIFICATIONS)
    protected void requestTicketNotificationPermission() {
        // This method exists only to request the permission.
        // Nothing needs to be done if the permission is granted.
    }

    public static void doRestart(Context c) {
        try {
            PackageManager pm = c.getPackageManager();
            Intent mStartActivity = pm.getLaunchIntentForPackage(c.getPackageName());
            mStartActivity.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int mPendingIntentId = 223344;
            int intentFlags = PendingIntent.FLAG_CANCEL_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                intentFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent mPendingIntent = PendingIntent
                .getActivity(c, mPendingIntentId, mStartActivity, intentFlags);
            AlarmManager mgr = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            mgr.set(AlarmManager.RTC, System.currentTimeMillis() + 100, mPendingIntent);
            System.exit(0);
        } catch (Exception ex) {
            FirebaseCrashlytics.getInstance().recordException(ex);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        UserSettingFragmentPermissionsDispatcher.onRequestPermissionsResult(this, requestCode, grantResults);
    }
}
