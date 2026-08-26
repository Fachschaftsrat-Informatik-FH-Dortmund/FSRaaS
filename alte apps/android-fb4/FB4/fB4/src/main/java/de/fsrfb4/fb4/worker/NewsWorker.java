package de.fsrfb4.fb4.worker;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.concurrent.futures.CallbackToFutureAdapter;
import androidx.work.ListenableWorker;
import androidx.work.WorkerParameters;

import com.google.common.util.concurrent.ListenableFuture;

import dagger.hilt.EntryPoint;
import dagger.hilt.InstallIn;
import dagger.hilt.android.EntryPointAccessors;
import dagger.hilt.components.SingletonComponent;
import de.fsrfb4.fb4.service.NewsService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class NewsWorker extends ListenableWorker {
    public static final String WORK_NAME = "aktuelles";

    /**
     * @param appContext   The application {@link Context}
     * @param workerParams Parameters to setup the internal state of this worker
     */
    public NewsWorker(@NonNull Context appContext, @NonNull WorkerParameters workerParams) {
        super(appContext, workerParams);
    }

    @NonNull
    @Override
    public ListenableFuture<Result> startWork() {
        return CallbackToFutureAdapter.getFuture(completer -> {
            NewsService newsService = EntryPointAccessors.fromApplication(getApplicationContext(), NewsServiceEntryPoint.class).newsService();
            newsService.checkNewMessages(success ->
                completer.set(success ? Result.success() : Result.failure()), false);

            return null;
        });
    }

    @EntryPoint
    @InstallIn(SingletonComponent.class)
    public interface NewsServiceEntryPoint {
        NewsService newsService();
    }
}
