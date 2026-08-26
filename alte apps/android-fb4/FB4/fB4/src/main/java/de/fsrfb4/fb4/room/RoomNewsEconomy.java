package de.fsrfb4.fb4.room;

import androidx.room.Entity;
import androidx.room.Ignore;
import androidx.room.PrimaryKey;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity(tableName = "news_economy")
public class RoomNewsEconomy {
    private String title;
    private String content;
    private String author;
    private String type;
    @PrimaryKey
    private long hash;
    private boolean pinned;

    @Ignore
    public RoomNewsEconomy(String title, String content, String author, String type) {
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
        if (!(o instanceof RoomNewsEconomy)) {
            return false;
        }

        RoomNewsEconomy that = (RoomNewsEconomy) o;

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
