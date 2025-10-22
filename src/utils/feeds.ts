import * as cheerio from "cheerio";
import { FeedOption } from "../models/Feed";
import Parser from "rss-parser";
import axios from "axios";

export interface ParsedFeedEntry {
  entryId: string;
  title: string;
  url: string;
  author: string | null;
  published: Date;
  summary: string | null;
}

export async function parseXml(xml: string) {
  const parser = new Parser();

  try {
    const feedData = await parser.parseString(xml);

    // Extract icon URL - try to get from feed data
    let iconUrl: string | null = null;
    if (feedData.image?.url) {
      iconUrl = feedData.image.url;
    }
    return {
      title: feedData.title || "Untitled",
      iconUrl,
    };
  } catch (error) {
    console.error("Error parsing feed XML:", error);
    return null;
  }
}

export async function parseXmlWithEntries(xml: string): Promise<{
  title: string;
  iconUrl: string | null;
  entries: ParsedFeedEntry[];
} | null> {
  const parser = new Parser();

  try {
    const feedData = await parser.parseString(xml);

    // Extract icon URL
    let iconUrl: string | null = null;
    if (feedData.image?.url) {
      iconUrl = feedData.image.url;
    }

    // Parse entries
    const entries: ParsedFeedEntry[] = (feedData.items || []).map((item) => ({
      entryId: item.guid || item.link || item.id || "",
      title: item.title || "Untitled",
      url: item.link || "",
      author: item.creator || item.author || null,
      published: item.pubDate ? new Date(item.pubDate) : new Date(),
      summary: item.contentSnippet || item.content || item.summary || null,
    }));

    return {
      title: feedData.title || "Untitled",
      iconUrl,
      entries,
    };
  } catch (error) {
    console.error("Error parsing feed XML:", error);
    return null;
  }
}

export function findFeedsInHtml(url: string, html: string): FeedOption[] {
  const $ = cheerio.load(html);
  const feeds: FeedOption[] = [];

  // Find both atom and RSS feed links
  $('link[type="application/atom+xml"], link[type="application/rss+xml"]').each(
    (_index, element) => {
      let href = $(element).attr("href");
      if (!href) return;

      // Fix relative URLs
      if (href.startsWith("/")) {
        const baseUrl = new URL(url);
        href = `${baseUrl.protocol}//${baseUrl.host}${href}`;
      }

      feeds.push({
        title: $(element).attr("title") || null,
        url: href,
      });
    },
  );

  return feeds;
}

export async function fetchFeed(url: string) {
  try {
    return await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status === 200,
    });
  } catch (error) {
    return null;
  }
}
