# Safha (Teller) - CLAUDE.md

**THEBOLDS Project Context**
**Last Updated**: 2026-01-15 (The Eye ULTRATHINK Audit - Topic Pipeline Fix)

---

## Quick Start

### THEBOLDS Commands
```
/thebolds     Full company activation (CEO orchestrates all departments)
/manager      CEO m7zm (task breakdown, decisions, strategic calls)
/design       Bee (UI/UX, visual hierarchy, accessibility)
/hormozi      Business strategy (offers, pricing, value equation)
/steve        Mobile development (React Native, iOS, Android)
/saad         Saudi compliance & localization
/majnon       Psychology & behavioral science
/the-eye      Audit (quality, accountability, patterns)
```

### Deployed on This Project
| Department | Head | Active | Role Here |
|------------|------|--------|-----------|
| CEO | m7zm | Yes | Task breakdown, decisions |
| Design | Bee | Yes | UI/UX, Arabic RTL, swipe UX |
| Business | Hormozi | Yes | Subscription offers, pricing |
| Mobile | Steve | Yes | React Native/Expo development |
| Saudi Ops | Saad | Yes | Arabic localization, Saudi market |
| Psychology | majnon | Yes | User behavior, engagement |
| Audit | The Eye | Yes | Quality verification |

---

## Project Overview

**What**: Teller - Saudi News App with TikTok-style vertical swipe feed
**Stack**: React Native / Expo
**Target Market**: Saudi professionals who want news in 5 minutes
**Language**: Arabic-first with English support

---

## THEBOLDS Knowledge Links

