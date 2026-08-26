package de.fsrfb4.fb4.model;

import androidx.annotation.NonNull;

import java.io.Serializable;

import de.fsrfb4.fb4.R;

public class Dish implements Serializable, Comparable<Dish> {
    public static final String MENÜ_1 = "Menü 1";
    public static final String MENÜ_2 = "Menü 2";
    public static final String TAGESGERICHT = "Tagesgericht";
    public static final String VEGETARISCHES_MENÜ = "Vegetarisches Menü";
    public static final String AKTIONSTELLER = "Aktionsteller";
    public static final String AKTIONSTELLER_FISCH = "Aktionsteller Fisch";
    public static final String AKTIONSTELLER_VEGAN = "Aktionsteller Vegan";
    public static final String GRILLSTATION = "Grillstation";

    // English fallbacks
    public static final String MENU_1_EN = "Menu 1";
    public static final String MENU_2_EN = "Menu 2";
    public static final String DISH_OF_THE_DAY_EN = "Dish of the day";
    public static final String VEGETARIAN_MENU_EN = "Vegetarian Menu";
    public static final String GRILL_COUNTER_EN = "Grill counter";
    public static final String ACTION_DISH_EN = "Action dish"; // Best guess, will handle via general matching

    // Numeric categories as strings (as per TU API fallback)
    public static final String CAT_MENU_1 = "1";
    public static final String CAT_MENU_2 = "2";
    public static final String CAT_TAGESGERICHT = "3";
    public static final String CAT_VEG_MENU = "4";
    public static final String CAT_AKTION = "5";
    public static final String CAT_AKTION_FISCH = "6";
    public static final String CAT_AKTION_VEGAN = "7";
    public static final String CAT_GRILL = "8";

    public String name;
    public String supplies;
    public String category;
    public String priceStudent;
    public String priceStaff;
    public String priceGuest;

    public String typesRaw;
    public String additivesRaw;

    private static final String DAZU_SPLITTER1 = ", dazu";
    private static final String DAZU_SPLITTER2 = ",dazu";

    public Dish(String name, String supplies, String category, String priceStudent, String priceStaff, String priceGuest, String typesRaw, String additivesRaw) {
        this.name = name;
        this.supplies = mapSuppliesToShort(supplies);
        this.category = category;
        this.priceStudent = priceStudent;
        this.priceStaff = priceStaff;
        this.priceGuest = priceGuest;
        this.typesRaw = typesRaw;
        this.additivesRaw = additivesRaw;
    }

    public int getIcon() {
        if (category == null) return 0;
        switch (category) {
            case MENÜ_1:
            case MENU_1_EN:
            case CAT_MENU_1:
                return R.drawable.numeric_1_box;
            case MENÜ_2:
            case MENU_2_EN:
            case CAT_MENU_2:
                return R.drawable.numeric_2_box;
            case TAGESGERICHT:
            case DISH_OF_THE_DAY_EN:
            case CAT_TAGESGERICHT:
                return R.drawable.calendar_today;
            case VEGETARISCHES_MENÜ:
            case VEGETARIAN_MENU_EN:
            case CAT_VEG_MENU:
                return R.drawable.carrot;
            case AKTIONSTELLER:
            case ACTION_DISH_EN:
            case CAT_AKTION:
                return R.drawable.exclamation;
            case GRILLSTATION:
            case GRILL_COUNTER_EN:
            case CAT_GRILL:
                return R.drawable.grill;
            case AKTIONSTELLER_FISCH:
            case CAT_AKTION_FISCH:
                return R.drawable.fish;
            case AKTIONSTELLER_VEGAN:
            case CAT_AKTION_VEGAN:
                return R.drawable.tree;
            default:
                if (category.contains("Grill")) return R.drawable.grill;
                if (category.contains("Vegetarisch") || category.contains("Vegetarian")) return R.drawable.carrot;
                if (category.contains("Fisch") || category.contains("Fish")) return R.drawable.fish;
                if (category.contains("Vegan")) return R.drawable.tree;
                return 0;
        }
    }

    private static int getOrderForCategory(String category) {
        if (category == null) return 99;
        switch (category) {
            case MENÜ_1:
            case MENU_1_EN:
            case CAT_MENU_1:
                return 0;
            case MENÜ_2:
            case MENU_2_EN:
            case CAT_MENU_2:
                return 1;
            case TAGESGERICHT:
            case DISH_OF_THE_DAY_EN:
            case CAT_TAGESGERICHT:
                return 2;
            case VEGETARISCHES_MENÜ:
            case VEGETARIAN_MENU_EN:
            case CAT_VEG_MENU:
                return 3;
            case AKTIONSTELLER:
            case ACTION_DISH_EN:
            case CAT_AKTION:
                return 4;
            case AKTIONSTELLER_FISCH:
            case CAT_AKTION_FISCH:
                return 5;
            case AKTIONSTELLER_VEGAN:
            case CAT_AKTION_VEGAN:
                return 6;
            case GRILLSTATION:
            case GRILL_COUNTER_EN:
            case CAT_GRILL:
                return 7;
            default:
                if (category.contains("Menü 1") || category.contains("Menu 1")) return 0;
                if (category.contains("Menü 2") || category.contains("Menu 2")) return 1;
                if (category.contains("Grill")) return 7;
                return 99;
        }
    }

    private String mapSuppliesToShort(String category) {
        if (category == null) return "";
        category = category.replace("Mit Rindfleisch", "R")
            .replace("Kinderteller", "K")
            .replace("Mit Geflügel", "G")
            .replace("Mit Schweinefleisch", "S")
            .replace("Vegane Speise", "N")
            .replace("Ohne Fleisch", "V")
            .replace("Mit Fisch bzw. Meeresfrüchten", "F")
            .replace("Fleisch aus artgerechter Haltung", "A")
            .replace("Mit Lamm", "L")
            .replace("Mit Wild", "W");

        return category;
    }

    public boolean hasDazu() {
        return name.contains(DAZU_SPLITTER1 + " ") || name.contains(DAZU_SPLITTER2 + " ");
    }

    public String getHauptGericht() {
        if (getDazuArray() != null && getDazuArray().length > 0) {
            return getDazuArray()[0];
        }
        return name;
    }

    public String getDazu() {
        if (getDazuArray() != null && getDazuArray().length > 1) {
            return "dazu" + getDazuArray()[1];
        }
        return "";
    }

    private String[] getDazuArray() {
        if (name.contains(DAZU_SPLITTER1)) {
            return name.split(DAZU_SPLITTER1);
        } else if (name.contains(DAZU_SPLITTER2)) {
            return name.split(DAZU_SPLITTER2);
        } else {
            return null;
        }
    }

    @Override
    public int compareTo(@NonNull Dish o) {
        return getOrderForCategory(category) - getOrderForCategory(o.category);
    }
}
