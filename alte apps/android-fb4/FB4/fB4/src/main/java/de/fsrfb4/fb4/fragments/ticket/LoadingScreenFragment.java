package de.fsrfb4.fb4.fragments.ticket;

import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.fragment.app.Fragment;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;
import androidx.preference.PreferenceManager;

import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.firebase.messaging.FirebaseMessaging;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.FragmentLoadingScreenBinding;
import de.fsrfb4.fb4.firebase.DefaultFirebaseMessagingService;
import de.fsrfb4.fb4.model.TicketPageModel;
import de.fsrfb4.fb4.retrofit.HisApi;
import de.fsrfb4.fb4.util.HisUtil;
import de.fsrfb4.fb4.util.UserCredentialsHelper;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;


@AndroidEntryPoint
public class LoadingScreenFragment extends Fragment {
    @Inject
    public HisApi hisService;

    private FragmentLoadingScreenBinding binding;
    private boolean cancelled;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentLoadingScreenBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        LoadingScreenFragmentArgs args = LoadingScreenFragmentArgs.fromBundle(getArguments());
        login(args.getUsername(), args.getPassword(), args.getSaveCredentials(), args.getAutomaticUpdate());

        binding.buttonCancel.setOnClickListener(v -> {
            cancelled = true;
            backToLogin();
        });
        binding.buttonCancel.postDelayed(() -> {
            if (isVisible()) {
                binding.buttonCancel.setVisibility(View.VISIBLE);
                binding.buttonCancel.setAlpha(0.0f);
                binding.buttonCancel.animate()
                    .alpha(1.0f);
            }
        }, 6000);
    }

    private void login(String username, String password, boolean saveCredentials, boolean automaticUpdate) {
        Call<String> login = hisService.login(username, password);
        login.enqueue(new Callback<String>() {
            @Override
            public void onResponse(Call<String> call, Response<String> response) {
                if (!cancelled && getContext() != null) {
                    response = HisUtil.convertLoginResponse(response);
                    if (response.isSuccessful()) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            if (saveCredentials) {
                                saveCredentials(username, password);

                                SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getContext());
                                SharedPreferences.Editor editor = sharedPreferences.edit();
                                editor.putBoolean(getString(R.string.preference_key_update_ticket), automaticUpdate);
                                editor.apply();

                                FirebaseMessaging.getInstance().subscribeToTopic(DefaultFirebaseMessagingService.TOPIC_TICKET);
                            } else {
                                UserCredentialsHelper.deleteCredentials(getContext());
                            }
                        }

                        LoadingScreenFragmentArgs args = LoadingScreenFragmentArgs.fromBundle(getArguments());
                        if (args.getOnlyLogin()) {
                            getActivity().finish();
                        } else {
                            loadTicketPage(username, password);
                        }
                    } else {
                        Toast.makeText(getContext(), R.string.login_fehlgeschlagen, Toast.LENGTH_LONG).show();
                        backToLogin();
                    }
                }
            }

            @Override
            public void onFailure(Call<String> call, Throwable t) {
                if (!cancelled && getContext() != null) {
                    Toast.makeText(getContext(), R.string.internetFehlgeschlagen, Toast.LENGTH_LONG).show();
                    backToLogin();
                }
            }
        });
    }

    private void loadTicketPage(String username, String password) {
        Call<String> nrwTicketPage = hisService.getNrwTicketPage();
        nrwTicketPage.enqueue(new Callback<String>() {
            @Override
            public void onResponse(Call<String> call, Response<String> response) {
                if (!cancelled && getContext() != null) {
                    Response<TicketPageModel> convertedResponse = HisUtil.convertTicketPageResponse(response, username);
                    if (convertedResponse.isSuccessful()) {
                        LoadingScreenFragmentDirections.ActionLoadingScreenToMainScreen action =
                            LoadingScreenFragmentDirections.actionLoadingScreenToMainScreen(convertedResponse.body(), username, password);
                        NavController navController = NavHostFragment.findNavController(LoadingScreenFragment.this);
                        if (navController.getCurrentDestination().getId() == R.id.LoadingScreenFragment) {
                            navController.navigate(action);
                        }
                    } else {
                        Toast.makeText(getContext(), R.string.login_failed_try_later, Toast.LENGTH_LONG).show();
                        backToLogin();
                    }
                }
            }

            @Override
            public void onFailure(Call<String> call, Throwable t) {
                if (!cancelled && getContext() != null) {
                    Toast.makeText(getContext(), R.string.internetFehlgeschlagen, Toast.LENGTH_LONG).show();
                    backToLogin();
                }
            }
        });
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void saveCredentials(String username, String password) {
        try {
            UserCredentialsHelper.storeOdsCredentials(getContext(), username, password);
        } catch (Exception e) {
            Toast.makeText(getContext(), R.string.credentials_not_saved, Toast.LENGTH_LONG).show();
            FirebaseCrashlytics.getInstance().recordException(e);
        }
    }

    private void backToLogin() {
        LoadingScreenFragmentArgs loadingScreenFragmentArgs = LoadingScreenFragmentArgs.fromBundle(getArguments());
        LoadingScreenFragmentDirections.ActionLoadingScreenToLogin action = LoadingScreenFragmentDirections.actionLoadingScreenToLogin(loadingScreenFragmentArgs.getOnlyLogin());
        action.setUsername(loadingScreenFragmentArgs.getUsername());
        action.setPassword(loadingScreenFragmentArgs.getPassword());
        action.setSaveCredentials(loadingScreenFragmentArgs.getSaveCredentials());
        action.setAutomaticUpdate(loadingScreenFragmentArgs.getAutomaticUpdate());
        NavHostFragment.findNavController(LoadingScreenFragment.this)
            .navigate(action);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
