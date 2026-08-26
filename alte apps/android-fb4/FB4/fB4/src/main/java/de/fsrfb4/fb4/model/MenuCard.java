package de.fsrfb4.fb4.model;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.drawable.Drawable;
import androidx.preference.PreferenceManager;

import androidx.core.graphics.drawable.DrawableCompat;
import androidx.appcompat.content.res.AppCompatResources;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

import java.util.ArrayList;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.MenuListItemBinding;
import de.fsrfb4.fb4.databinding.MenuRowViewHeaderBinding;
import de.fsrfb4.fb4.activities.DishDetailsActivity;
import it.gmariotti.cardslib.library.internal.Card;
import it.gmariotti.cardslib.library.prototypes.LinearListView;
import it.gmariotti.cardslib.library.internal.CardHeader;
import it.gmariotti.cardslib.library.prototypes.CardWithList;
import lombok.Getter;
import lombok.Setter;

/**
 * Created by Özgür on 26.06.2016.
 */
@Getter
@Setter
public class MenuCard extends CardWithList {
    private Context context;
    private ListItemMenu listItem;

    public MenuCard(Context context, ListItemMenu listItem) {
        super(context);
        this.context = context;
        this.listItem = listItem;
    }

    @Override
    protected CardHeader initCardHeader() {
        CardHeader header = new CardHeader(context, R.layout.menu_row_view_header) {
            @Override
            public void setupInnerViewElements(ViewGroup parent, View view) {
                super.setupInnerViewElements(parent, view);
                MenuRowViewHeaderBinding binding = MenuRowViewHeaderBinding.bind(view);

                binding.textCanteenName.setText(listItem.getCanteen().getName());
                LocalTime start = null;
                LocalTime end = null;
                if (listItem.getCanteen().getWeeklyMenu() != null) {
                    start = listItem.getCanteen().getWeeklyMenu().getOpeningStartForDate(listItem.getDay());
                    end = listItem.getCanteen().getWeeklyMenu().getOpeningEndForDate(listItem.getDay());
                }

                if (start == null || end == null) {
                    binding.textOpeningTimes.setText(R.string.geschlossen);
                } else {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
                    binding.textOpeningTimes.setText(start.format(formatter) + " - " + end.format(formatter) + " " + context.getString(R.string.uhr));
                }

                if (listItem.getCanteen().getWeeklyMenu().isOld()) {
                    binding.textLastUpdated.setText(context.getString(R.string.zuletztAktualisiert, getTimeUnitString(listItem.getCanteen().getWeeklyMenu().getAgeInMinutes())));
                    binding.textLastUpdated.setVisibility(View.VISIBLE);
                }

                SharedPreferences appSharedPrefs = PreferenceManager
                    .getDefaultSharedPreferences(context);

                if (!listItem.isOpen() && appSharedPrefs.getBoolean(
                    context.getString(R.string.preference_key_menu_gray),
                    context.getResources().getBoolean(R.bool.preference_default_menu_gray))) {
                    binding.textCanteenName.setEnabled(false);
                    binding.textOpeningTimes.setEnabled(false);
                    binding.textLastUpdated.setEnabled(false);
                }
            }
        };

        header.setPopupMenu(R.menu.speiseplan_list_item_popup, listItem.getPopupMenuListener());
        header.setPopupMenuPrepareListener((card, popupMenu) -> {
            if (((MenuCard) card).listItem.getCanteen().getPdfUrl() == null) {
                popupMenu.getMenu().findItem(R.id.pdf).setVisible(false);
            }

            return true;
        });
        return header;
    }

    @Override
    protected void initCard() {
        setSwipeable(false);
    }

    @Override
    protected List<ListObject> initChildren() {
        List<ListObject> mObjects = new ArrayList<>();

        for (Dish gericht : listItem.getCanteen().getWeeklyMenu().getDishesForDate(listItem.getDay())) {
            mObjects.add(new ListItem(this, gericht));
        }

        return mObjects;
    }

    @Override
    public View setupChildView(int i, ListObject listObject, View view, ViewGroup viewGroup) {
        MenuListItemBinding binding = MenuListItemBinding.bind(view);

        ListItem item = (ListItem) listObject;
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(context);

        if (item.gericht.hasDazu()) {
            binding.textDishMain.setText(item.gericht.getHauptGericht());
            binding.textDishSide.setText(item.gericht.getDazu());
        } else {
            binding.textDishMain.setText(item.gericht.name);
            binding.textDishSide.setVisibility(View.GONE);
        }
        binding.textDishType.setText(item.gericht.supplies);

        String priceFor = appSharedPrefs.getString(context.getString(R.string.preference_key_menu_price),
            context.getString(R.string.preference_default_menu_price));
        if (priceFor.equals(context.getString(R.string.preference_value_menu_price_student))) {
            binding.textPrice.setText(item.gericht.priceStudent);
        } else if (priceFor.equals(context.getString(R.string.preference_value_menu_price_staff))) {
            binding.textPrice.setText(item.gericht.priceStaff);
        } else if (priceFor.equals(context.getString(R.string.preference_value_menu_price_guest))) {
            binding.textPrice.setText(item.gericht.priceGuest);
        }

        if (item.gericht.getIcon() != 0) {
            ColorStateList csl = AppCompatResources.getColorStateList(context, R.color.icon_color);
            Drawable drawable = DrawableCompat.wrap(AppCompatResources.getDrawable(context, item.gericht.getIcon()));
            DrawableCompat.setTintList(drawable, csl);
            drawable.mutate();
            binding.imageCategory.setImageDrawable(drawable);
        }

        item.setOnItemClickListener(new it.gmariotti.cardslib.library.prototypes.CardWithList.OnItemClickListener() {
            @Override
            public void onItemClick(it.gmariotti.cardslib.library.prototypes.LinearListView parent, View view, int position, ListObject object) {
                Intent intent = new Intent(context, DishDetailsActivity.class);
                Bundle bundle = new Bundle();
                bundle.putSerializable("dish", item.gericht);
                bundle.putSerializable("weeklyMenu", listItem.getCanteen().getWeeklyMenu());
                intent.putExtras(bundle);
                context.startActivity(intent);
            }
        });

        if (!listItem.isOpen() && appSharedPrefs.getBoolean(
            context.getString(R.string.preference_key_menu_gray),
            context.getResources().getBoolean(R.bool.preference_default_menu_gray))) {
            binding.textDishMain.setEnabled(false);
            binding.textDishSide.setEnabled(false);
            binding.textDishType.setEnabled(false);
            binding.layoutMenuItem.setBackgroundResource(R.color.card_grey);
            binding.imageCategory.setEnabled(false);
            binding.textPrice.setEnabled(false);
        }

        return view;
    }

    @Override
    public int getChildLayoutId() {
        return R.layout.menu_list_item;
    }

    private String getTimeUnitString(int minutes) {
        if (minutes < 60) {
            return String.valueOf(minutes) + " " + (minutes == 1 ? context.getString(R.string.minute) : context.getString(R.string.minuten));
        }

        minutes /= 60;
        if (minutes < 24) {
            return String.valueOf(minutes) + " " + (minutes == 1 ? context.getString(R.string.stunde) : context.getString(R.string.stunden));
        }

        minutes /= 24;
        return String.valueOf(minutes) + " " + (minutes == 1 ? context.getString(R.string.tag) : context.getString(R.string.tagen));
    }

    public class ListItem extends DefaultListObject {
        public final Dish gericht;

        public ListItem(Card card, Dish gericht) {
            super(card);
            this.gericht = gericht;
        }
    }
}
