package de.fsrfb4.fb4.util;

import java.util.List;

import de.fsrfb4.fb4.room.RoomNewsEconomy;

public interface NewsEconomyParser {
    List<RoomNewsEconomy> parseNewsEconomy(String html);
}
