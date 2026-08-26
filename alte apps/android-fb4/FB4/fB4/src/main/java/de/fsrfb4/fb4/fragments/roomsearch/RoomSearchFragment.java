package de.fsrfb4.fb4.fragments.roomsearch;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.afollestad.materialdialogs.MaterialDialog;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.MainActivity;
import de.fsrfb4.fb4.adapter.RoomSearchAdapter;
import de.fsrfb4.fb4.databinding.RoomsearchBinding;
import de.fsrfb4.fb4.model.Room;
import de.fsrfb4.fb4.retrofit.TimetableApi;
import de.fsrfb4.fb4.service.RoomService;
import de.fsrfb4.fb4.util.Callback;
import de.fsrfb4.fb4.view.SimpleDividerItemDecoration;

@AndroidEntryPoint
public class RoomSearchFragment extends Fragment {
    private static final String SIS_KEY_ROOMS = "rooms";

    private RoomsearchBinding binding;
    private MaterialDialog pd;

    @Inject
    public TimetableApi timetableApi;

    @Inject
    public RoomService roomService;

    List<Room> freeRooms;

    public RoomSearchFragment() {
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = RoomsearchBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        ViewCompat.setOnApplyWindowInsetsListener(binding.recyclerRooms, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
            return insets;
        });
        binding.recyclerRooms.setClipToPadding(false);

        setHasOptionsMenu(true);

        ((MainActivity) getActivity()).getAppBarLayout().setElevation(getResources().getDimension(R.dimen.elevation));

        binding.swipeRefreshLayout.setOnRefreshListener(() -> loadFreeRooms());
        binding.swipeRefreshLayout.setColorSchemeResources(R.color.swipetorefresh_blue,
            R.color.swipetorefresh_green,
            R.color.swipetorefresh_yellow,
            R.color.swipetorefresh_red);
        binding.swipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.swiperefresh_progress_background);

        if (savedInstanceState == null) {
            loadFreeRooms();
        } else {
            freeRooms = (ArrayList<Room>) savedInstanceState.getSerializable(SIS_KEY_ROOMS);
            prepareListData();
        }
    }

    @Override
    public void onSaveInstanceState(Bundle savedInstanceState) {
        super.onSaveInstanceState(savedInstanceState);

        try {
            savedInstanceState.putSerializable(SIS_KEY_ROOMS, (Serializable) freeRooms);
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().log("RoomSearchFragment.onSaveInstanceState");
            FirebaseCrashlytics.getInstance().recordException(e);
        }
    }

    public void loadFreeRooms() {
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusMinutes(45);

        if (to.isAfter(to.withHour(21).withMinute(30)) || to.isBefore(to.withHour(7).withMinute(30))) {
            this.freeRooms = new ArrayList<>();
            prepareListData();
            binding.swipeRefreshLayout.setRefreshing(false);
            return;
        }

        MainActivity.lockOrientation(getActivity());

        pd = new MaterialDialog.Builder(getActivity())
            .content(getString(R.string.Räume_werden_gesucht))
            .progress(true, 0)
            .cancelable(false)
            .show();

        roomService.getFreeRooms(from, to).enqueue(new Callback<>() {
            @Override
            public void onSuccess(List<Room> rooms) {
                RoomSearchFragment.this.freeRooms = rooms;
                prepareListData();

                if (pd != null) {
                    pd.dismiss();
                }
                binding.swipeRefreshLayout.setRefreshing(false);
                MainActivity.unlockOrientation(getActivity());
            }

            @Override
            public void onFailure(Throwable t) {
                Toast.makeText(getActivity(), getActivity().getString(R.string.fehlerBeimLaden_Räume), Toast.LENGTH_LONG).show();
                var message = t.getMessage();
                Log.e("RoomSearchFragment", "postData", t);
                FirebaseCrashlytics.getInstance().recordException(t);

                if (pd != null) {
                    pd.dismiss();
                }
                binding.swipeRefreshLayout.setRefreshing(false);
                MainActivity.unlockOrientation(getActivity());
            }
        });
    }

    public void prepareListData() {
        if (freeRooms == null) {
            return;
        }

        if (freeRooms.isEmpty()) {
            Toast.makeText(getActivity(), getString(R.string.Keine_freien_räume), Toast.LENGTH_LONG).show();
            return;
        }

        RoomSearchAdapter adapter = new RoomSearchAdapter(getActivity(), freeRooms);
        binding.recyclerRooms.setLayoutManager(new LinearLayoutManager(getActivity()));
        binding.recyclerRooms.addItemDecoration(new SimpleDividerItemDecoration(getActivity()));
        binding.recyclerRooms.setAdapter(adapter);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
