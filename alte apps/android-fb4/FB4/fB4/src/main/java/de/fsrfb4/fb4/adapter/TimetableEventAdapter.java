package de.fsrfb4.fb4.adapter;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;

import androidx.core.content.res.ResourcesCompat;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import de.fsrfb4.fb4.R;
import de.fsrfb4.fb4.databinding.CustomRowViewBinding;
import de.fsrfb4.fb4.room.RoomTimetableEvent;

public class TimetableEventAdapter extends BaseAdapter {
    private List<RoomTimetableEvent> items;

    public TimetableEventAdapter(List<RoomTimetableEvent> items) {
        this.items = items;
    }

    public void updateData(List<RoomTimetableEvent> items) {
        this.items = items;
        notifyDataSetChanged();
    }

    @Override
    public int getCount() {
        return items == null ? 0 : items.size();
    }

    @Override
    public RoomTimetableEvent getItem(int position) {
        return items.get(position);
    }

    public View getView(final int position, View convertView, ViewGroup parent) {
        ViewHolder holder;
        RoomTimetableEvent rowItem = getItem(position);

        Context context = parent.getContext();

        LayoutInflater mInflater = LayoutInflater.from(context);
        if (convertView == null) {
            CustomRowViewBinding binding = CustomRowViewBinding.inflate(mInflater, null, false);
            convertView = binding.getRoot();
            holder = new ViewHolder(binding);
            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }

        holder.binding.text1.setText(formatCourseType(rowItem.getCourseType()) + rowItem.getName());
        holder.binding.text2.setText(formatTime(rowItem.getStartTime()) + "\n" + formatTime(rowItem.getEndTime()));
        holder.binding.text3.setText(formatStudentSet(rowItem.getStudentSet()) + rowItem.getLecturerName() + formatLecturerId(rowItem.getLecturerId()));
        holder.binding.text4.setText(String.valueOf(rowItem.getRoomId()));

        boolean valid = !rowItem.isInvalid();
        
        holder.binding.cardView.setEnabled(valid);
        holder.binding.text1.setEnabled(valid);
        holder.binding.text2.setEnabled(valid);
        holder.binding.text3.setEnabled(valid);
        holder.binding.text4.setEnabled(valid);

        if (rowItem.getColor() != 0 && rowItem.getColor() != Color.parseColor("#fafafa")) {
            holder.binding.cardView.setCardBackgroundColor(rowItem.getColor());
        } else {
            holder.binding.cardView.setCardBackgroundColor(ResourcesCompat.getColor(context.getResources(), R.color.card_default, null));
        }

        return convertView;
    }

    private String formatTime(LocalTime time) {
        return time.format(DateTimeFormatter.ofPattern("HH:mm", Locale.GERMANY));
    }

    public static String formatCourseType(String courseType) {
        if (courseType == null || courseType.isEmpty()) {
            return "";
        } else {
            return "[" + courseType + "] ";
        }
    }

    private static String formatStudentSet(String studentSet) {
        if (studentSet == null || studentSet.isEmpty()) {
            return "";
        } else {
            return studentSet + " | ";
        }
    }

    private static String formatLecturerId(String lecturerId) {
        if (lecturerId.isEmpty()) {
            return "";
        } else {
            return " (" + lecturerId + ")";
        }
    }

    @Override
    public long getItemId(int position) {
        RoomTimetableEvent item = getItem(position);
        return item == null ? 0 : item.getId();
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }

    private class ViewHolder {
        CustomRowViewBinding binding;

        ViewHolder(CustomRowViewBinding binding) {
            this.binding = binding;
        }
    }
}
