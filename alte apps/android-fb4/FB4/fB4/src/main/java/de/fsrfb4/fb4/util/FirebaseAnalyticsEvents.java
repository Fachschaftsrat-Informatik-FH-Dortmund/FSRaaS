package de.fsrfb4.fb4.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@SuppressWarnings("checkstyle:HideUtilityClassConstructor")
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class FirebaseAnalyticsEvents {
    public static final String AUTOMATIC_TICKET_DOWNLOAD_STARTED = "automatic_ticket_download_started";
    public static final String AUTOMATIC_TICKET_DOWNLOAD_FINISHED = "automatic_ticket_download_finished";
    public static final String AUTOMATIC_TICKET_DOWNLOAD_FAILED = "automatic_ticket_download_failed";
    public static final String AUTOMATIC_TICKET_DOWNLOAD_SHOW_NOTIFICATION = "automatic_ticket_download_show_notif";

    public static final String TICKET_DOWNLOAD_STARTED = "ticket_download_started";
    public static final String TICKET_DOWNLOAD_FINISHED = "ticket_download_finished";
    public static final String TICKET_DOWNLOAD_FAILED = "ticket_download_failed";

    public static final String NEW_NEWS_CHECK_STARTED = "new_news_check_started";
    public static final String NEW_NEWS_FOUND = "new_news_found";

    public static final String ROOM_MIGRATION_STARTED = "room_migration_started";
    public static final String ROOM_MIGRATION_FINISHED = "room_migration_finished";
    public static final String ROOM_MIGRATION_FAILED = "room_migration_failed";

    public static class Param {
        public static final String TITLE = "title";
        public static final String DATE = "date";
        public static final String EXCEPTION = "exception";
    }
}
