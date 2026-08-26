package de.fsrfb4.fb4.worker;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.concurrent.futures.CallbackToFutureAdapter;
import androidx.work.Data;
import androidx.work.ListenableWorker;
import androidx.work.WorkerParameters;

import com.google.common.util.concurrent.ListenableFuture;

import dagger.hilt.EntryPoint;
import dagger.hilt.InstallIn;
import dagger.hilt.android.EntryPointAccessors;
import dagger.hilt.components.SingletonComponent;
import de.fsrfb4.fb4.service.DataService;


public class DataUpdateWorker extends ListenableWorker {
    public static final String WORK_NAME = "dataupdate";
    public static final String EXTRA_KEY = "key";

    @EntryPoint
    @InstallIn(SingletonComponent.class)
    public interface DataServiceEntryPoint {
        DataService dataService();
    }

    /**
     * @param appContext   The application {@link Context}
     * @param workerParams Parameters to setup the internal state of this worker
     */
    public DataUpdateWorker(@NonNull Context appContext, @NonNull WorkerParameters workerParams) {
        super(appContext, workerParams);
    }

    @NonNull
    @Override
    public ListenableFuture<Result> startWork() {
        return CallbackToFutureAdapter.getFuture(completer -> {
            DataService dataService = EntryPointAccessors.fromApplication(getApplicationContext(), DataServiceEntryPoint.class).dataService();

            Data data = getInputData();
            if (data != null && data.hasKeyWithValueOfType(EXTRA_KEY, String.class)) {
                dataService.updateData(data.getString(EXTRA_KEY), success -> completer.set(success ? Result.success() : Result.failure()));
            } else {
                dataService.updateAllData(success -> completer.set(success ? Result.success() : Result.failure()));
            }

            return null;
        });
    }
}
