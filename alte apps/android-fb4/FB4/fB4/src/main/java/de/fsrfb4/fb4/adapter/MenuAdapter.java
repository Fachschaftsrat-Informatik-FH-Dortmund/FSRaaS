package de.fsrfb4.fb4.adapter;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import androidx.preference.PreferenceManager;
import androidx.annotation.NonNull;
import androidx.core.content.res.ResourcesCompat;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;

import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.MenuRowViewBinding;
import de.fsrfb4.fb4.model.ListItemMenu;
import de.fsrfb4.fb4.model.MenuCard;

import java.util.List;

public class MenuAdapter extends ArrayAdapter<ListItemMenu> {
    private Context context;
    private ViewHolder holder;

    public MenuAdapter(Context context, int resourceId,
                List<ListItemMenu> items) {
        super(context, resourceId, items);
        this.context = context;
    }

    @NonNull
    public View getView(final int position, View convertView, @NonNull ViewGroup parent) {
        holder = null;
        ListItemMenu rowItem = getItem(position);

        LayoutInflater mInflater = (LayoutInflater) context
            .getSystemService(Activity.LAYOUT_INFLATER_SERVICE);
        if (convertView == null) {
            MenuRowViewBinding binding = MenuRowViewBinding.inflate(mInflater, null, false);
            convertView = binding.getRoot();
            holder = new ViewHolder(binding);
            convertView.setEnabled(false);
            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }

        MenuCard card = new MenuCard(context, rowItem);
        card.init();
        holder.binding.cardMenu.setCard(card);

        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(context);

        if (!rowItem.isOpen() && appSharedPrefs.getBoolean(
            context.getString(R.string.preference_key_menu_gray), context.getResources().getBoolean(R.bool.preference_default_menu_gray))) {
            holder.binding.cardMenu.setCardBackgroundColor(ResourcesCompat.getColor(context.getResources(), R.color.card_grey, null));
        }

        return convertView;
    }

    @Override
    public int getViewTypeCount() {

        return getCount();
    }

    @Override
    public int getItemViewType(int position) {

        return position;
    }

    private class ViewHolder {
        MenuRowViewBinding binding;

        public ViewHolder(MenuRowViewBinding binding) {
            this.binding = binding;
        }
    }
}
