package de.fsrfb4.fb4.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import de.fsrfb4.fb4.model.Link;

public class LinkService {
    private final DataService dataService;

    public LinkService(DataService dataService) {
        this.dataService = dataService;
    }

    public List<Link> getLinks() {
        List<Link> links;
        String json = dataService.getLinks();
        if (json != null) {
            links = new Gson().fromJson(json, new TypeToken<List<Link>>() { }.getType());
            Collections.sort(links);
            return links;
        } else {
            return new ArrayList<>();
        }
    }

    public List<Link> getFileDownloads() {
        List<Link> links;
        String json = dataService.getFileDownloads();
        if (json != null) {
            links = new Gson().fromJson(json, new TypeToken<List<Link>>() { }.getType());
            Collections.sort(links);
            return links;
        } else {
            return new ArrayList<>();
        }
    }
}
