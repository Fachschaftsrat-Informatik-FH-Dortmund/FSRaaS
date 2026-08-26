package de.fsrfb4.fb4.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Filter;
import android.widget.Filterable;

import java.util.ArrayList;
import java.util.List;

import de.fsrfb4.fb4.model.LoadMoreItem;
import de.fsrfb4.fb4.util.FilterableItem;
import de.fsrfb4.fb4.util.ListItem;

public class NewsAdapter extends ArrayAdapter<ListItem> implements Filterable {
    private static final int LIST_ITEM_COUNT = 3;
    public static final int LIST_ITEM_NEWS = 0;
    public static final int LIST_ITEM_LOADMORE = 1;
    public static final int LIST_ITEM_TEXT = 2;

    private Context context;
    private List<ListItem> items;
    private List<ListItem> filteredItems;
    private String filterText;

    public NewsAdapter(Context context, List<ListItem> items) {
        super(context, 0, items);
        this.filteredItems = items;
        this.context = context;
    }

    public View getView(final int position, View convertView, ViewGroup parent) {
        ListItem listItem = filteredItems.get(position);

        LayoutInflater inflater = listItem.getInflater(context);
        if (convertView == null) {
            Object binding = listItem.createBinding(inflater, null);
            convertView = listItem.getRoot(binding);
            convertView.setTag(binding);
        }
        
        listItem.bindView(context, convertView.getTag());
        
        return convertView;
    }

    @Override
    public boolean isEnabled(int position) {
        ListItem item = getItem(position);
        if (item.getViewType() == LIST_ITEM_LOADMORE) {
            return ((LoadMoreItem) item).isError();
        }
        return super.isEnabled(position);
    }

    public String getFilterText() {
        return filterText == null ? "" : filterText;
    }

    public List<ListItem> getItems() {
        return filteredItems;
    }

    public void addItems(List<ListItem> listItems) {
        filteredItems.addAll(listItems);
    }

    @Override
    public int getCount() {
        return filteredItems.size();
    }

    @Override
    public ListItem getItem(int position) {
        return filteredItems.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public int getViewTypeCount() {
        return LIST_ITEM_COUNT;
    }

    @Override
    public int getItemViewType(int position) {
        return getItem(position).getViewType();
    }

    public void resetFilter() {
        if (items != null && !items.isEmpty()) {
            filterText = null;
            filteredItems.clear();
            filteredItems.addAll(items);
            notifyDataSetChanged();
            items = null;
        }
    }

    @Override
    public CustomFilter getFilter() {
        return new CustomFilter();
    }

    @Override
    public void clear() {
        items = null;
        super.clear();
    }

    public class CustomFilter extends Filter {
        @Override
        protected void publishResults(CharSequence constraint, FilterResults results) {
            filteredItems.clear();
            filteredItems.addAll((List<ListItem>) results.values);
            notifyDataSetChanged();
        }

        @Override
        protected FilterResults performFiltering(CharSequence constraint) {
            FilterResults results = new FilterResults();
            final List<ListItem> filteredList;

            if (items == null) {
                items = new ArrayList<>(filteredItems);
            }

            filterText = constraint.toString();
            filteredList = getFilteredItems();
            results.count = filteredList.size();
            results.values = filteredList;
            return results;
        }

        private List<ListItem> getFilteredItems() {
            List<ListItem> filteredList = new ArrayList<>();
            for (ListItem item : items) {
                if (!(item instanceof FilterableItem) || ((FilterableItem) item).contains(filterText.toLowerCase())) {
                    filteredList.add(item);
                }
            }
            return filteredList;
        }

        public void execute(CharSequence constraint) {
            FilterResults filterResults = performFiltering(constraint);
            publishResults(constraint, filterResults);
        }
    }
}
