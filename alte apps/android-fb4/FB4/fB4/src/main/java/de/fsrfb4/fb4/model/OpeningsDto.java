package de.fsrfb4.fb4.model;

import java.time.DayOfWeek;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OpeningsDto {
    private List<Group> groups;

    @Getter
    @Setter
    public static class Group {
        private int id;
        private String title;
        private long dateStart;
        private long dateEnd;
        private List<Period> periods;
    }

    @Getter
    @Setter
    public static class Period {
        private int id;
        private String morningStartTime;
        private String morningEndTime;
        private String afternoonStartTime;
        private String afternoonEndTime;
        private int days;

        public boolean includesDay(DayOfWeek day) {
            OpeningDayFlag flag = OpeningDayFlag.fromDayOfWeek(day);
            return flag != null && (days & flag.getFlag()) != 0;
        }
    }

    public enum OpeningDayFlag {
        MONDAY(1),
        TUESDAY(2),
        WEDNESDAY(4),
        THURSDAY(8),
        FRIDAY(16),
        SATURDAY(32),
        SUNDAY(64);

        private final int flag;

        OpeningDayFlag(int flag) {
            this.flag = flag;
        }

        public int getFlag() {
            return flag;
        }

        public static OpeningDayFlag fromDayOfWeek(DayOfWeek dayOfWeek) {
            switch (dayOfWeek) {
                case MONDAY: return MONDAY;
                case TUESDAY: return TUESDAY;
                case WEDNESDAY: return WEDNESDAY;
                case THURSDAY: return THURSDAY;
                case FRIDAY: return FRIDAY;
                case SATURDAY: return SATURDAY;
                case SUNDAY: return SUNDAY;
                default: return null;
            }
        }
    }
}
