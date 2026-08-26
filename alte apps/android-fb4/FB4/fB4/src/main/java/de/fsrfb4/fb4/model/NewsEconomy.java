package de.fsrfb4.fb4.model;

import io.realm.RealmObject;
import io.realm.annotations.PrimaryKey;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NewsEconomy extends RealmObject {
    private String title;
    private String content;
    private String author;
    private String type;
    @PrimaryKey
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private long hash;
    private boolean pinned;

    public NewsEconomy() {
    }

    public NewsEconomy(String title, String content, String author, String type) {
        this.title = title;
        this.content = content;
        this.author = author;
        this.type = type;

        generateHash();
    }

    public boolean contains(String search) {
        search = search.toLowerCase();
        return title.toLowerCase().contains(search) || content.toLowerCase().contains(search) || author.toLowerCase().contains(search);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof NewsEconomy)) {
            return false;
        }

        NewsEconomy that = (NewsEconomy) o;

        if (!title.equals(that.title)) {
            return false;
        }
        if (!content.equals(that.content)) {
            return false;
        }
        if (!author.equals(that.author)) {
            return false;
        }
        return type.equals(that.type);
    }

    @Override
    public int hashCode() {
        int result = title.hashCode();
        result = 31 * result + content.hashCode();
        result = 31 * result + author.hashCode();
        result = 31 * result + type.hashCode();
        return result;
    }

    public void generateHash() {
        hash = hashCode();
    }
}
