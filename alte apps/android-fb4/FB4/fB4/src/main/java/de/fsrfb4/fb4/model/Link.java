package de.fsrfb4.fb4.model;

import com.google.gson.annotations.SerializedName;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Link implements Comparable<Link> {
    private static final String DEFAULT_LANGUAGE = "en";

    @SerializedName("key")
    private String key;
    @SerializedName("url")
    private String url;
    @SerializedName("title")
    private Map<String, String> title;
    @SerializedName("description")
    private Map<String, String> description;
    @SerializedName("sortOrder")
    private int sortOrder;

    public String getTitle(String language) {
        return title.containsKey(language) ? title.get(language) : title.get(DEFAULT_LANGUAGE);
    }

    public String getDescription(String language) {
        return description.containsKey(language) ? description.get(language) : description.get(DEFAULT_LANGUAGE);
    }

    @Override
    public int compareTo(Link link) {
        return sortOrder - link.sortOrder;
    }
}
