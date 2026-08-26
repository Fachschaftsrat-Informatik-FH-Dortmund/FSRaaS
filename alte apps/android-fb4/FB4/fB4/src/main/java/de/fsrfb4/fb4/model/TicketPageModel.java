package de.fsrfb4.fb4.model;

import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class TicketPageModel implements Serializable {
    private String displayName;
    private String authenticityToken;
    private TicketModel currentSemester;
    private TicketModel lastSemester;
    private TicketModel nextSemester;
}
