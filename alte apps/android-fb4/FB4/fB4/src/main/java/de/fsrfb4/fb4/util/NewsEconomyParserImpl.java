package de.fsrfb4.fb4.util;

import android.text.Html;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;

import java.util.LinkedList;
import java.util.List;

import de.fsrfb4.fb4.room.RoomNewsEconomy;

public class NewsEconomyParserImpl implements NewsEconomyParser {
    public List<RoomNewsEconomy> parseNewsEconomy(String html) {
        Document document = Jsoup.parse(html);
        Elements items = document.getElementsByTag("table").get(0).getElementsByTag("tr");

        LinkedList<RoomNewsEconomy> newsList = new LinkedList<>();
        for (int i = 0; i < items.size(); i++) {
            Element item = items.get(i);
            if (item.getElementsByClass("g10").isEmpty()) {
                continue;
            }

            Element contentElement = item.getElementsByClass("g10").get(0);
            String title = Html.fromHtml(contentElement.getElementsByTag("b").get(0).child(0).ownText()).toString().trim();
            contentElement.child(0).remove();
            String content = Html.fromHtml(contentElement.html()).toString().trim();

            String author;
            if (item.child(0).hasText()) {
                author = Html.fromHtml(item.child(0).child(0).ownText()).toString().trim();
            } else {
                author = newsList.getLast().getAuthor();
            }

            String type = Html.fromHtml(((TextNode) item.child(1).child(0).childNode(0)).text()).toString().trim();

            RoomNewsEconomy newsEconomy = new RoomNewsEconomy(title, content, author, type);
            newsList.add(newsEconomy);
        }

        return newsList;
    }
}
