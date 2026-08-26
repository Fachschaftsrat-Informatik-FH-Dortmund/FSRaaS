package de.fsrfb4.fb4.realm;

import io.realm.Realm;
import io.realm.RealmFieldType;
import io.realm.RealmModel;
import io.realm.RealmObject;

/**
 * @author Lars Grefer
 */
public final class RealmUtils {

    private RealmUtils() {
    }

    public static int getNextId(Realm realm, Class<? extends RealmModel> clazz) {
        Number maxId = realm.where(clazz).max("id");
        return maxId == null ? 1 : maxId.intValue() + 1;
    }

    public static <E extends RealmModel> E createNext(Realm realm, Class<E> clazz) {
        return realm.createObject(clazz, getNextId(realm, clazz));
    }

    public static String getPrimaryKey(Realm realm, Class<? extends RealmObject> realmClass) {
        return realm.getSchema().get(realmClass.getSimpleName()).getPrimaryKey();
    }

    public static Class getPrimaryKeyType(Realm realm, Class<? extends RealmObject> realmClass) {
        String primaryKey = getPrimaryKey(realm, realmClass);
        RealmFieldType realmFieldType = realm.getSchema().get(realmClass.getSimpleName()).getFieldType(primaryKey);

        if (realmFieldType == RealmFieldType.INTEGER) {
            return Long.class;
        } else if (realmFieldType == RealmFieldType.STRING) {
            return String.class;
        } else {
            return null;
        }
    }

    public static <T extends RealmObject> T getObjectByPrimaryKey(Realm realm, Class<T> realmObjectClass, Object primaryKeyValue) {
        String primaryKey = getPrimaryKey(realm, realmObjectClass);
        Class<?> primaryKeyType = getPrimaryKeyType(realm, realmObjectClass);
        if (primaryKeyType == Long.class) {
            return realm.where(realmObjectClass).equalTo(primaryKey, Long.valueOf(String.valueOf(primaryKeyValue))).findFirst();
        } else {
            return realm.where(realmObjectClass).equalTo(primaryKey, String.class.cast(primaryKeyValue)).findFirst();
        }
    }
}
