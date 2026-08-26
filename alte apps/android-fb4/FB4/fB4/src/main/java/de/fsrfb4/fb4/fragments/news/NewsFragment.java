package de.fsrfb4.fb4.fragments.news;

import android.Manifest;
import android.app.Activity;
import android.app.Dialog;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.view.ContextMenu;
import android.view.ContextMenu.ContextMenuInfo;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.AbsListView;
import android.widget.AdapterView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatDialog;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;
import androidx.preference.PreferenceManager;

import com.afollestad.materialdialogs.MaterialDialog;
import com.ferfalk.simplesearchview.SimpleOnQueryTextListener;
import com.ferfalk.simplesearchview.SimpleSearchView;
import com.ferfalk.simplesearchview.SimpleSearchViewListener;
import com.google.android.material.snackbar.Snackbar;
import com.google.common.util.concurrent.Futures;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.firebase.messaging.FirebaseMessaging;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.MainActivity;
import de.fsrfb4.fb4.adapter.NewsAdapter;
import de.fsrfb4.fb4.databinding.FragmentNewsBinding;
import de.fsrfb4.fb4.databinding.NewsViewExpandedBinding;
import de.fsrfb4.fb4.firebase.DefaultFirebaseMessagingService;
import de.fsrfb4.fb4.fragments.MenuItemFragment;
import de.fsrfb4.fb4.model.LoadMoreItem;
import de.fsrfb4.fb4.model.NewsItem;
import de.fsrfb4.fb4.room.NewsDao;
import de.fsrfb4.fb4.room.RoomNews;
import de.fsrfb4.fb4.service.NewsService;
import de.fsrfb4.fb4.util.Call;
import de.fsrfb4.fb4.util.Callback;
import de.fsrfb4.fb4.util.CallbackUtil;
import de.fsrfb4.fb4.util.IntentHelper;
import de.fsrfb4.fb4.util.ListItem;
import de.fsrfb4.fb4.util.OneTimeActionHelper;
import permissions.dispatcher.NeedsPermission;
import permissions.dispatcher.RuntimePermissions;

@RuntimePermissions
@AndroidEntryPoint
public class NewsFragment extends Fragment implements MenuItemFragment {
    private static final String SIS_KEY_LISTVIEW = "listView";
    private static final String SIS_KEY_QUERY = "query";

    public static final String INTENT_EXTRA_NEWS = "news";
    public static final String SIS_KEY_CURRENT_PAGE = "currentPage";
    public static final String SIS_KEY_EXTRA_NEWS_LIST = "extraNewsList";

    private FragmentNewsBinding binding;

    private Parcelable listViewState;

    private NewsAdapter adapter;
    private SimpleSearchView searchView;
    private Menu menu;

    private boolean loading;
    private boolean hasMorePages = true;

    private int currentPage = 1;
    private List<RoomNews> extraNewsList = new ArrayList<>();
    private LoadMoreItem loadMoreItem;


    private String query;

    private Activity context;

    private List<RoomNews> newsList;

    @Inject
    public NewsService newsService;

