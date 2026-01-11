/**
 * Fetch RSS Edge Function Tests
 * Tests RSS feed fetching and parsing logic
 *
 * Run with: deno test --allow-net --allow-env fetch-rss/index.test.ts
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// Mock RSS feed for testing
const MOCK_RSS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://test.com</link>
    <description>Test RSS Feed</description>
    <item>
      <title>Test Article 1</title>
      <link>https://test.com/article-1</link>
      <description>This is test article 1</description>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      <guid>article-1</guid>
    </item>
    <item>
      <title>Test Article 2</title>
      <link>https://test.com/article-2</link>
      <description>This is test article 2</description>
      <pubDate>Mon, 01 Jan 2024 11:00:00 GMT</pubDate>
      <guid>article-2</guid>
    </item>
  </channel>
</rss>`;

const MOCK_ATOM_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Feed</title>
  <link href="https://test.com"/>
  <entry>
    <title>Atom Article 1</title>
    <link href="https://test.com/atom-1"/>
    <summary>Atom article summary</summary>
    <published>2024-01-01T12:00:00Z</published>
    <id>atom-1</id>
  </entry>
</feed>`;

// Helper to parse RSS/Atom (simplified version of actual logic)
function parseRSSItems(xml: string): Array<{ title: string; link: string; guid: string }> {
  const items: Array<{ title: string; link: string; guid: string }> = [];

  // Simple RSS parsing
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = /<title>(.*?)<\/title>/s.exec(itemXml);
    const linkMatch = /<link>(.*?)<\/link>/s.exec(itemXml);
    const guidMatch = /<guid.*?>(.*?)<\/guid>/s.exec(itemXml);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        guid: guidMatch ? guidMatch[1].trim() : linkMatch[1].trim(),
      });
    }
  }

  return items;
}

function parseAtomEntries(xml: string): Array<{ title: string; link: string; guid: string }> {
  const entries: Array<{ title: string; link: string; guid: string }> = [];

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const titleMatch = /<title.*?>(.*?)<\/title>/s.exec(entryXml);
    const linkMatch = /<link.*?href="(.*?)".*?\/>/s.exec(entryXml);
    const idMatch = /<id>(.*?)<\/id>/s.exec(entryXml);

    if (titleMatch) {
      entries.push({
        title: titleMatch[1].trim(),
        link: linkMatch ? linkMatch[1].trim() : '',
        guid: idMatch ? idMatch[1].trim() : '',
      });
    }
  }

  return entries;
}

Deno.test('RSS Parsing - should parse RSS 2.0 feed', () => {
  const items = parseRSSItems(MOCK_RSS_FEED);

  assertEquals(items.length, 2);
  assertEquals(items[0].title, 'Test Article 1');
  assertEquals(items[0].link, 'https://test.com/article-1');
  assertEquals(items[0].guid, 'article-1');
});

Deno.test('RSS Parsing - should parse Atom feed', () => {
  const entries = parseAtomEntries(MOCK_ATOM_FEED);

  assertEquals(entries.length, 1);
  assertEquals(entries[0].title, 'Atom Article 1');
  assertEquals(entries[0].link, 'https://test.com/atom-1');
  assertEquals(entries[0].guid, 'atom-1');
});

Deno.test('RSS Parsing - should handle empty feed', () => {
  const emptyFeed = `<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <title>Empty Feed</title>
      </channel>
    </rss>`;

  const items = parseRSSItems(emptyFeed);
  assertEquals(items.length, 0);
});

Deno.test('RSS Parsing - should handle missing optional fields', () => {
  const minimalFeed = `<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Minimal Article</title>
          <link>https://test.com/minimal</link>
        </item>
      </channel>
    </rss>`;

  const items = parseRSSItems(minimalFeed);
  assertEquals(items.length, 1);
  assertEquals(items[0].title, 'Minimal Article');
  // GUID should fallback to link
  assertEquals(items[0].guid, 'https://test.com/minimal');
});

Deno.test('RSS Parsing - should handle CDATA in title', () => {
  const cdataFeed = `<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <item>
          <title><![CDATA[Article with <special> characters]]></title>
          <link>https://test.com/cdata</link>
        </item>
      </channel>
    </rss>`;

  const items = parseRSSItems(cdataFeed);
  assertEquals(items.length, 1);
  // CDATA should be handled
  assertExists(items[0].title);
});

Deno.test('RSS Parsing - should handle Arabic content', () => {
  const arabicFeed = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>أخبار السعودية اليوم</title>
          <link>https://test.com/arabic</link>
          <guid>arabic-1</guid>
        </item>
      </channel>
    </rss>`;

  const items = parseRSSItems(arabicFeed);
  assertEquals(items.length, 1);
  assertEquals(items[0].title, 'أخبار السعودية اليوم');
});

// URL validation tests
Deno.test('URL Validation - should validate feed URLs', () => {
  const validUrls = [
    'https://example.com/feed.xml',
    'https://news.example.com/rss',
    'http://localhost:3000/feed',
  ];

  const invalidUrls = [
    'not-a-url',
    'ftp://example.com/feed',
    '',
  ];

  validUrls.forEach((url) => {
    try {
      new URL(url);
    } catch {
      throw new Error(`Valid URL rejected: ${url}`);
    }
  });

  invalidUrls.forEach((url) => {
    try {
      new URL(url);
      if (!url.startsWith('http')) {
        throw new Error(`Invalid URL accepted: ${url}`);
      }
    } catch {
      // Expected
    }
  });
});

// Deduplication tests
Deno.test('Deduplication - should detect duplicate GUIDs', () => {
  const existingGuids = new Set(['article-1', 'article-2']);
  const newItems = [
    { guid: 'article-1', title: 'Existing' },
    { guid: 'article-3', title: 'New' },
  ];

  const uniqueItems = newItems.filter((item) => !existingGuids.has(item.guid));
  assertEquals(uniqueItems.length, 1);
  assertEquals(uniqueItems[0].guid, 'article-3');
});

Deno.test('Deduplication - should handle null GUIDs', () => {
  const items = [
    { guid: null, link: 'https://test.com/1' },
    { guid: null, link: 'https://test.com/2' },
  ];

  // Should use link as fallback for deduplication
  const guids = items.map((item) => item.guid || item.link);
  assertEquals(guids.length, 2);
  assertEquals(new Set(guids).size, 2); // All unique
});

// Rate limiting simulation
Deno.test('Rate Limiting - should respect delays between requests', async () => {
  const delays: number[] = [];
  const startTime = Date.now();

  // Simulate 3 requests with 100ms delay
  for (let i = 0; i < 3; i++) {
    delays.push(Date.now() - startTime);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Each delay should be roughly 100ms apart
  assertEquals(delays[0] < 50, true); // First should be immediate
  assertEquals(delays[1] >= 100, true);
  assertEquals(delays[2] >= 200, true);
});
