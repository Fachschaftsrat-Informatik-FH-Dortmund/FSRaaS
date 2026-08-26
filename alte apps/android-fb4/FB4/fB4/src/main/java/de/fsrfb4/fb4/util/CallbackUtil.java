package de.fsrfb4.fb4.util;

import com.google.common.util.concurrent.FutureCallback;

import java.util.function.Consumer;

public final class CallbackUtil {
    private CallbackUtil() {
    }

    public static <T> FutureCallback<T> onSuccess(Consumer<T> action) {
        return new FutureCallback<T>() {
            @Override
            public void onSuccess(T result) {
                action.accept(result);
            }

            @Override
            public void onFailure(Throwable t) { }
        };
    }
}
