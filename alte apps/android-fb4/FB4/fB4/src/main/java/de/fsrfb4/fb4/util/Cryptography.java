package de.fsrfb4.fb4.util;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.RequiresApi;

import java.io.IOException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.UnrecoverableEntryException;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertificateException;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.GCMParameterSpec;

/*
MIT License: https://opensource.org/licenses/MIT
Copyright 2017 Diederik Hattingh
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

public class Cryptography {
    private static final String ANDROID_KEY_STORE_NAME = "AndroidKeyStore";
    private static final String AES_MODE = "AES/GCM/NoPadding";
    private static final String KEY_ALIAS = "key_ods_credentials";
    private static final byte[] FIXED_IV = new byte[]{55, 54, 53, 52, 51, 50,
        49, 48, 47, 46, 45, 44};
    private static final String CHARSET_NAME = "UTF-8";
    private static final String LOG_TAG = Cryptography.class.getName();

    private static final Object s_keyInitLock = new Object();

    // Using algorithm as described at https://medium.com/@ericfu/securely-storing-secrets-in-an-android-application-501f030ae5a3
    @RequiresApi(api = Build.VERSION_CODES.M)
    private void initKeys(boolean generateIfNotExists) throws KeyStoreException, CertificateException, NoSuchAlgorithmException, IOException,
        NoSuchProviderException, InvalidAlgorithmParameterException, UnrecoverableEntryException {
        KeyStore keyStore = KeyStore.getInstance(ANDROID_KEY_STORE_NAME);
        keyStore.load(null);

        if (!keyStore.containsAlias(KEY_ALIAS)) {
            if (generateIfNotExists) {
                initValidKeys();
            } else {
                throw new IllegalStateException("Key does not exist");
            }
        } else {
            boolean keyValid = false;
            try {
                KeyStore.Entry keyEntry = keyStore.getEntry(KEY_ALIAS, null);
                if (keyEntry instanceof KeyStore.SecretKeyEntry &&
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    keyValid = true;
                }
            } catch (NullPointerException | UnrecoverableKeyException e) {
                Log.e(LOG_TAG, "Failed to get key store entry", e);
            }

            if (!keyValid) {
                synchronized (s_keyInitLock) {
                    // System upgrade or something made key invalid
                    if (generateIfNotExists) {
                        initValidKeys();
                        removeKeys(keyStore);
                    } else {
                        throw new IllegalStateException("Key does not exist");
                    }
                }
            }

        }
    }

    public void removeKeys() throws KeyStoreException, CertificateException, NoSuchAlgorithmException, IOException {
        synchronized (s_keyInitLock) {
            KeyStore keyStore = KeyStore.getInstance(ANDROID_KEY_STORE_NAME);
            keyStore.load(null);
            removeKeys(keyStore);
        }
    }

    protected void removeKeys(KeyStore keyStore) throws KeyStoreException {
        keyStore.deleteEntry(KEY_ALIAS);
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void initValidKeys() throws NoSuchAlgorithmException, NoSuchProviderException, InvalidAlgorithmParameterException {
        synchronized (s_keyInitLock) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                generateKeys();
            }
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    protected void generateKeys() throws NoSuchAlgorithmException, NoSuchProviderException, InvalidAlgorithmParameterException {
        KeyGenerator keyGenerator;
        keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE_NAME);
        keyGenerator.init(
            new KeyGenParameterSpec.Builder(KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                // NOTE no Random IV. According to above this is less secure but acceptably so.
                .setRandomizedEncryptionRequired(false)
                .build());
        // Note according to [docs](https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec.html)
        // this generation will also add it to the keystore.
        keyGenerator.generateKey();
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public String encryptData(String stringDataToEncrypt) throws NoSuchPaddingException, NoSuchAlgorithmException, UnrecoverableEntryException, CertificateException,
        KeyStoreException, IOException, InvalidAlgorithmParameterException, InvalidKeyException, NoSuchProviderException, BadPaddingException, IllegalBlockSizeException {
        initKeys(true);

        if (stringDataToEncrypt == null) {
            throw new IllegalArgumentException("Data to be decrypted must be non null");
        }

        Cipher cipher;
        cipher = Cipher.getInstance(AES_MODE);
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey(),
            new GCMParameterSpec(128, FIXED_IV));

        byte[] encodedBytes = cipher.doFinal(stringDataToEncrypt.getBytes(CHARSET_NAME));
        String encryptedBase64Encoded = Base64.encodeToString(encodedBytes, Base64.DEFAULT);
        return encryptedBase64Encoded;

    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public String decryptData(String encryptedData) throws NoSuchPaddingException, NoSuchAlgorithmException, UnrecoverableEntryException, CertificateException,
        KeyStoreException, IOException, InvalidAlgorithmParameterException, InvalidKeyException, NoSuchProviderException, BadPaddingException, IllegalBlockSizeException {
        initKeys(false);

        if (encryptedData == null) {
            throw new IllegalArgumentException("Data to be decrypted must be non null");
        }

        byte[] encryptedDecodedData = Base64.decode(encryptedData, Base64.DEFAULT);

        Cipher c;
        try {
            c = Cipher.getInstance(AES_MODE);
            c.init(Cipher.DECRYPT_MODE, getSecretKey(), new GCMParameterSpec(128, FIXED_IV));

        } catch (InvalidKeyException | IOException e) {
            removeKeys();
            throw e;
        }

        byte[] decodedBytes = c.doFinal(encryptedDecodedData);
        return new String(decodedBytes, CHARSET_NAME);

    }

    private Key getSecretKey() throws CertificateException, NoSuchAlgorithmException, IOException, KeyStoreException, UnrecoverableKeyException {
        KeyStore keyStore = KeyStore.getInstance(ANDROID_KEY_STORE_NAME);
        keyStore.load(null);
        return keyStore.getKey(KEY_ALIAS, null);
    }
}
