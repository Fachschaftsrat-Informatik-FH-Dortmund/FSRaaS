package de.fsrfb4.fb4;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.AssetManager;

import androidx.appcompat.app.AppCompatDelegate;
import androidx.multidex.MultiDexApplication;
import androidx.preference.PreferenceManager;

import com.google.android.gms.common.GooglePlayServicesNotAvailableException;
import com.google.android.gms.common.GooglePlayServicesRepairableException;
import com.google.android.gms.security.ProviderInstaller;
import com.google.firebase.FirebaseApp;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.gson.Gson;

import org.slf4j.impl.HandroidLoggerAdapter;

import java.io.File;
import java.io.InputStream;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.NoSuchAlgorithmException;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.util.concurrent.TimeUnit;

import javax.inject.Inject;
import javax.net.ssl.SSLContext;

import dagger.hilt.android.HiltAndroidApp;
import de.fsrfb4.fb4.firebase.DefaultFirebaseMessagingService;
import de.fsrfb4.fb4.realm.Migration;
import de.fsrfb4.fb4.room.AppDatabase;
import de.fsrfb4.fb4.service.DataService;
import de.fsrfb4.fb4.util.AdditionalKeyStoresSSLSocketFactory;
import de.fsrfb4.fb4.util.DataMigrator;
import de.fsrfb4.fb4.util.OneTimeActionHelper;
import de.fsrfb4.fb4.util.TicketUtil;
import io.realm.Realm;
import io.realm.RealmConfiguration;
import lombok.extern.slf4j.Slf4j;
import okhttp3.Cache;
import okhttp3.JavaNetCookieJar;
import okhttp3.OkHttpClient;

@Slf4j
@HiltAndroidApp
public class FB4 extends MultiDexApplication {

    @Inject
    public DataService dataService;

    @Inject
    public AppDatabase appDatabase;

    @Override
    public void onCreate() {
        super.onCreate();
        FirebaseApp.initializeApp(this);
        HandroidLoggerAdapter.DEBUG = BuildConfig.DEBUG;

        patchSecurityProvider();

        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(this);

        initCrashlytics();

        initRealm();

        DataMigrator.migrateRealmToRoom(this, appDatabase);

        AppCompatDelegate.setDefaultNightMode(Integer.valueOf(
            appSharedPrefs.getString(getString(R.string.preference_key_theme), String.valueOf(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM))));

        OneTimeActionHelper.doOnce(this, () -> {
            if (TicketUtil.ticketExists(this)) {
                FirebaseMessaging.getInstance().subscribeToTopic(DefaultFirebaseMessagingService.TOPIC_TICKET);
            }
        }, "firebase_ticket");

        OneTimeActionHelper.doOnce(this, () -> {
            if (TicketUtil.ticketExists(this)) {
                int[] rect = new int[] {322, 297, 1109, 700};
                SharedPreferences.Editor editor = appSharedPrefs.edit();
                editor.putString(getString(R.string.preference_key_ticket_rect), new Gson().toJson(rect))
                    .apply();
            }
        }, "ticket_rect");
        
        dataService.updateAllData(null);

        log.debug("FB4 gestartet");
    }

    private void patchSecurityProvider() {
        try {
            ProviderInstaller.installIfNeeded(getApplicationContext());
            SSLContext sslContext;
            sslContext = SSLContext.getInstance("TLSv1.2");
            sslContext.init(null, null, null);
            sslContext.createSSLEngine();
        } catch (GooglePlayServicesRepairableException | GooglePlayServicesNotAvailableException
            | NoSuchAlgorithmException | KeyManagementException e) {
            e.printStackTrace();
        }
    }

    private void initCrashlytics() {
        SharedPreferences appSharedPrefs = PreferenceManager
            .getDefaultSharedPreferences(this);

        boolean enableCrashlytics = appSharedPrefs.getBoolean(getString(R.string.preference_key_send_crash_reports),
            getResources().getBoolean(R.bool.preference_default_send_crash_reports));
        FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(enableCrashlytics);
    }

    private void initRealm() {
        Realm.init(this);
        RealmConfiguration realmConfiguration = new RealmConfiguration.Builder()
            .schemaVersion(1)
            .migration(new Migration())
            .allowQueriesOnUiThread(true)
            .allowWritesOnUiThread(true)
            .build();
        Realm.setDefaultConfiguration(realmConfiguration);
    }

    public static OkHttpClient.Builder getOkHttpClientBuilder(Context context, boolean useCookieJar) {
        File cacheDir = new File(context.getCacheDir(), "okhttp3");
        long size = 1024 * 1024 * 10;

        OkHttpClient.Builder builder = new OkHttpClient.Builder()
            .cache(new Cache(cacheDir, size))
            .callTimeout(30, TimeUnit.SECONDS);

        if (useCookieJar) {
            CookieManager cookieManager = new CookieManager();
            cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
            builder = builder.cookieJar(new JavaNetCookieJar(cookieManager));
        }

        try {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            AssetManager assetManager = context.getAssets();
            InputStream caInput = assetManager.open("fh.cer");
            Certificate ca;
            try {
                ca = cf.generateCertificate(caInput);
            } finally {
                caInput.close();
            }

            InputStream caDstInput = assetManager.open("dst.cer");
            Certificate caDst;
            try {
                caDst = cf.generateCertificate(caDstInput);
            } finally {
                caDstInput.close();
            }

            String keyStoreType = KeyStore.getDefaultType();
            KeyStore keyStore = KeyStore.getInstance(keyStoreType);
            keyStore.load(null, null);
            keyStore.setCertificateEntry("ca", ca);
            keyStore.setCertificateEntry("dst", caDst);

            AdditionalKeyStoresSSLSocketFactory socketFactory = new AdditionalKeyStoresSSLSocketFactory(keyStore);
            return builder.sslSocketFactory(socketFactory, socketFactory.getTrustManager());
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().recordException(e);
            return builder;
        }
    }
}
