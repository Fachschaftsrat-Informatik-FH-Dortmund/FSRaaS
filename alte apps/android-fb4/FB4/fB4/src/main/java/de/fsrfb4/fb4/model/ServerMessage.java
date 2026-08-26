package de.fsrfb4.fb4.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Created by Özgür on 24.09.2016.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ServerMessage {

    private String ID;
    private int Dauerhaft;
    private String Titel;
    private String Text;
    private String Button1Text;
    private String Button2Text;
    private String Button1Action;
    private String Button2Action;
}


