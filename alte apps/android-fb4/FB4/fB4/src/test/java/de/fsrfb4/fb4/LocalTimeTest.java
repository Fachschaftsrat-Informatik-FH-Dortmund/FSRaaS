package de.fsrfb4.fb4;

import org.junit.Test;

import java.time.LocalTime;

import static org.assertj.core.api.Java6Assertions.assertThat;


/**
 * @author Lars Grefer
 */
public class LocalTimeTest {

    @Test
    public void testFromString() {
        LocalTime parse = LocalTime.parse("12:34");

        assertThat(parse.getHour()).isEqualTo(12);
        assertThat(parse.getMinute()).isEqualTo(34);
    }
}
