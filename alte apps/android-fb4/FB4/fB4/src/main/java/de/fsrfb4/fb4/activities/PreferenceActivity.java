package de.fsrfb4.fb4.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.PreferenceFragmentBinding;
import de.fsrfb4.fb4.fragments.LinksDownloadsFragment;
import de.fsrfb4.fb4.fragments.UserSettingFragment;

@AndroidEntryPoint
public class PreferenceActivity extends AppCompatActivity {
    public static String INTENT_EXTRA_FRAGMENT = "fragment";
    public static String FRAGMENT_SETTINGS = "settings";
    public static String FRAGMENT_LINKSDOWNLOADS = "linksdownloads";

    Fragment f;

    private PreferenceFragmentBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = PreferenceFragmentBinding.inflate(getLayoutInflater());
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

        String title;
        if (getIntent().getStringExtra(INTENT_EXTRA_FRAGMENT).equals(FRAGMENT_SETTINGS)) {
            title = getString(R.string.NavItem_Einstellungen);
            f = new UserSettingFragment();
        } else {
            title = getString(R.string.NavItem_Links_Downloads);
            f = new LinksDownloadsFragment();
        }

        getSupportActionBar().setTitle(title);
        getSupportFragmentManager().beginTransaction().replace(R.id.content, f).commit();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == 1) {
            if (resultCode == RESULT_OK) {
                Intent returnIntent = new Intent();
                setResult(RESULT_OK, returnIntent);
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                onBackPressed();
                break;
            default:
                return super.onOptionsItemSelected(item);
        }
        return true;
    }
}
