package de.fsrfb4.fb4.room;

import androidx.room.Entity;
import androidx.room.Ignore;
import androidx.room.PrimaryKey;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity(tableName = "news")
public class RoomNews implements Serializable {
    private String title;
    private String content;
    private String author;
    @PrimaryKey
    private LocalDateTime dateTime;
    private boolean pinned;

    @Ignore
    public RoomNews(String title, String content, String author, LocalDateTime dateTime) {
        this.title = title;
        this.content = content;
        this.author = author;
        setDateTime(dateTime);
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
        if (!(o instanceof RoomNews)) {
            return false;
        }

        RoomNews news = (RoomNews) o;

        return dateTime.isEqual(news.dateTime);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(dateTime);
    }
}
