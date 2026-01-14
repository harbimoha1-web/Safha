# Safha (Teller) - CLAUDE.md

**THEBOLDS Project Context**
**Last Updated**: 2026-01-14 (The Eye ULTRATHINK Audit Remediation)

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
