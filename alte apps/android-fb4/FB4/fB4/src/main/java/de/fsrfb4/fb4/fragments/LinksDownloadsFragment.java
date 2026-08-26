package de.fsrfb4.fb4.fragments;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.preference.Preference;
import androidx.preference.PreferenceCategory;
import androidx.preference.PreferenceFragmentCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.afollestad.materialdialogs.MaterialDialog;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.FB4;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.model.Link;
import de.fsrfb4.fb4.service.LinkService;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

@AndroidEntryPoint
public class LinksDownloadsFragment extends PreferenceFragmentCompat {

    @Inject
    public LinkService linkService;

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {

    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        addPreferencesFromResource(R.xml.linksdownloads);

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

        PreferenceCategory linkCategory = findPreference(getString(R.string.preference_key_category_links));
        List<Link> links = linkService.getLinks();
        String language = Locale.getDefault().getLanguage();
        for (Link link : links) {
            Preference pref = new Preference(getContext());
            pref.setKey(link.getKey());
            pref.setTitle(link.getTitle(language));
            pref.setSummary(link.getDescription(language));
            pref.setOnPreferenceClickListener(preference -> {
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setData(Uri.parse(link.getUrl()));
                startActivity(i);
                return false;
            });

            linkCategory.addPreference(pref);
        }

        if (linkCategory.getPreferenceCount() == 0) {
            linkCategory.setVisible(false);
        }

        PreferenceCategory downloadCategory = findPreference(getString(R.string.preference_key_category_downloads));
        List<Link> fileDownloads = linkService.getFileDownloads();
        for (Link link : fileDownloads) {
            Preference pref = new Preference(getContext());
            pref.setKey(link.getKey());
            pref.setTitle(link.getTitle(language));
            pref.setSummary(link.getDescription(language));
            pref.setOnPreferenceClickListener(preference -> {
                downloadPDF(link.getUrl(), pref.getTitle().toString());
                return false;
            });

            downloadCategory.addPreference(pref);
        }

        if (downloadCategory.getPreferenceCount() == 0) {
            downloadCategory.setVisible(false);
        }

        return view;
    }

    private void downloadPDF(String url, String name) {
        MaterialDialog pd = new MaterialDialog.Builder(getContext())
            .content(getString(R.string.downloadWirdGestartet))
            .progress(true, 0)
            .cancelable(false)
            .show();

        Request request = new Request.Builder()
            .get()
            .url(url)
            .build();

        OkHttpClient okHttpClient = ((FB4) getActivity().getApplication()).getOkHttpClientBuilder(getContext(), false)
            .readTimeout(30, TimeUnit.SECONDS).build();
        okHttpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onResponse(Call call, Response response) {
                try {
                    if (response.isSuccessful()) {
                        try {
                            File file = saveAsFile(getContext(), response.body().byteStream(), name);
                            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getApplicationContext().getPackageName() + ".provider", file);
                            Intent i = new Intent(Intent.ACTION_VIEW);
                            i.setDataAndType(uri, "application/pdf");
                            i.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            getContext().startActivity(i);
                        } catch (ActivityNotFoundException e) {
                            ContextCompat.getMainExecutor(getContext()).execute(()  -> Toast.makeText(getContext(), R.string.keinen_pdfreader_gefunden, Toast.LENGTH_LONG).show());
                        }
                    } else {
                        ContextCompat.getMainExecutor(getContext()).execute(()  -> Toast.makeText(getContext(), getString(R.string.error_downloading_file), Toast.LENGTH_SHORT).show());
                    }
                } catch (IOException e) {
                    ContextCompat.getMainExecutor(getContext()).execute(()  -> Toast.makeText(getContext(), getString(R.string.error_downloading_file), Toast.LENGTH_SHORT).show());
                    FirebaseCrashlytics.getInstance().recordException(e);
                }
                response.close();
                pd.dismiss();
            }

            @Override
            public void onFailure(Call call, IOException e) {
                pd.dismiss();
                ContextCompat.getMainExecutor(getContext()).execute(()  -> Toast.makeText(getContext(), getString(R.string.error_downloading_file), Toast.LENGTH_SHORT).show());
            }
        });
    }

    @SuppressWarnings("checkstyle:InnerAssignment")
    public static File saveAsFile(Context context, InputStream input, String name) throws IOException {
        File file = new File(context.getExternalCacheDir(), name + ".pdf");
        file.createNewFile();
        try (OutputStream output = new FileOutputStream(file)) {
            byte[] buffer = new byte[4096];
            int read;
            if ((read = input.read(buffer)) != -1 && isPdf(buffer)) {
                do {
                    output.write(buffer, 0, read);
                } while ((read = input.read(buffer)) != -1);
            } else {
                input.close();
                throw new IOException("Not a pdf file");
            }
            output.flush();
        }

        input.close();
        return file;
    }

    private static boolean isPdf(byte[] bytes) {
        return bytes != null && bytes.length > 4 &&
            bytes[0] == 0x25 && // %
            bytes[1] == 0x50 && // P
            bytes[2] == 0x44 && // D
            bytes[3] == 0x46 && // F
            bytes[4] == 0x2D;   // -
    }
}
