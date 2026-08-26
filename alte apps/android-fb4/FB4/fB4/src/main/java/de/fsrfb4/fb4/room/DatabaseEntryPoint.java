package de.fsrfb4.fb4.room;

import dagger.hilt.EntryPoint;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;

@EntryPoint
@InstallIn(SingletonComponent.class)
public interface DatabaseEntryPoint {
    AppDatabase getAppDatabase();
}
