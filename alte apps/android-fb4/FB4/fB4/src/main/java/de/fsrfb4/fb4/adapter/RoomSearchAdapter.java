package de.fsrfb4.fb4.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.recyclerview.widget.RecyclerView;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.RoomsearchRowViewBinding;
import de.fsrfb4.fb4.model.Room;

public class RoomSearchAdapter extends RecyclerView.Adapter<RoomSearchAdapter.ViewHolder> {
    Context context;
    List<Room> items;

    public RoomSearchAdapter(Context context, List<Room> items) {
        this.items = items;
        this.context = context;
    }

    public String formatTime(LocalTime time) {
        return time.format(DateTimeFormatter.ofPattern("HH:mm", Locale.GERMANY));
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        RoomsearchRowViewBinding binding = RoomsearchRowViewBinding.inflate(inflater, parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        Room rowItem = items.get(position);
        holder.binding.textTimeAbsolute.setText(context.getString(R.string.frei_bis) + " " + formatTime(rowItem.getFreeUntil()));

        long time = ChronoUnit.MINUTES.between(LocalTime.of(9, 30), rowItem.getFreeUntil()); //TODO
        String remaining;
        if (time > 60) {
            time = TimeUnit.HOURS.convert(time, TimeUnit.MINUTES);
            remaining = time == 1 ? context.getString(R.string.hour_remaining) : context.getString(R.string.hours_remaining, time);
        } else {
            remaining = time == 1 ? context.getString(R.string.minute_remaining) : context.getString(R.string.minutes_remaining, time);
        }
        holder.binding.textTimeRelative.setText(remaining);


        holder.binding.imageEkey.setImageResource(rowItem.isEkey() ? R.drawable.ekey : R.drawable.tower);
        holder.binding.textRoomSize.setText(rowItem.getSizeAsString(context));
        holder.binding.textRoomName.setText(rowItem.getName());
    }

    @Override
    public int getItemViewType(int position) {

        return position;
    }

    @Override
    public int getItemCount() {
        if (items == null) {
            return 0;
        } else {
            return items.size();
        }
    }

    protected class ViewHolder extends RecyclerView.ViewHolder {
        RoomsearchRowViewBinding binding;

        public ViewHolder(RoomsearchRowViewBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }
}
