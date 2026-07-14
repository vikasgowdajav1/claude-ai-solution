/**
 * Search Service — DuckDuckGo web search + RSS feed aggregation
 */

import Parser from 'rss-parser';

const rssParser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'KnowledgeBase-Bot/1.0' }
});

// Default RSS feeds (configurable via env)
const DEFAULT_RSS_FEEDS = () => {
  const feeds = process.env.RSS_FEEDS;
  if (feeds) return feeds.split(',').map(f => f.trim()).filter(Boolean);
  return [
    'https://hnrss.org/newest?q=devops',
    'https://feeds.feedburner.com/TheHackersNews',
    'https://aws.amazon.com/blogs/aws/feed/',
  ];
};

/**
 * Search DuckDuckGo using the HTML endpoint (no API key needed).
 * Returns simplified results.
 */
export async function searchDuckDuckGo(query, maxResults = 5) {
  try {
    const params = new URLSearchParams({ q: query, format: 'json', no_html: '1', skip_disambig: '1' });
    const resp = await fetch(`https://api.duckduckgo.com/?${params}`, {
      headers: { 'User-Agent': 'KnowledgeBase-Bot/1.0' },
      signal: AbortSignal.timeout(10000)
    });

    if (!resp.ok) throw new Error(`DuckDuckGo error: ${resp.status}`);

    const data = await resp.json();

    const results = [];

    // Abstract (instant answer)
    if (data.Abstract) {
      results.push({
        title: data.Heading || 'DuckDuckGo Answer',
        snippet: data.Abstract,
        url: data.AbstractURL || '',
        source: 'duckduckgo-instant'
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.slice(0, 100),
            snippet: topic.Text,
            url: topic.FirstURL || '',
            source: 'duckduckgo'
          });
        }
      }
    }

    return results.slice(0, maxResults);
  } catch (error) {
    console.warn('DuckDuckGo search failed:', error.message);
    return [];
  }
}

/**
 * Fetch and search RSS feeds for relevant content.
 */
export async function searchRSSFeeds(query, feeds, maxResults = 5) {
  const feedUrls = feeds || DEFAULT_RSS_FEEDS();
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const allItems = [];

  const feedPromises = feedUrls.map(async (url) => {
    try {
      const feed = await rssParser.parseURL(url);
      return (feed.items || []).map(item => ({
        title: item.title || '',
        snippet: (item.contentSnippet || item.content || '').slice(0, 300),
        url: item.link || '',
        pubDate: item.pubDate || item.isoDate || '',
        feedTitle: feed.title || url,
        source: 'rss'
      }));
    } catch (err) {
      console.warn(`RSS feed error (${url}):`, err.message);
      return [];
    }
  });

  const feedResults = await Promise.all(feedPromises);
  for (const items of feedResults) {
    allItems.push(...items);
  }

  // Score items by query relevance
  const scored = allItems.map(item => {
    const text = `${item.title} ${item.snippet}`.toLowerCase();
    const matchCount = queryWords.filter(w => text.includes(w)).length;
    return { ...item, relevance: matchCount / Math.max(queryWords.length, 1) };
  });

  scored.sort((a, b) => b.relevance - a.relevance);
  return scored.filter(s => s.relevance > 0).slice(0, maxResults);
}

/**
 * Combined web + RSS search.
 */
export async function searchExternal(query, options = {}) {
  const { maxResults = 8, searchWeb = true, searchRss = true, feeds } = options;

  const tasks = [];
  if (searchWeb) tasks.push(searchDuckDuckGo(query, Math.ceil(maxResults / 2)));
  if (searchRss) tasks.push(searchRSSFeeds(query, feeds, Math.ceil(maxResults / 2)));

  const results = await Promise.all(tasks);
  return results.flat().slice(0, maxResults);
}
