package de.fsrfb4.fb4.fragments.ticket;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import androidx.fragment.app.Fragment;

import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.io.IOException;
import java.util.Map;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.ticket.ShortCutActivity;
import de.fsrfb4.fb4.activities.ticket.TicketViewActivity;
import de.fsrfb4.fb4.databinding.FragmentDownloadTicketBinding;
import de.fsrfb4.fb4.model.TicketPageModel;
import de.fsrfb4.fb4.retrofit.HisApi;
import de.fsrfb4.fb4.util.EmptyCallback;
import de.fsrfb4.fb4.util.FirebaseAnalyticsEvents;
import de.fsrfb4.fb4.util.HisUtil;
import de.fsrfb4.fb4.util.TicketUtil;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@AndroidEntryPoint
public class DownloadTicketFragment extends Fragment {
    private static String SIS_KEY_SUCCESS = "success";
    private static String SIS_KEY_STATETEXT = "state_text";

    @Inject
    public HisApi hisService;

    private FragmentDownloadTicketBinding binding;

    private String authenticityToken;
    private String ticketParameter;
    private Boolean success;
    private FirebaseAnalytics mFirebaseAnalytics;
    private boolean authenticationError;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentDownloadTicketBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        mFirebaseAnalytics = FirebaseAnalytics.getInstance(getContext());

        DownloadTicketFragmentArgs args = DownloadTicketFragmentArgs.fromBundle(getArguments());
        authenticityToken = args.getAuthenticityToken();
        ticketParameter = args.getTicketParameter();

        binding.buttonShowTicket.setOnClickListener(v -> {
            Intent i = new Intent(getContext(), TicketViewActivity.class);
            startActivity(i);
            getActivity().finish();
        });

        binding.buttonRetry.setOnClickListener(v -> {
            success = null;
            binding.buttonRetry.setVisibility(View.GONE);
            binding.resultView.setVisibility(View.GONE);
            binding.progressBar.setScaleX(1f);
            binding.progressBar.setScaleY(1f);
            binding.progressBar.setVisibility(View.VISIBLE);
            binding.textViewState.setText(R.string.ticket_wird_heruntergeladen);
            if (authenticationError) {
                login(args.getUsername(), args.getPassword());
            } else {
                downloadTicket();
            }
        });