### Global Resources
- **Skills**: `C:\Users\TechTroniX\thebolds\` (full skill library)
- **Global Lessons**: `C:\Users\TechTroniX\.claude\lessons-learned.md`

### Project Files
- **Operational Briefing**: `.manager-briefing.md` (current sprint, blockers, session log)
- **This File**: Project context and lessons

---

## Project-Specific Lessons

Lessons learned on THIS project. Synced to global lessons-learned.md.

### Active Lessons
| ID | Lesson | Category | Date | Synced to Global |
|----|--------|----------|------|------------------|
| SAFHA-001 | Never use fake social proof - Mohammad immediately rejects dishonesty | Business | 2026-01-12 | Yes (AP001) |
| SAFHA-002 | Pricing must be consistent everywhere (value stack, buttons, payment) | Design | 2026-01-12 | Pending |
| SAFHA-003 | Always test RSS URLs before adding - many return 404/403 or are blocked by Cloudflare | Backend | 2026-01-15 | Pending |
| SAFHA-004 | Use Google News RSS as workaround for sites that block direct RSS access | Backend | 2026-01-15 | Pending |
| SAFHA-005 | Two tables exist: `sources` (display) vs `rss_sources` (RSS URLs for backend) - don't confuse them | Backend | 2026-01-15 | Pending |
| SAFHA-006 | Use wsrv.nl server-side blur for Spotify-style backgrounds - no client dependencies needed | Frontend | 2026-01-14 | Pending |
| SAFHA-007 | Extract videos from article HTML not just RSS - og:video, twitter:player, iframes, video tags | Backend | 2026-01-14 | Pending |
| SAFHA-008 | Use `createLogger()` from lib/debug.ts for all logging - auto-suppressed in production | Code Quality | 2026-01-14 | Pending |
| SAFHA-009 | All interactive elements need bilingual accessibility labels (en/ar) with accessibilityRole | Accessibility | 2026-01-14 | Pending |
| SAFHA-010 | Never use raw console.* in client code - causes data leakage, bundle bloat, perf issues | Code Quality | 2026-01-14 | Pending |
| SAFHA-011 | Explore vs Interests modes need different queries - Explore=all stories, Interests=unseen only | Frontend | 2026-01-15 | Pending |
| SAFHA-012 | Use local font files (assets/fonts/) instead of @expo-google-fonts for offline reliability | Frontend | 2026-01-15 | Pending |
| SAFHA-013 | app.json web output "single" not "static" to prevent SSR crashes with AsyncStorage | Config | 2026-01-15 | Pending |
| SAFHA-014 | Empty state messages must consider feedMode - Explore has no topic filtering | Frontend | 2026-01-15 | Pending |
| SAFHA-015 | Migrations must be manually run in Supabase SQL Editor - they don't auto-apply to production | Backend | 2026-01-15 | Pending |
| SAFHA-016 | Edge Functions need CLAUDE_API_KEY + FUNCTION_SECRET secrets set in Supabase Dashboard | Backend | 2026-01-15 | Pending |
| SAFHA-017 | Cron jobs need FUNCTION_SECRET header for pg_net HTTP auth - service role key can't be set directly | Backend | 2026-01-15 | Pending |
| SAFHA-018 | RSS sources deactivated during testing remain `is_active=false` - always verify active count | Backend | 2026-01-15 | Pending |
| SAFHA-019 | 32 Arabic + 14 English sources verified working (46 total) - 32 broken sources (404/403/timeout) | Backend | 2026-01-15 | Pending |
| SAFHA-020 | 16 user interests confirmed - use topic_ids array to link RSS sources to interests | Backend | 2026-01-15 | Pending |
| SAFHA-021 | RSS source topic_ids must flow through pipeline: rss_sources → raw_articles → stories | Backend | 2026-01-15 | Pending |

### Lesson Details

#### SAFHA-001: Never Use Fake Social Proof
- **Context**: Subscription page had "32,000+ professionals" claim with no basis
- **Lesson**: Mohammad values honesty above conversion. Use real value props instead.
- **Recorded By**: The Eye
- **Global ID**: AP001

#### SAFHA-002: Pricing Consistency is Non-Negotiable
- **Context**: Page showed SAR 16 in value stack but SAR 25 on button. Confusing.
- **Lesson**: All price references must match. One source of truth for pricing.
- **Recorded By**: m7zm
- **Global ID**: _Pending sync_

#### SAFHA-003: Always Test RSS URLs Before Adding
- **Context**: Added 73 Arabic RSS sources, but 42 were broken (404/403/timeout/Cloudflare blocked)
- **Lesson**: Always curl-test RSS URLs before adding to database. Many sites block automated requests.
- **Recorded By**: Claude
- **Global ID**: _Pending sync_

#### SAFHA-004: Google News RSS Workaround
- **Context**: Major Arabic news sites (Al Arabiya, Al Jazeera, Sky News) block direct RSS access
- **Lesson**: Use `https://news.google.com/rss/search?q=site:DOMAIN&hl=ar&gl=SA&ceid=SA:ar` as workaround
- **Working Sources via Google News**: العربية, الجزيرة, سكاي نيوز, الشرق الأوسط, كورة, فيلجول, MBC
- **Recorded By**: Claude
- **Global ID**: _Pending sync_

#### SAFHA-005: Sources vs RSS Sources Tables
- **Context**: App showed sources but feed was empty - `rss_sources` table was empty
- **Lesson**: `sources` table is for display/UI, `rss_sources` table is for RSS fetching backend. Both need data.
- **Recorded By**: Claude
- **Global ID**: _Pending sync_

#### SAFHA-006: wsrv.nl Server-Side Blur
- **Context**: Images were zoomed too much with `fit=cover`. Needed Spotify-style blurred background.
- **Lesson**: Use wsrv.nl `&blur=15` parameter for server-side blur. No need for expo-blur or client-side processing.
- **Pattern**: Blurred background (cover) + Sharp foreground (contain) = full image with no empty edges
- **Recorded By**: Claude
- **Global ID**: _Pending sync_

