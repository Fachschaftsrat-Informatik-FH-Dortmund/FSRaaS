package de.fsrfb4.fb4.fragments.menu;

import android.app.Dialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.graphics.Color;
import android.os.AsyncTask;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatDialog;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentStatePagerAdapter;
import androidx.preference.PreferenceManager;

import com.afollestad.materialdialogs.MaterialDialog;
import com.google.android.material.snackbar.Snackbar;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.time.format.DateTimeFormatter;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.MainActivity;
import de.fsrfb4.fb4.activities.MenuSortActivity;
import de.fsrfb4.fb4.databinding.FragmentTimetableBinding;
import de.fsrfb4.fb4.fragments.MenuItemFragment;
import de.fsrfb4.fb4.model.Canteen;
import de.fsrfb4.fb4.model.MenuDay;
import de.fsrfb4.fb4.model.WeeklyMenu;
import de.fsrfb4.fb4.service.CanteenService;
import de.fsrfb4.fb4.service.MenuService;

@AndroidEntryPoint
public class MenuFragment extends Fragment implements MenuItemFragment {
    public static final String SIS_KEY_MENU = "menu";
    public static final String SIS_KEY_CANTEENS = "canteens";

    @Inject
    CanteenService canteenService;

    @Inject
    MenuService menuService;

    private FragmentTimetableBinding binding;
    private MaterialDialog pd;
    private SectionsPagerAdapter mSectionsPagerAdapter;

    private ArrayList<MenuDay> menuDays;
    private Map<String, Canteen> canteensToDisplay;
    private Menu optionsMenu;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentTimetableBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(View rootView, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(rootView, savedInstanceState);
        
        setHasOptionsMenu(true);

        binding.tabLayout.setElevation(getResources().getDimension(R.dimen.elevation));
        ((MainActivity) getActivity()).getAppBarLayout().setElevation(0);
        ((MainActivity) getActivity()).getAppBarLayout().setStateListAnimator(null);

        menuDays = new ArrayList<>();

        Map<String, Canteen> canteens = canteenService.getCanteens();

        prepareCanteensToDisplay(canteens);

        if (canteensToDisplay.isEmpty()) {
            Toast.makeText(getContext(), R.string.no_menu_selected, Toast.LENGTH_LONG).show();
            return;
        }

        if (savedInstanceState == null) {
            PostTask task = new PostTask();
            task.execute();
        } else {
            menuDays = (ArrayList<MenuDay>) savedInstanceState.getSerializable(SIS_KEY_MENU);
            canteensToDisplay = (HashMap<String, Canteen>) savedInstanceState.getSerializable(SIS_KEY_CANTEENS);
            mSectionsPagerAdapter = new SectionsPagerAdapter(getChildFragmentManager());
            binding.pager.setOffscreenPageLimit(5);
            binding.pager.setAdapter(mSectionsPagerAdapter);
            if (mSectionsPagerAdapter.getCount() > 0) {
                binding.pager.setCurrentItem(0);
            }
        }
    }

    private void prepareCanteensToDisplay(Map<String, Canteen> canteens) {
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(getContext());

        canteensToDisplay = new HashMap<>();

        for (Map.Entry<String, Canteen> canteen : canteens.entrySet()) {
            if (appSharedPrefs.getBoolean(canteen.getKey(), canteen.getValue().isEnabledDefault())) {
                canteensToDisplay.put(canteen.getKey(), canteen.getValue());
            }
        }
    }