    @Inject
    public NewsDao newsDao;

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        if (context instanceof Activity) {
            this.context = (Activity) context;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setHasOptionsMenu(true);
        cancelNotification();
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentNewsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(View rootView, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(rootView, savedInstanceState);
        
        ViewCompat.setOnApplyWindowInsetsListener(binding.listView3, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
            return insets;
        });

        ((MainActivity) getActivity()).getAppBarLayout().setElevation(getResources().getDimension(R.dimen.elevation));

        binding.swipeContainer.setOnRefreshListener(() -> refreshNewsList());
        binding.swipeContainer.setColorSchemeResources(R.color.swipetorefresh_blue,
            R.color.swipetorefresh_green,
            R.color.swipetorefresh_yellow,
            R.color.swipetorefresh_red);
        binding.swipeContainer.setProgressBackgroundColorSchemeResource(R.color.swiperefresh_progress_background);
        binding.swipeContainer.setOnChildScrollUpCallback((parent, child) -> binding.listView3.getVisibility() == View.VISIBLE && binding.listView3.canScrollVertically(-1));

        binding.listView3.setClipToPadding(false);

        binding.listView3.setOnItemClickListener((parent, view, position, id) -> {
            if (adapter.getItem(position).getViewType() == NewsAdapter.LIST_ITEM_NEWS) {
                showNewsDialog(((NewsItem) adapter.getItem(position)).getNews());
            } else if (adapter.getItem(position).getViewType() == NewsAdapter.LIST_ITEM_LOADMORE) {
                if (!loading && loadMoreItem.isError()) {
                    loadNextPage();
                }
            }
        });

        binding.listView3.setOnScrollListener(new AbsListView.OnScrollListener() {
            @Override
            public void onScrollStateChanged(AbsListView view, int scrollState) { }

            @Override
            public void onScroll(AbsListView view, int firstVisibleItem, int visibleItemCount, int totalItemCount) {
                if (!loading && totalItemCount > 0 && firstVisibleItem + visibleItemCount >= totalItemCount && (loadMoreItem == null || !loadMoreItem.isError())) {
                    loadNextPage();
                }
            }
        });

        registerForContextMenu(binding.listView3);

        searchView = ((MainActivity) getActivity()).getSearchView();
        searchView.setOnQueryTextListener(new SimpleOnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                if (!query.isEmpty()) {
                    search(query);
                    NewsFragment.this.query = query;
                } else if (adapter != null) {
                    adapter.resetFilter();
                    NewsFragment.this.query = null;
                }
                return true;
            }

            @Override
            public boolean onQueryTextCleared() {
                InputMethodManager imm = (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.showSoftInput(searchView.getSearchEditText(), InputMethodManager.SHOW_IMPLICIT);
                return false;
            }
        });

        searchView.setOnSearchViewListener(new SimpleSearchViewListener() {
            @Override
            public void onSearchViewClosed() {
                NewsFragment.this.query = null;
                if (adapter != null) {
                    adapter.resetFilter();
                    binding.listView3.setSelection(0);
                }
            }
        });

        initializeNewsList();

        Activity activity = getActivity();
        if (activity != null && activity.getIntent() != null) {
            LocalDateTime id = IntentHelper.getSerializable(activity.getIntent(),
                INTENT_EXTRA_NEWS, LocalDateTime.class);
            if (id != null) {
                Futures.addCallback(
                    newsDao.getByIdAsync(id),
                    CallbackUtil.onSuccess(news -> {
                        if (news != null) {
                            showNewsDialog(news);
                        }
                    }),
                    ContextCompat.getMainExecutor(getContext())
                );
            }

            Intent i = activity.getIntent();
            i.removeExtra(INTENT_EXTRA_NEWS);
            activity.setIntent(i);
        }

        if (savedInstanceState == null) {
            refreshNewsList();
        } else {
            currentPage = savedInstanceState.getInt(SIS_KEY_CURRENT_PAGE, 1);
            extraNewsList = (ArrayList<RoomNews>) savedInstanceState.getSerializable(SIS_KEY_EXTRA_NEWS_LIST);
            if (extraNewsList == null) {
                extraNewsList = new ArrayList<>();
            }

            listViewState = savedInstanceState.getParcelable(SIS_KEY_LISTVIEW);
            query = savedInstanceState.getString(SIS_KEY_QUERY);
        }

