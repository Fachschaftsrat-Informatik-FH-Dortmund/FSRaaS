package de.fsrfb4.fb4.util;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

import java.lang.reflect.Type;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class LocalDateTimeSerializer implements JsonDeserializer<LocalDateTime>, JsonSerializer<LocalDateTime> {
    private static final DateTimeFormatter DATE_PRINT = DateTimeFormatter.ISO_DATE_TIME;

    @Override
    public LocalDateTime deserialize(final JsonElement je, final Type type,
                                     final JsonDeserializationContext jdc) throws JsonParseException {
        final String dateAsString = je.getAsString();
        if (dateAsString.length() == 0) {
            return null;
        } else {
            try {
                return LocalDateTime.parse(dateAsString);
            } catch (DateTimeParseException e) {
                return LocalDate.parse(dateAsString).atStartOfDay();
            }
        }
    }

    @Override
    public JsonElement serialize(final LocalDateTime src, final Type typeOfSrc,
                                 final JsonSerializationContext context) {
        String retVal;
        if (src == null) {
            retVal = "";
        } else {
            retVal = src.format(DATE_PRINT);
        }
        return new JsonPrimitive(retVal);
    }
}
