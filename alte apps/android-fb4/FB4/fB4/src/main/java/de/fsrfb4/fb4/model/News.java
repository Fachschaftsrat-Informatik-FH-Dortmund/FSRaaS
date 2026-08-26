package de.fsrfb4.fb4.model;


import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import io.realm.RealmObject;
import io.realm.annotations.Ignore;
import io.realm.annotations.PrimaryKey;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class News extends RealmObject implements Serializable {
    private String title;
    private String content;
    private String author;
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    @PrimaryKey
    private long _dateTime;
    @Ignore
    private LocalDateTime dateTime;
    private boolean pinned;

    public News() {
    }

    public News(String title, String content, String author, LocalDateTime dateTime) {
        this.title = title;
        this.content = content;
        this.author = author;
        setDateTime(dateTime);
    }

    public boolean contains(String search) {
        search = search.toLowerCase();
        return title.toLowerCase().contains(search) || content.toLowerCase().contains(search) || author.toLowerCase().contains(search);
    }

    public LocalDateTime getDateTime() {
        if (dateTime == null) {
            dateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(_dateTime), ZoneId.systemDefault());
        }
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        _dateTime = dateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        this.dateTime = dateTime;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof News)) {
            return false;
        }

        News news = (News) o;

        return _dateTime == news._dateTime;
    }

    @Override
    public int hashCode() {
        return (int) (_dateTime ^ (_dateTime >>> 32));
    }
}