        OneTimeActionHelper.doOnce(getContext(), () -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                !PreferenceManager.getDefaultSharedPreferences(getContext()).getBoolean(
                    getString(R.string.preference_key_news_notifications),
                    getContext().getResources().getBoolean(R.bool.preference_default_news_notifications))) {
                new MaterialDialog.Builder(getContext())
                    .title(R.string.Pref_Notif_Title)
                    .content(R.string.new_news_notification_prompt)
                    .positiveText(R.string.ok)
                    .onPositive((dialog, which) -> NewsFragmentPermissionsDispatcher.activateNewsNotificationsWithPermissionCheck(this))
                    .negativeText(R.string.abbrechen)
                    .show();
            }
        }, "news_notification_permission");
    }

    private void initializeNewsList() {
        newsDao.getAllLiveData().observe(getViewLifecycleOwner(), loadedNews -> {
            newsList = loadedNews;
            prepareListData();
            if (query != null) {
                search(query);
            }
        });
    }

    private void loadNextPage() {
        if (loading || !hasMorePages) {
            return;
        }

        loading = true;
        loadMoreItem.setLoading(true);
        currentPage++;

        Call<List<RoomNews>> newsCall = newsService.getNewsPage(currentPage);
        newsCall.enqueue(new Callback<List<RoomNews>>() {
            @Override
            public void onSuccess(List<RoomNews> _newsList) {
                loading = false;
                if (_newsList != null && !_newsList.isEmpty()) {
                    extraNewsList.addAll(_newsList);
                } else {
                    hasMorePages = false;
                }
                prepareListData();
            }

            @Override
            public void onFailure(Throwable t) {
                loading = false;
                currentPage--;
                loadMoreItem.setError(true);
                adapter.notifyDataSetChanged();
            }

        });
    }

    private void refreshNewsList() {
        MainActivity.lockOrientation(getActivity());
        hasMorePages = true;

        currentPage = 1;
        extraNewsList.clear();

        loading = true;
        binding.swipeContainer.setRefreshing(true);

        Call<List<RoomNews>> newsCall = newsService.updateNews();
        newsCall.enqueue(new Callback<List<RoomNews>>() {
            @Override
            public void onSuccess(List<RoomNews> news) {
                finishLoading(true);

                SharedPreferences appSharedPrefs = PreferenceManager.getDefaultSharedPreferences(context);
                SharedPreferences.Editor editor = appSharedPrefs.edit();
                editor.putLong(context.getString(R.string.preference_key_news_last_checked),
                    LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()).apply();
            }

            @Override
            public void onFailure(Throwable t) {
                finishLoading(false);
                Snackbar.make(getView(), getString(R.string.fehlerBeimLaden_Aktuelles), Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void finishLoading(boolean success) {
        setUpEmptyView(success || !newsList.isEmpty());
        loading = false;
        binding.swipeContainer.setRefreshing(false);
        MainActivity.unlockOrientation(getActivity());
    }

    private void setUpEmptyView(boolean useNoNewsIcon) {
        binding.imageViewEmpty.setImageResource(useNoNewsIcon ? R.drawable.ic_no_news : R.drawable.ic_cloud_off);
        binding.textViewEmpty.setText(useNoNewsIcon ? R.string.keineNachrichtenVorhanden : R.string.connectionError);
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        inflater.inflate(R.menu.news, menu);
        super.onCreateOptionsMenu(menu, inflater);
        this.menu = menu;

        searchView.setMenuItem(menu.findItem(R.id.search));
    }

    @Override
    public void onCreateContextMenu(ContextMenu menu, View v, ContextMenuInfo menuInfo) {
        AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo) menuInfo;
        if (adapter.getItem(info.position).getViewType() == NewsAdapter.LIST_ITEM_NEWS) {
            menu.add(context.getString(R.string.teilen));
        }
    }

    @Override
    public boolean onContextItemSelected(MenuItem item) {
        AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo) item.getMenuInfo();
        CharSequence itemTitle = item.getTitle();
        int pos = info.position;

        if (itemTitle.equals(context.getString(R.string.teilen))) {
            RoomNews news = ((NewsItem) adapter.getItem(pos)).getNews();
            Intent i = new Intent();
            i.setAction(Intent.ACTION_SEND);
            i.putExtra(Intent.EXTRA_TEXT, news.getTitle() + ": " + news.getContent() + " - " + news.getAuthor());
            i.putExtra(Intent.EXTRA_SUBJECT, news.getTitle());
            i.setType("text/plain");
            startActivity(Intent.createChooser(i, getResources().getText(R.string.send_to)));
        }

        return true;
    }

    @Override
    public void onSaveInstanceState(Bundle savedInstanceState) {
        super.onSaveInstanceState(savedInstanceState);

        try {
            savedInstanceState.putInt(SIS_KEY_CURRENT_PAGE, currentPage);
            savedInstanceState.putSerializable(SIS_KEY_EXTRA_NEWS_LIST, new ArrayList<>(extraNewsList));

            savedInstanceState.putParcelable(SIS_KEY_LISTVIEW, binding.listView3.onSaveInstanceState());
            savedInstanceState.putString(SIS_KEY_QUERY, query);
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().log("NewsFragment.onSaveInstanceState");
            FirebaseCrashlytics.getInstance().recordException(e);
        }
    }

    public void prepareListData() {
        List<ListItem> listItems = new ArrayList<>();
        if (newsList != null) {
            for (RoomNews news : newsList) {
                listItems.add(new NewsItem(news));
            }
        }

        if (extraNewsList != null) {
            for (RoomNews news : extraNewsList) {
                if (newsList == null || !newsList.contains(news)) {
                    listItems.add(new NewsItem(news));
                }
            }
        }

        if (loadMoreItem == null) {
            loadMoreItem = new LoadMoreItem();
        }

        if (hasMorePages) {
            listItems.add(loadMoreItem);
        }

        if (adapter == null) {
            adapter = new NewsAdapter(context, listItems);
            binding.listView3.setEmptyView(binding.emptyView);
            binding.listView3.setAdapter(adapter);
        } else {
            int firstVisible = binding.listView3.getFirstVisiblePosition();
            View firstChild = binding.listView3.getChildAt(0);
            int topOffset = (firstChild == null) ? 0 : firstChild.getTop() - binding.listView3.getPaddingTop();

            adapter.setNotifyOnChange(false);
            adapter.clear();
            adapter.addAll(listItems);
            adapter.notifyDataSetChanged();

            binding.listView3.setSelectionFromTop(firstVisible, topOffset);
        }

        if (listViewState != null) {
            binding.listView3.onRestoreInstanceState(listViewState);
            listViewState = null;
        }

        if (query != null && !query.isEmpty() && adapter != null) {
            adapter.getFilter().execute(query);
        }
    }

    private void search(String search) {
        if (adapter != null) {
            InputMethodManager imm = (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(searchView.getSearchEditText().getWindowToken(), 0);
            adapter.getFilter().execute(search);
            binding.listView3.setSelection(0);
        }
    }

    @Override
    public void setMenuVisible(boolean visible) {
        if (menu != null) {
            menu.findItem(R.id.search).setVisible(visible);
        }
    }

    private void cancelNotification() {
        NotificationManager mNotificationManager =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        // mId allows you to update the notification later on.
        mNotificationManager.cancel(0);
        SharedPreferences.Editor edit = PreferenceManager.getDefaultSharedPreferences(context).edit();
        edit.putInt(NewsService.NOTIF_COUNT, 0);
        edit.putString(NewsService.NOTIF_TEXT, "");
        edit.apply();
    }

    private void showNewsDialog(RoomNews news) {
        Dialog dialog = new AppCompatDialog(context);
        NewsViewExpandedBinding dialogBinding = NewsViewExpandedBinding.inflate(LayoutInflater.from(context));
        dialog.setContentView(dialogBinding.getRoot());

        dialogBinding.textTitle.setText(news.getTitle());
        dialogBinding.textContent.setText(news.getContent());
        dialogBinding.textAuthor.setText(news.getAuthor());
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy - HH:mm:ss");
        dialogBinding.textTime.setText(news.getDateTime().format(dateTimeFormat));

        dialog.show();
    }

    @NeedsPermission(Manifest.permission.POST_NOTIFICATIONS)
    protected void activateNewsNotifications() {
        SharedPreferences appSharedPrefs = PreferenceManager.getDefaultSharedPreferences(getContext());
        SharedPreferences.Editor edit = appSharedPrefs.edit();
        edit.putBoolean(getString(R.string.preference_key_news_notifications), true).apply();
        FirebaseMessaging.getInstance().subscribeToTopic(DefaultFirebaseMessagingService.TOPIC_AKTUELLES);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        NewsFragmentPermissionsDispatcher.onRequestPermissionsResult(this, requestCode, grantResults);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
