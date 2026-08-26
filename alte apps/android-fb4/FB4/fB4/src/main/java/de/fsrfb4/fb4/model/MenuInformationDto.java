package de.fsrfb4.fb4.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MenuInformationDto {
    private String id;
    private MenuDto.LocalizedString name;
}