#### SAFHA-007: Extract Videos from HTML
- **Context**: RSS feeds rarely include video URLs. Articles with embedded videos were missed.
- **Lesson**: Scan article HTML for videos: og:video meta, twitter:player, `<video>` tags, `<iframe>` embeds
- **Platforms**: YouTube, Vimeo, Dailymotion, direct MP4
- **Priority**: Webpage video > RSS video (HTML is more reliable)
- **Recorded By**: Claude
- **Global ID**: _Pending sync_

#### SAFHA-008: Use createLogger() for All Logging
- **Context**: The Eye audit found 150+ console.* statements leaking data in production
- **Lesson**: Import `createLogger` from `lib/debug.ts` and use `log.debug/info/warn/error` instead of console.*
- **Pattern**:
  ```typescript
  import { createLogger } from '@/lib/debug';
  const log = createLogger('ComponentName');
  log.debug('message');  // Suppressed in production
  log.error('error');    // Always shown (errors are important)
  ```
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-009: Bilingual Accessibility Labels Required
- **Context**: StoryCard buttons had no screen reader support - failed accessibility audit
- **Lesson**: Every TouchableOpacity needs `accessibilityRole="button"` and bilingual `accessibilityLabel`
- **Pattern**:
  ```tsx
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={isArabic ? 'حفظ الخبر' : 'Save story'}
  >
  ```
- **Components Fixed**: StoryCard (save, share, menu, AI summary, modal)
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-010: No Raw Console Statements in Client Code
- **Context**: Production app was logging user data, API responses, and debug info to console
- **Lesson**: Raw console.* causes: (1) Data leakage, (2) Bundle bloat, (3) Performance hit
- **Fix**: Use lib/debug.ts which checks `__DEV__` and suppresses in production
- **Exception**: Edge Functions (Deno) have separate logging strategy
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-011: Explore vs Interests Query Selection (Two-Layer Fix)
- **Context**: Explore feed showed 0 stories even after switching to regularQuery
- **Lesson**: TWO layers of filtering existed - both needed to be addressed
  1. **Layer 1 (feed.tsx:109)**: Query selection - Explore should use `regularQuery`
  2. **Layer 2 (useStories.ts:24-27)**: `localHistory` filter - skip for logged-in users
- **Fix 1**: `activeQuery = (user && feedMode === 'interests') ? unseenQuery : regularQuery`
- **Fix 2**: In useStories, only filter localHistory for anonymous users: `if (!user) { filter }`
- **Files**: `app/(tabs)/feed.tsx` line 109, `hooks/useStories.ts` lines 24-27
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-012: Use Local Font Files
- **Context**: @expo-google-fonts/tajawal required network to load fonts, failed on hotspot
- **Lesson**: Use local fonts in `assets/fonts/` for offline reliability
- **Fix**: `require('../assets/fonts/Tajawal-*.ttf')` instead of npm package imports
- **File**: `app/_layout.tsx` lines 209-213
- **Recorded By**: Claude
- **Global ID**: _Pending sync_

#### SAFHA-013: Web Output Config for SSR
- **Context**: `"output": "static"` in app.json caused SSR which crashed on AsyncStorage
- **Lesson**: Use `"output": "single"` to prevent SSR when using React Native storage libs
- **File**: `app.json` line 57
- **Recorded By**: Claude
- **Global ID**: _Pending sync_

#### SAFHA-014: Empty State Must Consider feedMode
- **Context**: Explore mode showed "No stories for this topic" but Explore has NO topic filtering
- **Lesson**: Empty state messages must consider `feedMode`, not just auth state
- **Fix**: Added `feedMode === 'explore'` check to show appropriate messages:
  - Explore: "No stories available" / "لا توجد أخبار متاحة"
  - Interests: "No stories for this topic" / "لا توجد أخبار لهذا الموضوع"
- **File**: `app/(tabs)/feed.tsx` lines 494-512
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-015: Migrations Don't Auto-Apply to Production
- **Context**: `rss_sources` table was empty despite migrations existing in codebase
- **Lesson**: Supabase migrations in `supabase/migrations/` must be manually run in SQL Editor
- **Root Cause**: Migrations created locally were never applied to production database
- **Pipeline Break**:
  1. `rss_sources` empty → fetch-rss has nothing to fetch
  2. `raw_articles` empty → process-articles has nothing to process
  3. No new stories created
