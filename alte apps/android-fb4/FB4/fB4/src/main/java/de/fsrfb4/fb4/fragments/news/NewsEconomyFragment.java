package de.fsrfb4.fb4.fragments.news;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
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
import android.widget.AdapterView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.ferfalk.simplesearchview.SimpleSearchView;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.activities.MainActivity;
import de.fsrfb4.fb4.adapter.NewsAdapter;
import de.fsrfb4.fb4.databinding.FragmentNewsBinding;
import de.fsrfb4.fb4.fragments.MenuItemFragment;
import de.fsrfb4.fb4.model.NewsEconomyItem;
import de.fsrfb4.fb4.model.TextItem;
import de.fsrfb4.fb4.room.NewsEconomyDao;
import de.fsrfb4.fb4.room.RoomNewsEconomy;
import de.fsrfb4.fb4.service.NewsService;
import de.fsrfb4.fb4.util.Call;
import de.fsrfb4.fb4.util.Callback;
import de.fsrfb4.fb4.util.ListItem;

@AndroidEntryPoint
public class NewsEconomyFragment extends Fragment implements MenuItemFragment {
    private static final String SIS_KEY_LISTVIEW = "listView";
    private static final String SIS_KEY_QUERY = "query";

    private FragmentNewsBinding binding;

    private Parcelable listViewState;

    private SimpleSearchView searchView;
    private Menu menu;
    private NewsAdapter adapter;

    private Activity context;

    private String query;
    private List<RoomNewsEconomy> newsList;

    @Inject
    NewsService newsService;

    @Inject
    NewsEconomyDao newsEconomyDao;

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
        
        ((MainActivity) getActivity()).getAppBarLayout().setElevation(getResources().getDimension(R.dimen.elevation));

        /* TODO: Remove once Aktuelles is available again
        binding.swipeContainer.setOnRefreshListener(() -> loadNewsList());
        binding.swipeContainer.setColorSchemeResources(R.color.swipetorefresh_blue,
            R.color.swipetorefresh_green,
            R.color.swipetorefresh_yellow,
            R.color.swipetorefresh_red);
        binding.swipeContainer.setProgressBackgroundColorSchemeResource(R.color.swiperefresh_progress_background);
        binding.swipeContainer.setOnChildScrollUpCallback((parent, child) -> binding.listView3.getVisibility() == View.VISIBLE && binding.listView3.canScrollVertically(-1));


        binding.listView3.setClipToPadding(false);
        binding.listView3.setOnItemClickListener((parent, view, position, id) -> {
            Dialog dialog = new AppCompatDialog(getActivity());
            NewsViewExpandedBinding dialogBinding = NewsViewExpandedBinding.inflate(LayoutInflater.from(context));
            dialog.setContentView(dialogBinding.getRoot());

            NewsEconomy item = ((NewsEconomyItem) adapter.getItem(position)).getNewsEconomy();
            dialogBinding.textTitle.setText(item.getTitle());
            dialogBinding.textContent.setText(item.getContent());
            dialogBinding.textAuthor.setText(item.getAuthor());
            dialogBinding.textTime.setText(item.getType());

            dialog.show();
        });

        registerForContextMenu(binding.listView3); */

        searchView = ((MainActivity) getActivity()).getSearchView();
        /* TODO: Remove once Aktuelles is available again
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
                }
            }
        });

        listener = (news, changeSet) -> {
            if (adapter == null || changeSet.getDeletions().length != 0 || changeSet.getInsertions().length != 0) {
                prepareListData();
                if (query != null) {
                    search(query);
                }
            } else {
                adapter.notifyDataSetChanged();
            }
        };

        if (savedInstanceState == null) {
            loadNewsList();
        } else {
            listViewState = savedInstanceState.getParcelable(SIS_KEY_LISTVIEW);
            query = savedInstanceState.getString(SIS_KEY_QUERY);
        }

        */

