package de.fsrfb4.fb4.util;

import android.text.Html;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import de.fsrfb4.fb4.room.RoomNews;


public class NewsParserImpl implements NewsParser {
    public List<RoomNews> parseNews(String html) {
        String body = html.replace("<p class='title'>", "<div><p class='title'>")
            .replace("<hr", "</div><hr")
            .replaceAll("<p>\\s*<p>", "<p>");
        Document document = Jsoup.parse(body);
        Elements items = document.getElementsByClass("card");
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy - H:mm:ss");

        List<RoomNews> newsList = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            Element item = items.get(i);

            Element titleElement = item.getElementsByClass("card-header").first().child(0);
            String title = Html.fromHtml(titleElement.ownText()).toString().trim();

            Element signatureElement = item.getElementsByClass("card-footer").first();
            String author = Html.fromHtml(signatureElement.child(0).ownText()).toString().trim();

            Element contentElement = item.getElementsByClass("card-body").first();
            Elements furtherElements = item.getElementsByClass("card-further");
            String furtherLink = null;
            if (!furtherElements.isEmpty()) {
                furtherLink = furtherElements.first().attr("href").trim();
                furtherElements.remove();
            }
            String content = Html.fromHtml(contentElement.html()).toString().trim();

            if (furtherLink != null && !furtherLink.isEmpty()) {
                content += "\n\nWeitere Informationen:\n" + furtherLink;
            }

            String timeString = Html.fromHtml(signatureElement.child(2).ownText()).toString().trim();
            LocalDateTime dateTime = LocalDateTime.parse(timeString, dateTimeFormatter);

            RoomNews news = new RoomNews(title, content, author, dateTime);
            newsList.add(news);
        }

        return newsList;
    }
}
