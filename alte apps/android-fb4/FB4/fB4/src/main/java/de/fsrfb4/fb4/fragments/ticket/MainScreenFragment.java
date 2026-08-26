package de.fsrfb4.fb4.fragments.ticket;

import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;
import androidx.preference.PreferenceManager;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.FragmentMainScreenBinding;
import de.fsrfb4.fb4.model.TicketModel;
import de.fsrfb4.fb4.model.TicketPageModel;
import de.fsrfb4.fb4.retrofit.HisApi;
import de.fsrfb4.fb4.service.DataService;
import de.fsrfb4.fb4.util.EmptyCallback;
import de.fsrfb4.fb4.util.UserCredentialsHelper;

@AndroidEntryPoint
public class MainScreenFragment extends Fragment {
    
    @Inject
    public HisApi hisService;

    @Inject
    public DataService dataService;

    private FragmentMainScreenBinding binding;

    private MainScreenFragmentArgs args;
    private TicketPageModel ticketPageModel;
    private TicketModel secondButtonSemester;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentMainScreenBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        binding.btnLogout.setOnClickListener(v -> {
            deleteCredentials();
            logout();
        });
        binding.btnDownloadTicket.setOnClickListener(v -> downloadTicketClickedHandler(ticketPageModel.getCurrentSemester().getDownloadParameter()));
        binding.btnDownloadPreviousTicket.setOnClickListener(v -> downloadTicketClickedHandler(secondButtonSemester.getDownloadParameter()));

        args = MainScreenFragmentArgs.fromBundle(getArguments());
        ticketPageModel = args.getTicketPageModel();

        binding.textViewLoggedIn.setText(getString(R.string.logged_in_as, ticketPageModel.getDisplayName()));

        initDownloadButtons();
    }

    private void initDownloadButtons() {
        String mainButtonText = getString(R.string.download_for_semester, ticketPageModel.getCurrentSemester().getDisplayName());
        binding.textViewDownloadMain.setText(mainButtonText);

        secondButtonSemester = ticketPageModel.getLastSemester() != null ? ticketPageModel.getLastSemester() : ticketPageModel.getNextSemester();
        String secondButtonText = "";
        if (secondButtonSemester != null) {
            secondButtonText = getString(R.string.download_for_semester, secondButtonSemester.getDisplayName());
        }

        if (secondButtonSemester != null) {
            binding.btnDownloadPreviousTicket.setText(secondButtonText);

            try {
                LocalDate nextSsStart = dataService.getNextSsStart();
                LocalDate nextWsStart = dataService.getNextWsStart();

                boolean isSsCurrent = nextWsStart.isBefore(nextSsStart);
                boolean isSecondButtonNextSemester = secondButtonSemester == ticketPageModel.getNextSemester();

                if (isSecondButtonNextSemester) {
                    long days = ChronoUnit.DAYS.between(LocalDate.now(), isSsCurrent ? nextWsStart : nextSsStart);
                    binding.textViewValidFor.setText(days == 1 ? getString(R.string.valid_in_singular) : getString(R.string.valid_in_plural, days));
                    binding.textViewValidFor.setVisibility(View.VISIBLE);
                }
            } catch (Exception e) {
                FirebaseCrashlytics.getInstance().recordException(e);
            }
        } else {
            binding.btnDownloadPreviousTicket.setVisibility(View.GONE);
        }
}

    private void logout() {
        hisService.logout().enqueue(new EmptyCallback<>());
        ticketPageModel = null;
        MainScreenFragmentDirections.ActionMainScreenToLogin action = MainScreenFragmentDirections.actionMainScreenToLogin(false);
        action.setLogout(true);
        NavHostFragment.findNavController(MainScreenFragment.this)
            .navigate(action);
    }

    private void deleteCredentials() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            UserCredentialsHelper.deleteCredentials(getContext());

            SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getContext());
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putBoolean(getString(R.string.preference_key_update_ticket), false);
            editor.apply();
        }
    }

    private void downloadTicketClickedHandler(String ticketParameter) {
        MainScreenFragmentDirections.ActionMainScreenToDownloadTicket action =
            MainScreenFragmentDirections.actionMainScreenToDownloadTicket(ticketPageModel.getAuthenticityToken(), ticketParameter, args.getUsername(), args.getPassword());
        NavHostFragment.findNavController(MainScreenFragment.this)
            .navigate(action);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
