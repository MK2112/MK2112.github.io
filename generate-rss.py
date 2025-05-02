#!/usr/bin/env python3
import os
import xml.dom.minidom
from bs4 import BeautifulSoup
from datetime import datetime
from rfeed import Feed, Item, Guid

BASE_URL    = "https://mk2112.github.io"
BLOG_INDEX  = "blog.html"
OUTPUT_FILE = "feed.xml"
MAX_ITEMS   = None

with open(BLOG_INDEX, encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

projects = soup.select("div.project")
items = []
for proj in projects:
    time_tag = proj.find("time", datetime=True)
    if not time_tag or not time_tag.has_attr("datetime"):
        continue
    pub_date = datetime.fromisoformat(time_tag["datetime"].replace("Z", "+00:00"))

    link_tag  = proj.find("a", href=True)
    href       = link_tag["href"]
    url        = href if href.startswith("http") else f"{BASE_URL}/{href.lstrip('./')}"
    title_tag  = link_tag.find("h2")
    title      = title_tag.get_text(strip=True) if title_tag else url

    desc_p     = proj.select_one(".blog-description p")
    description = desc_p.get_text(strip=True) if desc_p else ""

    items.append(Item(
        title       = title,
        link        = url,
        description = description,
        guid        = Guid(url),
        pubDate     = pub_date
    ))

items.sort(key=lambda it: it.pubDate, reverse=True)
if MAX_ITEMS:
    items = items[:MAX_ITEMS]

feed = Feed(title = "Blog",
            link = BASE_URL,
            description = "Posts from my blog",
            items = items)

rough_xml = feed.rss()  # this is a single long string
dom       = xml.dom.minidom.parseString(rough_xml)
pretty_xml = dom.toprettyxml(indent="  ", newl="\n", encoding="utf-8")

# minidom.toprettyxml spits out a bytes object when encoding is set
with open(OUTPUT_FILE, "wb") as f:
    f.write(pretty_xml)