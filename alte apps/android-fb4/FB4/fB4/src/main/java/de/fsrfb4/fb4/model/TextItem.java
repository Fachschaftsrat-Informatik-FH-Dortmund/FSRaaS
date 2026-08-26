package de.fsrfb4.fb4.model;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import de.fsrfb4.fb4.databinding.NewsItemTextBinding;
import de.fsrfb4.fb4.adapter.NewsAdapter;
import de.fsrfb4.fb4.util.ListItem;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class TextItem implements ListItem {
    private String text;

    @Override
    public int getViewType() {
        return NewsAdapter.LIST_ITEM_TEXT;
    }

    @Override
    public Object createBinding(LayoutInflater inflater, ViewGroup parent) {
        return NewsItemTextBinding.inflate(inflater, parent, false);
    }

    @Override
    public View getRoot(Object binding) {
        return ((NewsItemTextBinding) binding).getRoot();
    }

    @Override
    public void bindView(Context context, Object bindingObject) {
        NewsItemTextBinding binding = (NewsItemTextBinding) bindingObject;
        binding.textNewsContent.setText(text);
    }
}
