package de.fsrfb4.fb4.fragments.timetable.filter;

import de.fsrfb4.fb4.activities.timetable.AddEventsActivity;
import de.fsrfb4.fb4.util.GroupLetterUtil;

/**
 * Created by oezgu on 18.09.2016.
 */
public class LetterFilter implements Filter<AddEventsActivity.Event> {

    private String letter;

    public LetterFilter(String letter) {
        this.letter = letter;
    }

    @Override
    public boolean accept(AddEventsActivity.Event rowItem) {
        return GroupLetterUtil.IsInStudentSet(letter, rowItem.getRealEvent().getStudentSet());
    }
}
