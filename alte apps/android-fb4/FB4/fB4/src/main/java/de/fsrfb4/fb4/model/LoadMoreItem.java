package de.fsrfb4.fb4.model;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import de.fsrfb4.fb4.adapter.NewsAdapter;
import de.fsrfb4.fb4.databinding.NewsItemLoadMoreBinding;
import de.fsrfb4.fb4.util.ListItem;
import lombok.Getter;

public class LoadMoreItem implements ListItem {
    private NewsItemLoadMoreBinding binding;
    @Getter
    private boolean isError;

    @Override
    public int getViewType() {
        return NewsAdapter.LIST_ITEM_LOADMORE;
    }

    @Override
    public Object createBinding(LayoutInflater inflater, ViewGroup parent) {
        return NewsItemLoadMoreBinding.inflate(inflater, parent, false);
    }

    @Override
    public View getRoot(Object binding) {
        return ((NewsItemLoadMoreBinding) binding).getRoot();
    }

    @Override
    public void bindView(Context context, Object bindingObject) {
        this.binding = (NewsItemLoadMoreBinding) bindingObject;
        if (isError) {
            setError(true);
        } else {
            setLoading(true);
        }
    }

    public void setLoading(boolean loading) {
        this.isError = false;
        if (binding != null) {
            binding.cardView.setVisibility(loading ? View.GONE : View.VISIBLE);
            binding.progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        }

    }

    public void setError(boolean isError) {
        this.isError = isError;
        if (binding != null) {
            binding.cardView.setVisibility(isError ? View.VISIBLE : View.GONE);
            binding.progressBar.setVisibility(isError ? View.GONE : View.VISIBLE);
        }
    }
}
