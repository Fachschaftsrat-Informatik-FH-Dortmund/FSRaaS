package de.fsrfb4.fb4.activities;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.ActivityDishDetailsBinding;
import de.fsrfb4.fb4.model.Dish;
import de.fsrfb4.fb4.model.WeeklyMenu;

public class DishDetailsActivity extends AppCompatActivity {

    private ActivityDishDetailsBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityDishDetailsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        Dish dish = (Dish) getIntent().getSerializableExtra("dish");
        WeeklyMenu weeklyMenu = (WeeklyMenu) getIntent().getSerializableExtra("weeklyMenu");

        if (dish == null || weeklyMenu == null) {
            finish();
            return;
        }

        binding.textDishName.setText(dish.getHauptGericht());

        if (dish.hasDazu()) {
            binding.textDishSide.setText(dish.getDazu());
        } else {
            binding.textDishSide.setVisibility(TextView.GONE);
        }

        binding.textPriceStudent.setText(dish.priceStudent);
        binding.textPriceStaff.setText(dish.priceStaff);
        binding.textPriceGuest.setText(dish.priceGuest);

        Map<String, String> typesMap = weeklyMenu.getTypes();
        if (dish.typesRaw != null && !dish.typesRaw.isEmpty()) {
            List<String> typesList = new ArrayList<>();
            for (String key : dish.typesRaw.split(",")) {
                key = key.trim();
                if (typesMap != null && typesMap.containsKey(key)) {
                    typesList.add(typesMap.get(key));
                } else {
                    typesList.add(key);
                }
            }
            binding.textDishTypes.setText(String.join(", ", typesList));
        } else {
            binding.textDishTypes.setText("-");
        }

        Map<String, String> additivesMap = weeklyMenu.getAdditives();
        if (dish.additivesRaw != null && !dish.additivesRaw.isEmpty()) {
            List<String> additivesList = new ArrayList<>();
            for (String key : dish.additivesRaw.split(",")) {
                key = key.trim();
                if (additivesMap != null && additivesMap.containsKey(key)) {
                    additivesList.add(additivesMap.get(key));
                } else {
                    additivesList.add(key);
                }
            }
            binding.textDishAdditives.setText(String.join(", ", additivesList));
        } else {
            binding.textDishAdditives.setText("-");
        }
    }
}