        if (savedInstanceState == null || !savedInstanceState.containsKey(SIS_KEY_SUCCESS)) {
            downloadTicket();
        } else {
            success = savedInstanceState.getBoolean(SIS_KEY_SUCCESS);
            binding.textViewState.setText(savedInstanceState.getString(SIS_KEY_STATETEXT));
            binding.progressBar.setVisibility(View.GONE);
            binding.resultView.setVisibility(View.VISIBLE);
            if (success) {
                binding.resultView.setBackgroundResource(R.drawable.download_success);
                binding.buttonShowTicket.setVisibility(View.VISIBLE);
            } else {
                binding.resultView.setBackgroundResource(R.drawable.download_failed);
                binding.buttonRetry.setVisibility(View.VISIBLE);
            }
        }
    }

    private void downloadTicket() {
        mFirebaseAnalytics.logEvent(FirebaseAnalyticsEvents.TICKET_DOWNLOAD_STARTED, null);
        Map<String, String> fieldMap = HisUtil.getFieldMapForTicketDownload(authenticityToken, ticketParameter);
        Call<ResponseBody> call = hisService.downloadTicket(fieldMap);
        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (getContext() != null) {
                    if (response.isSuccessful()) {
                        new Thread(() -> {
                            try {
                                boolean success = TicketUtil.saveTicketAsFile(getContext(), response.body());
                                new Handler(Looper.getMainLooper()).post(() -> {
                                    if (getContext() != null) {
                                        if (success) {
                                            showResultView(true);
                                            binding.textViewState.setText(R.string.ticket_wurde_heruntergeladen);
                                            launchShortCutActivity();
                                            mFirebaseAnalytics.logEvent(FirebaseAnalyticsEvents.TICKET_DOWNLOAD_FINISHED, null);
                                        } else {
                                            showResultView(false);
                                            binding.textViewState.setText(R.string.ticket_not_downloaded);
                                            logDownloadFailedEvent(null);
                                        }
                                    }
                                });
                            } catch (IOException e) {
                                new Handler(Looper.getMainLooper()).post(() -> {
                                    if (getContext() != null) {
                                        showResultView(false);
                                        binding.textViewState.setText(getContext().getString(R.string.ticket_not_downloaded));
                                    }
                                });
                                authenticationError = false;
                                FirebaseCrashlytics.getInstance().recordException(e);
                                logDownloadFailedEvent(e);
                                Log.e("TicketUtil", "saveTicketAsFile", e);
                            }
                        }).start();
                    } else {
                        authenticationError = response.code() == 403;
                        showResultView(false);
                        binding.textViewState.setText(R.string.ticket_not_downloaded);
                        logDownloadFailedEvent(null);
                    }
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                if (getContext() != null) {
                    authenticationError = false;
                    showResultView(false);
                    binding.textViewState.setText(R.string.internetFehlgeschlagen);
                    logDownloadFailedEvent(t);
                }
            }
        });
    }

    private void showResultView(boolean success) {
        this.success = success;
        ViewCompat.animate(binding.progressBar)
            .scaleX(0f)
            .scaleY(0f)
            .setDuration(300)
            .withEndAction(() -> {
                binding.progressBar.setVisibility(View.GONE);
                binding.resultView.setVisibility(View.VISIBLE);
                binding.resultView.setBackgroundResource(success ? R.drawable.download_success : R.drawable.download_failed);
                Animation animation = new ScaleAnimation(0f, 1f, 0f, 1f, Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f);
                animation.setDuration(300);
                binding.resultView.startAnimation(animation);
                fadeInButton(success ? binding.buttonShowTicket : binding.buttonRetry);
            })
            .start();
    }

    private void fadeInButton(Button button) {
        button.setVisibility(View.VISIBLE);
        button.setAlpha(0.0f);
        button.animate()
            .alpha(1.0f);
    }

    private void launchShortCutActivity() {
        Intent i = new Intent(getContext(), ShortCutActivity.class);
        startActivity(i);
    }

    private void login(String username, String password) {
        Call<String> login = hisService.login(username, password);
        login.enqueue(new Callback<String>() {
            @Override
            public void onResponse(Call<String> call, Response<String> response) {
                if (getContext() != null) {
                    response = HisUtil.convertLoginResponse(response);
                    if (response.isSuccessful()) {
                        loadTicketPage(username);
                    } else {
                        showResultView(false);
                        binding.textViewState.setText(R.string.ticket_not_downloaded);
                        logDownloadFailedEvent(null);
                    }
                }
            }

            @Override
            public void onFailure(Call<String> call, Throwable t) {
                if (getContext() != null) {
                    showResultView(false);
                    binding.textViewState.setText(R.string.internetFehlgeschlagen);
                    logDownloadFailedEvent(t);
                }
            }
        });
    }

    private void loadTicketPage(String username) {
        Call<String> nrwTicketPage = hisService.getNrwTicketPage();
        nrwTicketPage.enqueue(new Callback<String>() {
            @Override
            public void onResponse(Call<String> call, Response<String> response) {
                if (getContext() != null) {
                    Response<TicketPageModel> convertedResponse = HisUtil.convertTicketPageResponse(response, username);
                    if (convertedResponse.isSuccessful()) {
                        authenticityToken = convertedResponse.body().getAuthenticityToken();
                        downloadTicket();
                    } else {
                        showResultView(false);
                        binding.textViewState.setText(R.string.ticket_not_downloaded);
                        logDownloadFailedEvent(null);
                    }
                }
            }

            @Override
            public void onFailure(Call<String> call, Throwable t) {
                if (getContext() != null) {
                    showResultView(false);
                    binding.textViewState.setText(R.string.internetFehlgeschlagen);
                    logDownloadFailedEvent(t);
                }
            }
        });
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);

        if (success != null) {
            outState.putBoolean(SIS_KEY_SUCCESS, success);
            outState.putString(SIS_KEY_STATETEXT, binding.textViewState.getText().toString());
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        hisService.logout().enqueue(new EmptyCallback<>());
        binding = null;
    }

    private void logDownloadFailedEvent(@Nullable Throwable t) {
        Bundle bundle = new Bundle();
        if (t != null) {
            bundle.putString(FirebaseAnalyticsEvents.Param.EXCEPTION, t.toString());
        }
        mFirebaseAnalytics.logEvent(FirebaseAnalyticsEvents.TICKET_DOWNLOAD_FAILED, bundle);
    }
}
