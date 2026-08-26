package de.fsrfb4.fb4.model;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import java.time.format.DateTimeFormatter;

import dagger.hilt.EntryPoints;
import de.fsrfb4.fb4.adapter.NewsAdapter;
import de.fsrfb4.fb4.databinding.NewsItemBinding;
import de.fsrfb4.fb4.room.AppDatabase;
import de.fsrfb4.fb4.room.DatabaseEntryPoint;
import de.fsrfb4.fb4.room.RoomNews;
import de.fsrfb4.fb4.util.FilterableItem;
import de.fsrfb4.fb4.util.ListItem;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class NewsItem implements ListItem, FilterableItem {
    private RoomNews news;

    @Override
    public int getViewType() {
        return NewsAdapter.LIST_ITEM_NEWS;
    }

    @Override
    public Object createBinding(LayoutInflater inflater, ViewGroup parent) {
        return NewsItemBinding.inflate(inflater, parent, false);
    }

    @Override
    public View getRoot(Object binding) {
        return ((NewsItemBinding) binding).getRoot();
    }

    @Override
    public void bindView(Context context, Object bindingObject) {
        NewsItemBinding binding = (NewsItemBinding) bindingObject;
        binding.textViewContent.setText(news.getContent());
        binding.textViewTitle.setText(news.getTitle());
        binding.textViewAuthor.setText(news.getAuthor());
        DateTimeFormatter dateTimeFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy - HH:mm:ss");
        binding.textViewTime.setText(news.getDateTime().format(dateTimeFormat));
        binding.buttonPin.setChecked(news.isPinned());
        binding.buttonPin.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (buttonView.isPressed()) {
                AppDatabase db = EntryPoints.get(context.getApplicationContext(), DatabaseEntryPoint.class).getAppDatabase();
                news.setPinned(isChecked);
                db.newsDao().insertAsync(news);
            }
        });
    }

    @Override
    public boolean contains(String constraint) {
        return news.contains(constraint);
    }
}
