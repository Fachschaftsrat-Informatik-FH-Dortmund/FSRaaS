package de.fsrfb4.fb4.fragments.ticket;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;
import androidx.preference.PreferenceManager;

import com.afollestad.materialdialogs.MaterialDialog;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.ticket.TicketDownloadActivity;
import de.fsrfb4.fb4.databinding.FragmentLoginBinding;
import de.fsrfb4.fb4.util.UserCredentialsHelper;
import permissions.dispatcher.NeedsPermission;
import permissions.dispatcher.OnNeverAskAgain;
import permissions.dispatcher.OnPermissionDenied;
import permissions.dispatcher.RuntimePermissions;

@RuntimePermissions
@AndroidEntryPoint
public class LoginFragment extends Fragment {
    
    private FragmentLoginBinding binding;

    private LoginFragmentArgs args;
    private boolean isCredentialsSetFromArgs;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentLoginBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        TextWatcher textWatcher = new TextWatcher() {
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (binding.inputName.getText().toString().isEmpty() || binding.inputPassword.getText().toString().isEmpty()) {
                    binding.btnLogin.setEnabled(false);
                } else {
                    binding.btnLogin.setEnabled(true);
                }
            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) { }

            @Override
            public void afterTextChanged(Editable s) { }
        };

        binding.inputName.addTextChangedListener(textWatcher);
        binding.inputPassword.addTextChangedListener(textWatcher);

        args = LoginFragmentArgs.fromBundle(getArguments());

        if (args.getOnlyLogin()) {
            binding.btnChooseTicket.setVisibility(View.GONE);
            binding.partingLine.setVisibility(View.GONE);
            binding.checkBoxSaveCredentials.setChecked(true);
            binding.checkBoxAutomaticUpdate.setEnabled(true);
            binding.checkBoxAutomaticUpdate.setChecked(true);
        }

        if (args.getUsername() != null && args.getPassword() != null) {
            binding.inputName.setText(args.getUsername());
            binding.inputPassword.setText(args.getPassword());
            binding.checkBoxSaveCredentials.setChecked(args.getSaveCredentials());
            binding.checkBoxAutomaticUpdate.setChecked(args.getAutomaticUpdate());
            binding.checkBoxAutomaticUpdate.setEnabled(args.getSaveCredentials());
            isCredentialsSetFromArgs = true;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            binding.checkBoxSaveCredentials.setVisibility(View.GONE);
            binding.checkBoxAutomaticUpdate.setVisibility(View.GONE);
        } else {
            if (!isCredentialsSetFromArgs && !args.getLogout()) {
                fillCredentials();
            }
        }

        binding.checkBoxSaveCredentials.setOnCheckedChangeListener((buttonView, isChecked) -> {
            binding.checkBoxAutomaticUpdate.setEnabled(isChecked);
            if (!isChecked) {
                binding.checkBoxAutomaticUpdate.setChecked(false);
            }
        });

        binding.btnLogin.setOnClickListener(v -> login());
        binding.btnChooseTicket.setOnClickListener(v -> ((TicketDownloadActivity) getActivity()).selectFile());
    }

    private void login() {
        InputMethodManager imm = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(binding.inputName.getWindowToken(), 0);
        imm.hideSoftInputFromWindow(binding.inputPassword.getWindowToken(), 0);


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            binding.checkBoxAutomaticUpdate.isChecked() &&
            !isCredentialsSetFromArgs &&
            ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            new MaterialDialog.Builder(getContext())
                .title(R.string.permission_needed)
                .content(R.string.ticket_notification_prompt)
                .positiveText(R.string.ok)
                .onPositive((dialog, which) -> LoginFragmentPermissionsDispatcher.requestNotificationPermissionWithPermissionCheck(this))
                .negativeText(R.string.abbrechen)
                .onNegative((dialog, which) -> goToLoadingFragment())
                .show();
        } else {
            goToLoadingFragment();
        }
    }

    private void goToLoadingFragment() {
        LoginFragmentDirections.ActionLoginToLoadingScreen action =
            LoginFragmentDirections.actionLoginToLoadingScreen(binding.inputName.getText().toString(),
                binding.inputPassword.getText().toString(), binding.checkBoxSaveCredentials.isChecked(), binding.checkBoxAutomaticUpdate.isChecked(), args.getOnlyLogin());
        NavHostFragment.findNavController(LoginFragment.this).navigate(action);
    }

    @NeedsPermission(Manifest.permission.POST_NOTIFICATIONS)
    @OnPermissionDenied(Manifest.permission.POST_NOTIFICATIONS)
    @OnNeverAskAgain(Manifest.permission.POST_NOTIFICATIONS)
    protected void requestNotificationPermission() {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(getContext(), R.string.permission_not_granted, Toast.LENGTH_SHORT).show();
        }

        goToLoadingFragment();
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void fillCredentials() {
        try {
            UserCredentialsHelper.UserCredentials odsCredentials = UserCredentialsHelper.getOdsCredentials(getContext());
            if (odsCredentials != null) {
                SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getContext());
                LoginFragmentDirections.ActionLoginToLoadingScreen action =
                    LoginFragmentDirections.actionLoginToLoadingScreen(odsCredentials.username, odsCredentials.password, true,
                        sharedPreferences.getBoolean(getString(R.string.preference_key_update_ticket), getResources().getBoolean(R.bool.preference_default_update_ticket)), args.getOnlyLogin());
                NavHostFragment.findNavController(LoginFragment.this)
                    .navigate(action);
            }
        } catch (Exception e) {
            Log.e("ticket", "credentials", e);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        LoginFragmentPermissionsDispatcher.onRequestPermissionsResult(this, requestCode, grantResults);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
