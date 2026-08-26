package de.fsrfb4.fb4.model;

import java.util.List;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MenuDto {
    private LocalizedString title;
    private List<String> type;
    private List<String> additives;
    private String category;
    private Price price;
    private String dispoId;
    private String counter;
    private int position;
    private LocalizedString counterNames;

    @Getter
    @Setter
    public static class LocalizedString {
        private String de;
        private String en;
    }

    @Getter
    @Setter
    public static class Price {
        private String student;
        private String staff;
        private String guest;
    }
}
