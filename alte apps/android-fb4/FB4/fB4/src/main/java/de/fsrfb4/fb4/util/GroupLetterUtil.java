package de.fsrfb4.fb4.util;

/**
 * @author Lars Grefer
 */
public final class GroupLetterUtil {

    private GroupLetterUtil() {
    }

    public static boolean IsInStudentSet(String GroupLetter, String studentSet) {

        if (GroupLetter.isEmpty()) {
            return true;
        }

        if (studentSet.length() == 1 && studentSet.equals(String.valueOf(GroupLetter.charAt(0)))) {
            return true;
        } else if (studentSet.length() >= 3 && studentSet.length() <= 5 && studentSet.indexOf('-') != -1) {
            String[] MinMax = studentSet.split("-");

            if (MinMax[1].substring(0, 1).equals(GroupLetter.substring(0, 1))) {
                return MinMax[1].length() == 1 || Integer.valueOf(MinMax[1].substring(1)) >= Integer.valueOf(GroupLetter.substring(1));
            } else if (MinMax[0].substring(0, 1).equals(GroupLetter.substring(0, 1))) {
                return MinMax[0].length() == 1 || Integer.valueOf(MinMax[0].substring(1)) <= Integer.valueOf(GroupLetter.substring(1));
            }

            return min(MinMax[0], GroupLetter) == MinMax[0] && max(MinMax[1], GroupLetter) == MinMax[1];
        } else {
            return false;
        }
    }

    private static <T extends Comparable<T>> T min(T first, T second) {
        return first.compareTo(second) <= 0 ? first : second;
    }


    private static <T extends Comparable<T>> T max(T first, T second) {
        return first.compareTo(second) >= 0 ? first : second;
    }
}