    @Override
    public void onSaveInstanceState(Bundle savedInstanceState) {
        super.onSaveInstanceState(savedInstanceState);

        try {
            savedInstanceState.putSerializable(SIS_KEY_MENU, menuDays);
            savedInstanceState.putSerializable(SIS_KEY_CANTEENS, (HashMap) canteensToDisplay);
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().log("MenuFragment.onSaveInstanceState");
            FirebaseCrashlytics.getInstance().recordException(e);
        }
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, android.view.MenuInflater inflater) {
        inflater.inflate(R.menu.speiseplan, menu);
        this.optionsMenu = menu;
        super.onCreateOptionsMenu(menu, inflater);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.info:
                Dialog dialog = new AppCompatDialog(getActivity());
                dialog.setContentView(R.layout.menu_info);
                dialog.show();
                break;
            default:
                return super.onOptionsItemSelected(item);
        }
        return false;
    }

    @Override
    public void setMenuVisible(boolean visible) {
        if (optionsMenu != null) {
            optionsMenu.findItem(R.id.info).setVisible(visible);
        }
    }

    public void removeCanteen(final Canteen canteen) {
        final Map<String, Canteen> backupCanteens = new HashMap<>(canteensToDisplay);
        final int currentItem = binding.pager.getCurrentItem();
        canteensToDisplay.remove(canteen.getId());
        prepareMenuDays();
        update(-1);

        if (canteensToDisplay.isEmpty()) {
            Toast.makeText(getContext(), R.string.no_menu_selected, Toast.LENGTH_LONG).show();
        }

        Snackbar snackbar = Snackbar
            .make(getView(), getString(R.string.mensaWirdNichtMehrAngezeigt, canteen.getName()), Snackbar.LENGTH_LONG)
            .setDuration(4000)
            .setAction(R.string.rückgängig_caps, view -> {
                SharedPreferences appSharedPrefs = PreferenceManager
                    .getDefaultSharedPreferences(getActivity());

                Editor prefsEditor = appSharedPrefs.edit();
                prefsEditor.putBoolean(canteen.getId(), true);
                prefsEditor.commit();

                canteensToDisplay = backupCanteens;
                prepareMenuDays();
                update(currentItem);
            });
        View view = snackbar.getView();
        TextView tv = view.findViewById(com.google.android.material.R.id.snackbar_text);
        tv.setTextColor(Color.WHITE);
        snackbar.show();
    }

    public void update(int currentItem) {
        mSectionsPagerAdapter = new SectionsPagerAdapter(getChildFragmentManager());
        int current = currentItem == -1 ? binding.pager.getCurrentItem() : currentItem;
        binding.pager.setOffscreenPageLimit(5);
        binding.pager.setAdapter(mSectionsPagerAdapter);
        binding.pager.setCurrentItem(current);
    }

    public void setCurrentDay() {
        LocalDate today = LocalDate.now();

        for (int i = 0; i < menuDays.size(); i++) {
            if (!menuDays.get(i).getDate().isBefore(today)) {
                binding.pager.setCurrentItem(i);
                break;
            }
        }
    }

    private void prepareMenuDays() {
        menuDays.clear();
        Comparator<Canteen> canteenComparator = getCanteenComparator(getContext());
        List<Canteen> sortedCanteens = new ArrayList<>(canteensToDisplay.values());
        Iterator<Canteen> it = sortedCanteens.iterator();

        Set<LocalDate> allDates = new HashSet<>();

        while (it.hasNext()) {
            Canteen canteen = it.next();
            if (canteen.getWeeklyMenu() == null) {
                it.remove();
            } else {
                allDates.addAll(canteen.getWeeklyMenu().getDates());
            }
        }

        if (canteenComparator != null) {
            Collections.sort(sortedCanteens, canteenComparator);
        }

        List<LocalDate> sortedDates = new ArrayList<>(allDates);
        Collections.sort(sortedDates);

        for (LocalDate date : sortedDates) {
            MenuDay menuDay = new MenuDay(date, sortedCanteens);
            if (menuDay.getSize() > 0) {
                menuDays.add(menuDay);
            }
        }
    }

    public Comparator<Canteen> getCanteenComparator(Context context) {
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(context);
        String json = appSharedPrefs.getString(MenuSortActivity.CANTEEN_SORTING, "");
        if (json.isEmpty()) {
            return (canteen1, canteen2) -> canteen1.compareTo(canteen2);
        }

        Gson gson = new Gson();
        final Map<String, Integer> sorting = gson.fromJson(json, new TypeToken<Map<String, Integer>>() {
        }.getType());

        Comparator<Canteen> comparator = (canteen1, canteen2) -> {
            int orderCanteen1 = sorting.get(canteen1.getId()) != null ? sorting.get(canteen1.getId()) : 100 + canteen1.getDefaultOrder();
            int orderCanteen2 = sorting.get(canteen2.getId()) != null ? sorting.get(canteen2.getId()) : 100 + canteen2.getDefaultOrder();

            return orderCanteen1 - orderCanteen2;
        };
        return comparator;
    }

    private class PostTask extends AsyncTask<String, Integer, List<WeeklyMenu>> {

        @Override
        protected void onPreExecute() {
            super.onPreExecute();

            MainActivity.lockOrientation(getActivity());

            pd = new MaterialDialog.Builder(getActivity())
                .content(R.string.speisepläneWerdenGeladen)
                .progress(false, canteensToDisplay.size(), true)
                .cancelable(false)
                .show();
        }

        @Override
        protected List<WeeklyMenu> doInBackground(String... args) {
            List<WeeklyMenu> weeklyMenus = new ArrayList<>();
            for (Canteen canteen : canteensToDisplay.values()) {
                WeeklyMenu weeklyMenu = menuService.getWeeklyMenu(canteen);
                if (weeklyMenu != null) {
                    weeklyMenus.add(weeklyMenu);
                }
                publishProgress();
            }

            publishProgress();
            return weeklyMenus;
        }

        @Override
        protected void onProgressUpdate(Integer... values) {
            super.onProgressUpdate(values);
            pd.setProgress(pd.getCurrentProgress() + 1);
        }

        @Override
        protected void onPostExecute(List<WeeklyMenu> result) {
            super.onPostExecute(result);
            pd.setProgress(pd.getMaxProgress());

            for (WeeklyMenu weeklyMenu : result) {
                canteensToDisplay.get(weeklyMenu.getCanteenId()).setWeeklyMenu(weeklyMenu);
            }

            prepareMenuDays();

            if (menuDays.isEmpty() && !canteensToDisplay.isEmpty()) {
                Toast.makeText(getActivity(), getString(R.string.fehlerBeimLaden_Speiseplan), Toast.LENGTH_LONG).show();
            }

            if (pd != null) {
                try {
                    pd.dismiss();
                } catch (Exception e) {
                }
            }

            mSectionsPagerAdapter = new SectionsPagerAdapter(getChildFragmentManager());
            binding.pager.setOffscreenPageLimit(5);
            binding.pager.setAdapter(mSectionsPagerAdapter);
            if (mSectionsPagerAdapter.getCount() > 0) {
                setCurrentDay();
            }

            MainActivity.unlockOrientation(getActivity());
        }
    }

    public class SectionsPagerAdapter extends FragmentStatePagerAdapter {

        public SectionsPagerAdapter(FragmentManager fm) {
            super(fm);
        }

        @Override
        public Fragment getItem(int position) {
            // getItem is called to instantiate the fragment for the given page.
            // Return a AddEventsDayFragment (defined as a static inner class
            // below) with the page number as its lone argument.
            Fragment fragment = new MenuDayFragment();
            Bundle args = new Bundle();
            args.putInt(MenuDayFragment.ARG_SECTION_NUMBER, position);
            args.putSerializable(MenuDayFragment.ARG_MENU, menuDays.get(position));
            fragment.setArguments(args);
            return fragment;
        }

        @Override
        public int getCount() {
            return menuDays.size();
        }

        @Override
        public CharSequence getPageTitle(int position) {
            LocalDate date = menuDays.get(position).getDate();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("E., dd.MM", Locale.getDefault());
            return date.format(formatter);
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
