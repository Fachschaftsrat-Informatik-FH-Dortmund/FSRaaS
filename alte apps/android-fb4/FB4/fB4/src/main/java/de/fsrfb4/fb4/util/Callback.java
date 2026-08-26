package de.fsrfb4.fb4.util;

public interface Callback<T> {
    void onSuccess(T t);

    default void onFailure(Throwable t) {
        t.printStackTrace();
    }
}
