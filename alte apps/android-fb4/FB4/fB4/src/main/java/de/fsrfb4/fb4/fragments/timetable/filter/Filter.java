package de.fsrfb4.fb4.fragments.timetable.filter;

/**
 * Created by oezgu on 18.09.2016.
 */
public interface Filter<E> {

    boolean accept(E e);
}
