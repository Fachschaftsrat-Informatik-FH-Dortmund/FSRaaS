package de.fsrfb4.fb4.util;

public interface Call<T> {
    /**
     * Asynchronously send the request and notify {@code callback} of its response or if an error
     * occurred.
     */
    void enqueue(Callback<T> callback);

    default void cancel() { }
}