        List<ListItem> listItems = Arrays.asList(new TextItem(getString(R.string.news_not_available)));
        adapter = new NewsAdapter(context, listItems);
        binding.listView3.setAdapter(adapter);
        binding.swipeContainer.setEnabled(false);
    }

    private void refreshData() {
        newsEconomyDao.getAllLiveData().observe(getViewLifecycleOwner(), loadedNews -> {
            newsList = loadedNews;
            prepareListData();
            if (query != null) {
                search(query);
            }
        });
    }

    private void loadNewsList() {
        MainActivity.lockOrientation(getActivity());
        binding.swipeContainer.setRefreshing(true);

        Call<List<RoomNewsEconomy>> newsCall = newsService.updateNewsEconomy();
        newsCall.enqueue(new Callback<List<RoomNewsEconomy>>() {
            @Override
            public void onSuccess(List<RoomNewsEconomy> news) {
                refreshData();
                finishLoading(true);
            }

            @Override
            public void onFailure(Throwable t) {
                finishLoading(false);
            }
        });
    }

    private void finishLoading(boolean success) {
        setUpEmptyView(success || (newsList != null && !newsList.isEmpty()));
        binding.swipeContainer.setRefreshing(false);
        MainActivity.unlockOrientation(getActivity());
    }

    private void setUpEmptyView(boolean useNoNewsIcon) {
        binding.imageViewEmpty.setImageResource(useNoNewsIcon ? R.drawable.ic_no_news : R.drawable.ic_cloud_off);
        binding.textViewEmpty.setText(useNoNewsIcon ? R.string.keineNachrichtenVorhanden : R.string.connectionError);
    }

    @Override
    public void onCreateContextMenu(ContextMenu menu, View v,
                                    ContextMenuInfo menuInfo) {
        AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo) menuInfo;
        try {
            if (adapter.getItem(info.position).getViewType() == NewsAdapter.LIST_ITEM_NEWS) {
                menu.add(getActivity().getString(R.string.teilen));
            }
        } catch (Exception e) {
        }
    }

    @Override
    public boolean onContextItemSelected(MenuItem item) {
        AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo) item.getMenuInfo();
        CharSequence itemTitle = item.getTitle();
        int pos = info.position;

        if (itemTitle.equals(context.getString(R.string.teilen))) {
            RoomNewsEconomy news = ((NewsEconomyItem) adapter.getItem(pos)).getNewsEconomy();
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
            savedInstanceState.putParcelable(SIS_KEY_LISTVIEW, binding.listView3.onSaveInstanceState());
            savedInstanceState.putString(SIS_KEY_QUERY, query);
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().log("NewsEconomyFragment.onSaveInstanceState");
            FirebaseCrashlytics.getInstance().recordException(e);
        }
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        super.onCreateOptionsMenu(menu, inflater);
        this.menu = menu;

        searchView.setMenuItem(menu.findItem(R.id.search));
    }

    public void prepareListData() {
        List<ListItem> listItems = new ArrayList<>();
        if (newsList != null) {
            for (RoomNewsEconomy news : newsList) {
                listItems.add(new NewsEconomyItem(news));
            }
        }

        adapter = new NewsAdapter(context, listItems);
        binding.listView3.setEmptyView(binding.emptyView);
        binding.listView3.setAdapter(adapter);
        if (listViewState != null) {
            binding.listView3.onRestoreInstanceState(listViewState);
            listViewState = null;
        }
    }

    private void search(String search) {
        InputMethodManager imm = (InputMethodManager) context.getSystemService(
            Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(searchView.getSearchEditText().getWindowToken(), 0);

        if (adapter != null) {
            adapter.getFilter().filter(search);
        }
    }

    @Override
    public void setMenuVisible(boolean visible) {
        if (menu != null) {
            menu.findItem(R.id.search).setVisible(visible);
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        /* TODO: Remove once Aktuelles is available again
        newsList.removeChangeListener(listener);
        realm.close();*/
        binding = null;
    }
}
