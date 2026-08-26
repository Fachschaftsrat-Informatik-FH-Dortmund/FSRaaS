package de.fsrfb4.fb4.model;


import java.io.Serializable;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class TicketModel implements Serializable {
    private String displayName;
    private String downloadParameter;
    private LocalDate startDate;
}
