package de.fsrfb4.fb4.model;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import dagger.hilt.EntryPoints;
import de.fsrfb4.fb4.adapter.NewsAdapter;
import de.fsrfb4.fb4.databinding.NewsItemBinding;
import de.fsrfb4.fb4.room.AppDatabase;
import de.fsrfb4.fb4.room.DatabaseEntryPoint;
import de.fsrfb4.fb4.room.RoomNewsEconomy;
import de.fsrfb4.fb4.util.FilterableItem;
import de.fsrfb4.fb4.util.ListItem;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class NewsEconomyItem implements ListItem, FilterableItem {
    private RoomNewsEconomy newsEconomy;

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
        binding.textViewContent.setText(newsEconomy.getContent());
        binding.textViewTitle.setText(newsEconomy.getTitle());
        binding.textViewAuthor.setText(newsEconomy.getAuthor());
        binding.textViewTime.setText(newsEconomy.getType());
        binding.buttonPin.setChecked(newsEconomy.isPinned());
        binding.buttonPin.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (buttonView.isPressed()) {
                AppDatabase db = EntryPoints.get(context.getApplicationContext(), DatabaseEntryPoint.class).getAppDatabase();
                newsEconomy.setPinned(isChecked);
                db.newsEconomyDao().insertAsync(newsEconomy);
            }
        });
    }

    @Override
    public boolean contains(String constraint) {
        return newsEconomy.contains(constraint);
    }
}
