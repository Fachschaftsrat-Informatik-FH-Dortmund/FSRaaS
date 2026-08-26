package de.fsrfb4.fb4.fragments.menu;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
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
import androidx.fragment.app.Fragment;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.io.File;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.adapter.MenuAdapter;
import de.fsrfb4.fb4.databinding.FragmentMenuBinding;
import de.fsrfb4.fb4.model.Canteen;
import de.fsrfb4.fb4.model.ListItemMenu;
import de.fsrfb4.fb4.model.MenuCard;
import de.fsrfb4.fb4.model.MenuDay;
import it.gmariotti.cardslib.library.internal.CardHeader;

public class MenuDayFragment extends Fragment {
    public static final String ARG_SECTION_NUMBER = "section_number";
    public static final String ARG_MENU = "menu";

    private FragmentMenuBinding binding;
    private MenuDay menuDay;
    private CardHeader.OnClickCardHeaderPopupMenuListener popupMenuListener;
    private DownloadManager manager;
    private long downloadId;

    @SuppressLint("WrongConstant")
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentMenuBinding.inflate(inflater, container, false);
        View rootView = binding.getRoot();

        menuDay = (MenuDay) getArguments().getSerializable(ARG_MENU);
        popupMenuListener = (card, item) -> {
            switch (item.getItemId()) {
                case R.id.ausblenden:
                    SharedPreferences appSharedPrefs = PreferenceManager
                        .getDefaultSharedPreferences(getActivity());

                    SharedPreferences.Editor prefsEditor = appSharedPrefs.edit();
                    prefsEditor.putBoolean(((MenuCard) card).getListItem().getCanteen().getId(), false);
                    prefsEditor.commit();

                    ((MenuFragment) getParentFragment()).removeCanteen(((MenuCard) card).getListItem().getCanteen());

                    break;
                case R.id.pdf:
                    IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
                    ContextCompat.registerReceiver(getContext(), downloadReceiver, filter, ContextCompat.RECEIVER_EXPORTED);

                    MenuCard sc = (MenuCard) card;
                    String name = sc.getListItem().getCanteen().getName();
                    String url = sc.getListItem().getCanteen().getPdfUrl();
                    downloadPDF(url, name);
                    break;
            }
        };

        binding.listView3.setClipToPadding(false);

        ViewCompat.setOnApplyWindowInsetsListener(binding.listView3, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
            return insets;
        });

        try {
            prepareListData();
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().recordException(e);
            e.printStackTrace();
        }

        return rootView;
    }

    public void prepareListData() {
        List<ListItemMenu> items = new ArrayList<>();
        for (Canteen canteen : menuDay.getCanteens()) {
            LocalDate dayOfWeek = menuDay.getDate();
            if (canteen.getWeeklyMenu().getDishesForDate(dayOfWeek).size() > 0) {
                items.add(new ListItemMenu(canteen, dayOfWeek, getContext(), popupMenuListener));
            }
        }

        if (items.isEmpty()) {
            binding.textView1.setVisibility(View.VISIBLE);
        } else {
            binding.textView1.setVisibility(View.GONE);
            MenuAdapter adapter = new MenuAdapter(getActivity(), R.layout.menu_row_view, items);
            binding.listView3.setAdapter(adapter);
            binding.listView3.setSelectionFromTop(getFirstOpened(items), (int) getActivity().getResources().getDimension(R.dimen.listview_padding));
        }
    }

    private int getFirstOpened(List<ListItemMenu> items) {
        for (int i = 0; i < items.size(); i++) {
            ListItemMenu item = items.get(i);
            if (item.isOpen()) {
                return i;
            }
        }
        return 0;
    }

    private void downloadPDF(String url, String name) {
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        if (isFileExists(name)) {
            deleteFile(name);
        }
        request.setDestinationUri(Uri.fromFile(new File(getContext().getExternalCacheDir(), name + ".pdf")));
        request.setNotificationVisibility(0);
        request.setMimeType("application/pdf");
        // get download service and enqueue file
        manager = (DownloadManager) getActivity().getSystemService(Context.DOWNLOAD_SERVICE);

        downloadId = manager.enqueue(request);
        Toast.makeText(getActivity(), getString(R.string.downloadWirdGestartet), Toast.LENGTH_SHORT).show();
    }

    private BroadcastReceiver downloadReceiver = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {
            try {
                DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                DownloadManager.Query query = new DownloadManager.Query();
                query.setFilterById(downloadId);
                Cursor c = downloadManager.query(query);
                if (c != null) {
                    if (c.moveToFirst()) {
                        int columnIndex = c.getColumnIndex(DownloadManager.COLUMN_STATUS);
                        if (DownloadManager.STATUS_SUCCESSFUL == c.getInt(columnIndex)) {
                            String downloadFileUrl = Uri.parse(c.getString(c.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI))).getPath();
                            Uri uri = FileProvider.getUriForFile(context, context.getApplicationContext().getPackageName() + ".provider", new File(downloadFileUrl));
                            Intent i = new Intent(Intent.ACTION_VIEW);
                            i.setDataAndType(uri, "application/pdf");
                            i.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            context.startActivity(i);
                        }
                    }
                    c.close();
                }
            } catch (Exception e) {
                Log.e("", "", e);
            }
        }
    };

    private boolean isFileExists(String filename) {
        File file = new File(getContext().getExternalCacheDir(), filename + ".pdf");
        return file.exists();
    }

    private boolean deleteFile(String filename) {
        File file = new File(getContext().getExternalCacheDir(), filename + ".pdf");
        return file.delete();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            getActivity().unregisterReceiver(downloadReceiver);
        } catch (Exception e) {
        }
        binding = null;
    }
}
