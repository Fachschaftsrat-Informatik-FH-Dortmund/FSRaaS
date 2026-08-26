package de.fsrfb4.fb4.util;

import androidx.annotation.Nullable;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import de.fsrfb4.fb4.model.TicketModel;
import de.fsrfb4.fb4.model.TicketPageModel;
import retrofit2.Response;

public final class HisUtil {
    private HisUtil() { }

    public static Response<String> convertLoginResponse(Response<String> response) {
        if (response.isSuccessful()) {
            try {
                String responseBody = response.body();
                Document document = Jsoup.parse(responseBody);
                Element logoutElement = document.getElementById("logoutLinkElement");
                if (logoutElement != null) {
                    return Response.success(responseBody);
                } else {
                    return Response.error(401, response.raw().body());
                }
            } catch (Exception e) {
                FirebaseCrashlytics.getInstance().log(response.body());
                FirebaseCrashlytics.getInstance().recordException(e);
                return Response.error(401, response.raw().body());
            }
        }
        return response;
    }

    public static Response<TicketPageModel> convertTicketPageResponse(Response<String> response, @Nullable String userName) {
        if (response.isSuccessful()) {
            try {
                String bodyContent = response.body();

                Document document = Jsoup.parse(bodyContent);
                Element authenticityElement = document.select("input[name=authenticity_token]").get(0);
                String authenticityToken = authenticityElement.val();
                if (authenticityToken == null || authenticityToken.isEmpty()) {
                    return Response.error(401, response.raw().body());
                }

                String displayName = userName;
                if (userName != null) {
                    Element outputInfoElement = document.getElementById("studyserviceForm:semesterticketNrwVrr:outputInfo");
                    if (outputInfoElement != null) {
                        displayName = outputInfoElement.ownText();
                        displayName = displayName.split("\\|")[0].trim();
                    }
                }

                Element ticketTableBody = document.getElementById("studyserviceForm:semesterticketNrwVrr:feeData:feeDataTable:tbody_element");
                Elements ticketTableRows = ticketTableBody.getElementsByTag("tr");
                for (int i = ticketTableRows.size() - 1; i >= 0; i--) {
                    if (!ticketTableRows.get(i).select("button[type=submit][disabled]").isEmpty()) {
                        ticketTableRows.remove(i);
                    }
                }

                TicketModel currentSemester = null;
                TicketModel lastSemester = null;
                TicketModel nextSemester = null;
                if (!ticketTableRows.isEmpty()) {
                    TicketModel firstTicket = getTicketModelFromRowElement(ticketTableRows.first());
                    TicketModel secondTicket = null;
                    if (ticketTableRows.size() > 1) {
                        secondTicket = getTicketModelFromRowElement(ticketTableRows.get(1));
                    }

                    if (firstTicket.getStartDate().isAfter(LocalDate.now()) && secondTicket != null) {
                        nextSemester = firstTicket;
                        currentSemester = secondTicket;
                    } else {
                        currentSemester = firstTicket;
                        lastSemester = secondTicket;
                    }
                }

                TicketPageModel ticketPageModel = new TicketPageModel(displayName, authenticityToken, currentSemester, lastSemester, nextSemester);
                return Response.success(ticketPageModel);
            } catch (Exception e) {
                FirebaseCrashlytics.getInstance().log(response.body());
                FirebaseCrashlytics.getInstance().recordException(e);
                return Response.error(401, response.raw().body());
            }
        }
        return Response.error(response.errorBody(), response.raw());
    }

    private static TicketModel getTicketModelFromRowElement(Element ticketElement) {
        Element firstColumn = ticketElement.getElementsByClass("column0").get(0);
        String displayName = firstColumn.ownText();

        String validityString = firstColumn.select("[id$=validity]").first().ownText();
        Pattern pattern = Pattern.compile("\\d{2}\\.\\d{2}\\.\\d{4}");
        Matcher matcher = pattern.matcher(validityString);
        LocalDate startDate = LocalDate.now();
        if (matcher.find()) {
            String startDateSting = matcher.group();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
            startDate = LocalDate.parse(startDateSting, formatter);
        }

        String downloadParameter;
        Elements buttonElements = ticketElement.select("button[type=submit]");
        if (buttonElements.isEmpty()) {
            downloadParameter = "studyserviceForm:semesterticketNrwVrr:feeData:feeDataTable:" + ticketElement.elementSiblingIndex() + ":printTicketRkuIt";
        } else {
            downloadParameter = buttonElements.get(0).attr("name");
        }

        return new TicketModel(displayName, downloadParameter, startDate);
    }

    public static Map<String, String> getFieldMapForTicketDownload(String authenticityToken, String ticketParameter) {
        Map<String, String> fieldMap = new HashMap<>();
        fieldMap.put("authenticity_token", authenticityToken);
        fieldMap.put(ticketParameter, "1");
        fieldMap.put("javax.faces.ViewState", "e2s1");
        fieldMap.put("studyserviceForm_SUBMIT", "1");

        return fieldMap;
    }
}
