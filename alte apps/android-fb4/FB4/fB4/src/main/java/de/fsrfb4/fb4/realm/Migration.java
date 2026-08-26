package de.fsrfb4.fb4.realm;

import io.realm.DynamicRealm;
import io.realm.RealmMigration;
import io.realm.RealmSchema;

public class Migration implements RealmMigration {
    @Override
    public void migrate(DynamicRealm realm, long oldVersion, long newVersion) {
        RealmSchema schema = realm.getSchema();

        if (oldVersion == 0) {
            schema.create("News")
                .addField("title", String.class)
                .addField("content", String.class)
                .addField("author", String.class)
                .addField("pinned", boolean.class)
                .addField("_dateTime", long.class)
                .addPrimaryKey("_dateTime");

            schema.create("NewsEconomy")
                .addField("title", String.class)
                .addField("content", String.class)
                .addField("author", String.class)
                .addField("type", String.class)
                .addField("pinned", boolean.class)
                .addField("hash", long.class)
                .addPrimaryKey("hash");

            oldVersion++;
        }
    }
}
