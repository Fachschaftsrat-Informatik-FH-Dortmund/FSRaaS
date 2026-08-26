package de.fsrfb4.fb4.activities;
import de.fsrfb4.fb4.service.CanteenService;

import com.afollestad.materialdialogs.MaterialDialog;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.mobeta.android.dslv.DragSortController;
import com.mobeta.android.dslv.DragSortListView;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.preference.PreferenceManager;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.ArrayAdapter;

import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.DslvBinding;
import de.fsrfb4.fb4.model.Canteen;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class MenuSortActivity extends AppCompatActivity {
    public static final String CANTEEN_SORTING = "canteen_sorting";
    
    private DslvBinding binding;

    private ArrayAdapter<Canteen> adapter;
    boolean changed;

    @Inject
    CanteenService canteenService;

    private DragSortListView.DropListener onDrop = new DragSortListView.DropListener() {
        @Override
        public void drop(int from, int to) {
            changed = true;
            if (from != to) {
                Canteen item = adapter.getItem(from);
                adapter.remove(item);
                adapter.insert(item, to);
            }
        }
    };
    private Collection<Canteen> canteens;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = DslvBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setSupportActionBar(binding.toolbarLayout.toolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        getSupportActionBar().setHomeButtonEnabled(true);
        getSupportActionBar().setIcon(android.R.color.transparent);

        ViewCompat.setOnApplyWindowInsetsListener(binding.toolbarLayout.getRoot(), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), systemBars.top, v.getPaddingRight(), v.getPaddingBottom());
            return insets;
        });

        canteens = canteenService.getCanteens().values();

        ArrayList<Canteen> list = getSortedCanteenList();

        adapter = new ArrayAdapter<>(this,
            R.layout.list_item_handle_left, R.id.text, list);
        binding.listview.setAdapter(adapter);
        binding.listview.setDropListener(onDrop);
        binding.listview.setMaxScrollSpeed((float) 1.5);
        DragSortController controller = new DragSortController(binding.listview);
        controller.setDragHandleId(R.id.drag_handle);
        //controller.setClickRemoveId(R.id.);
        controller.setRemoveEnabled(false);
        controller.setSortEnabled(true);
        controller.setDragInitMode(1);
        controller.setBackgroundColor(getResources().getColor(R.color.main));
        //controller.setRemoveMode(removeMode);

        binding.listview.setFloatViewManager(controller);
        binding.listview.setOnTouchListener(controller);
        binding.listview.setDragEnabled(true);
    }

    private ArrayList<Canteen> getSortedCanteenList() {
        List<Canteen> canteenList = new ArrayList<>(canteens);
        Collections.sort(canteenList);
        ArrayList<Canteen> list = new ArrayList<>();
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(this);

        String json = appSharedPrefs.getString(MenuSortActivity.CANTEEN_SORTING, "");
        if (json.isEmpty()) {
            for (Canteen canteen : canteenList) {
                list.add(canteen);
            }
        } else {
            Gson gson = new Gson();
            Map<String, Integer> sorting = gson.fromJson(json, new TypeToken<Map<String, Integer>>() { }.getType());
            Canteen[] canteenArray = new Canteen[canteenList.size()];
            for (Canteen canteen : canteenList) {
                Integer pos = sorting.get(canteen.getId());
                if (pos != null && pos < canteenArray.length) {
                    canteenArray[pos] = canteen;
                } else {
                    list.add(canteen);
                }
            }

            int pos = list.size();
            for (Canteen canteen : canteenArray) {
                if (canteen != null) {
                    list.add(list.size() - pos, canteen);
                }
            }
        }

        return list;
    }
    
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.sort, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.speichern:
                save();
                break;
            case android.R.id.home:
                onBackPressed();
                break;
        }
        return false;
    }

    @Override
    public void onBackPressed() {
        if (changed) {
            new MaterialDialog.Builder(this)
                .title(R.string.speichern_Frage)
                .content(R.string.speichernSpeiseplanSort_Frage_Lang)
                .positiveText(R.string.ja)
                .negativeText(R.string.nein)
                .neutralText(R.string.abbrechen)
                .callback(new MaterialDialog.ButtonCallback() {
                    @Override
                    public void onPositive(MaterialDialog dialog) {
                        save();
                        MenuSortActivity.super.onBackPressed();
                    }

                    @Override
                    public void onNegative(MaterialDialog dialog) {
                        MenuSortActivity.super.onBackPressed();
                    }
                })
                .show();
        } else {
            MenuSortActivity.super.onBackPressed();
        }

    }

    public void save() {
        Map<String, Integer> sorting = new HashMap<>();

        for (int i = 0; i < adapter.getCount(); i++) {
            sorting.put(adapter.getItem(i).getId(), i);
        }

        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(this);
        SharedPreferences.Editor editor = appSharedPrefs.edit();

        editor.putString(CANTEEN_SORTING, new Gson().toJson(sorting));
        editor.commit();

        Intent returnIntent = new Intent();
        setResult(RESULT_OK, returnIntent);
        finish();
    }
}
