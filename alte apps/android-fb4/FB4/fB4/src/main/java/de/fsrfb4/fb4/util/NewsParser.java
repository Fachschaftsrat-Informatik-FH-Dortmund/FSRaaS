package de.fsrfb4.fb4.util;

import java.util.List;

import de.fsrfb4.fb4.room.RoomNews;

public interface NewsParser {
    List<RoomNews> parseNews(String html);
}