- **Fix**: Run migration SQL manually in Supabase Dashboard > SQL Editor
- **Also Required**:
  - `CLAUDE_API_KEY` in Edge Function secrets
  - `app.settings.service_role_key` in database for cron auth
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-016: Edge Function Secrets Required
- **Context**: process-articles returning "Unauthorized" despite having data
- **Lesson**: Edge Functions need secrets set in Supabase Dashboard > Edge Functions > Manage Secrets
- **Required Secrets**:
  - `CLAUDE_API_KEY` - for AI summarization
  - `FUNCTION_SECRET` - for manual/cron authentication (e.g., `safha-process-articles-secret-2026`)
- **Note**: `SUPABASE_SERVICE_ROLE_KEY` is auto-set by Supabase (reserved, can't modify)
- **Test Command**:
  ```bash
  curl -X POST "https://PROJECT.supabase.co/functions/v1/process-articles" \
    -H "x-function-secret: YOUR_FUNCTION_SECRET" \
    -H "Authorization: Bearer JWT_SERVICE_KEY" \
    -d '{"limit": 2}'
  ```
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-017: Cron Jobs Need FUNCTION_SECRET for HTTP Auth
- **Context**: pg_net can't use `app.settings.service_role_key` - permission denied
- **Lesson**: Use custom FUNCTION_SECRET header for cron job authentication
- **Fix**: Add `x-function-secret` header to all cron HTTP calls
- **Pattern**:
  ```sql
  SELECT net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/process-articles',
    headers := jsonb_build_object(
      'x-function-secret', 'safha-process-articles-secret-2026'
    )
  )
  ```
- **Note**: SUPABASE_SERVICE_ROLE_KEY is reserved and can't be modified
- **File**: `supabase/CRON_JOBS.sql`
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-018: RSS Sources Deactivated During Testing
- **Context**: User asked "why only 10 active sources?" after adding 50+
- **Lesson**: Sources tested during RSS URL verification were disabled if broken
- **What Happened**:
  1. Added 73 sources (50+ Arabic, 20+ English)
  2. Curl-tested each URL for validity
  3. 42 Arabic sources returned 404/403/Cloudflare blocks
  4. 10 English sources returned errors
  5. Disabled via migrations: `UPDATE rss_sources SET is_active = false`
- **Result**: ~20-30 sources remain active (Google News feeds + verified English)
- **Important**: Sources still exist in DB, just marked `is_active = false`
- **To Re-enable**: `UPDATE rss_sources SET is_active = true WHERE is_active = false;`
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-019: RSS Source Verification Results (2026-01-15)
- **Context**: Comprehensive testing of all 78 RSS sources
- **Working Sources (46 total)**:
  - **Arabic (32)**: BBC Arabic, Al Jazeera (Google), Al Arabiya (Google), Sky News (Google), France 24, DW, RT, Al Quds, Sabq, Okaz, AlWatan, AlYaum, Ajel, Akhbaar24, Tech-wd, AIT News, Arab Hardware, Saudi Tech, Saudi Gamer, Kooora (Google), FilGoal (Google), Yalla Kora, CNBC Arabia, Rotana, MBC (Google), Hi Magazine, Fustany, Atyab Tabkha, WebTeb, Sehatok, Daily Medical Info, NASA Arabic, Arab GT, Sayarah, Turbo
  - **English (14)**: Al Jazeera EN, BBC EN, TechCrunch, The Verge, ESPN, Variety, Nature, IGN, Kotaku, Bon Appetit
- **Broken Sources (32 total)**:
  - 28 Arabic: AlRiyadh (404), AlMadina (403), Aleqt (404), Argaam (500), Arriyadiyah (404), Sport360 (404), SPL (404), Layalina (404), Sayidaty (404), Fatafeat (404), Altibbi (404), Edraak (404), Rwaq (404), Arageek (404), Jamalouki (404), Cookpad (404), Mubasher (403), Forbes ME (404), plus 5 timeouts
  - 4 English: Reuters (404), CNBC (403), Scientific American (timeout), Motor1 (404)
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-020: User's 16 Confirmed Interests with Topic Slugs
- **Context**: User corrected initial assumption of 23+ topics - confirmed exactly 16 active interests
- **Lesson**: Always verify user's actual interests before adding RSS sources. Use `topic_ids` UUID[] array to link.
- **The 16 Interests (with topic slugs)**:
  | # | Interest | Topic Slug |
  |---|----------|------------|
  | 1 | Politics | `politics` |
  | 2 | Business & Economy | `economy` |
  | 3 | Sports | `sports` |
  | 4 | Technology | `technology` |
  | 5 | Science | `science` |
  | 6 | Travel | `travel` |
  | 7 | Shows | `shows` |
  | 8 | Comedy | `comedy` |
  | 9 | Anime | `anime-comics` |
  | 10 | Beauty Care | `beauty-style` |
  | 11 | Games | `gaming` |
  | 12 | Cars | `auto-vehicle` |
  | 13 | Food | `food-drink` |
  | 14 | Animals | `pets` |
  | 15 | Fitness & Health | `fitness-health` |
  | 16 | Education | `education` |
- **Note**: Science and Education are separate topics (not combined)
- **Migration**: `20260115000020_add_google_news_feeds_16_interests.sql` (22 Google News feeds)
- **Pattern**:
  ```sql
  -- Get topic ID
  SELECT id INTO tid_sports FROM topics WHERE slug = 'sports';
  -- Link RSS source to topic
  INSERT INTO rss_sources (..., topic_ids) VALUES (..., ARRAY[tid_sports]);
  ```
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

#### SAFHA-021: Topic Pipeline Must Flow End-to-End
- **Context**: Added 22 Google News feeds with topic_ids, but stories weren't getting correct topics
- **Root Cause**: Pipeline had a critical gap:
  1. `rss_sources.topic_ids` was set correctly (22 feeds with topics)
  2. `fetch-rss` ignored topic_ids when inserting to `raw_articles`
  3. `process-articles` only used AI-generated topics, ignoring RSS source topics
- **Fix Applied**:
  1. Added `topic_ids` column to `raw_articles` table
  2. Updated `fetch-rss` to copy `source.topic_ids` to `raw_articles.topic_ids`
  3. Updated `process-articles` to merge RSS topic_ids with AI-generated topics
- **Correct Flow**:
  ```
  rss_sources.topic_ids → fetch-rss → raw_articles.topic_ids → process-articles → stories.topic_ids
  ```
- **Files Modified**:
  - `supabase/functions/fetch-rss/index.ts` (line 932)
  - `supabase/functions/process-articles/index.ts` (lines 298-310)
  - `supabase/migrations/20260115000021_add_topic_ids_to_raw_articles.sql`
- **Lesson**: When adding metadata to sources, verify it flows through the entire pipeline to the final output.
- **Recorded By**: The Eye
- **Global ID**: _Pending sync_

---

## Project Decisions

Major decisions that shape this project.

| Decision | Rationale | Made By | Date |
|----------|-----------|---------|------|
| 30-day free trial (not 7) | More generous = more conversions, builds trust | Mohammad | 2026-01 |
| SAR 16/month pricing | Accessible for Saudi market, perceived as fair | Mohammad | 2026-01 |
| "5 minutes" positioning | Clear, honest, measurable promise | Hormozi + Mohammad | 2026-01 |
| No fake metrics | Integrity first, even if lower initial conversion | Mohammad | 2026-01 |

---

## Project Standards

### Code Standards
- React Native / Expo patterns
- TypeScript strict mode
- Arabic RTL-first design

### Design Standards
- TikTok-style vertical swipe
- Arabic typography prioritized
- Dark mode support

### Quality Bar
- Subscription flow: Must feel effortless
- Arabic: Native-quality translations, not Google Translate
- Performance: Smooth 60fps scrolling

---

## Relevant Global Lessons

Lessons from other projects that apply here:

| Global ID | Lesson | Why Relevant |
|-----------|--------|--------------|
| AP001 | No fake social proof | Direct - learned on this project |

---

## The Eye Observations

Audit findings and accountability notes for this project:

| Date | Observation | Severity | Status |
|------|-------------|----------|--------|
| 2026-01-12 | Pricing inconsistency (SAR 16 vs 25) caught | Medium | Resolved |
| 2026-01-12 | Fake social proof "32,000+" flagged | Critical | Resolved |
| 2026-01-15 | 73 Arabic RSS URLs added without testing - 42 were broken | High | Resolved |
| 2026-01-15 | `rss_sources` table was empty causing no stories | Critical | Resolved |
| 2026-01-15 | 10 English RSS sources broken (404/403/timeout) | Medium | Resolved |
| 2026-01-14 | Images zoomed too much with cover mode - quality loss | Medium | Resolved |
| 2026-01-14 | Videos in article HTML not being extracted | Medium | Resolved |
| 2026-01-14 | 150+ console.* statements in production code - data leakage risk | Critical | Resolved |
| 2026-01-14 | StoryCard buttons missing accessibility labels | High | Resolved |
| 2026-01-14 | SQL injection risk in fetch-rss via string interpolation | Critical | Resolved |
| 2026-01-14 | CORS set to `*` in edge function - too permissive | High | Resolved |
| 2026-01-14 | 275 temp files (tmpclaude-*) polluting repository | Low | Resolved |
| 2026-01-15 | Explore feed had TWO filter layers blocking stories (unseenQuery + localHistory) | High | Resolved |
| 2026-01-15 | @expo-google-fonts required network - failed on hotspot | Medium | Resolved |
| 2026-01-15 | app.json "output": "static" caused SSR crash with AsyncStorage | High | Resolved |
| 2026-01-15 | Windows Firewall blocking Expo Metro server on port 8081 | Medium | Resolved |
| 2026-01-15 | Explore empty state said "No stories for this topic" but Explore has no topic filter | Medium | Resolved |
| 2026-01-15 | RSS pipeline not processing - CLAUDE_API_KEY + FUNCTION_SECRET needed in Edge Function secrets | Critical | Resolved |
| 2026-01-15 | process-articles cron job was NEVER set up - only fetch-rss was running | Critical | Resolved |
| 2026-01-15 | pg_net can't use app.settings.service_role_key directly - needs FUNCTION_SECRET header | High | Resolved |
| 2026-01-15 | 50+ sources added but 52 disabled during testing (42 Arabic + 10 English broken URLs) | High | Documented |
| 2026-01-15 | Comprehensive RSS test: 46 working (32 AR + 14 EN), 32 broken (28 AR + 4 EN) | Medium | Verified |
| 2026-01-15 | User corrected topic list from 23+ to exactly 16 interests - always verify user's actual config | High | Resolved |
| 2026-01-15 | 22 Google News feeds added for 16 interests with proper topic_ids linking | Medium | Completed |
| 2026-01-15 | Topic pipeline broken: rss_sources.topic_ids never flowed to stories - critical gap fixed | Critical | Fixed |

---

## Sync Protocol

### Syncing Local Lessons to Global
1. When lesson is mature (validated on this project)
2. m7zm or The Eye adds to `C:\Users\TechTroniX\.claude\lessons-learned.md`
3. Update this file with Global ID
4. Mark as "Synced: Yes"

### Pulling Relevant Global Lessons
1. When starting major work on project
2. Review global lessons-learned.md for relevant insights
3. Add to "Relevant Global Lessons" section above
