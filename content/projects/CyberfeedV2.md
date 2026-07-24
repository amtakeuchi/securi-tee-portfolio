---
title: CyberfeedV2
category: Python Projects
thumbnail: /uploads/cyberfeed_v2_dashboard.png
description: 'A personal intelligence dashboard that pulls from 37+ RSS feeds across cybersecurity, tech, finance, and world news, scores every article by importance, and lets you filter by topic, region, and time. Built with Python and Flask, runs locally, and optionally uses Claude''s API to generate 2-sentence summaries for each article. Went from checking a dozen news sites daily to scanning everything that matters in 10 minutes flat.'
repoLink: 'https://github.com/amtakeuchi/cyberfeed_v2'
date: 2026-03-01T00:00:00.000Z
featured: true
track: tooling
proof: 'a dozen sites daily · down to 10 minutes flat'
cardTitle: 'cyberfeed v2: a personal intelligence dashboard'
---

I spend a lot of time reading the news. Cybersecurity news, tech news, finance, world events, Canadian headlines. If you work in cybersecurity (or honestly any tech field), staying current isn't optional. The threat landscape changes daily. New vulnerabilities drop. Breaches happen. Markets shift. Geopolitical events reshape the attack surface overnight. You need to know what's going on.

The problem is that "staying current" used to eat 45 minutes to an hour of my day. I'd open BleepingComputer, then Krebs, then The Hacker News, then Dark Reading, then BBC, then a handful of finance sites, then whatever else caught my attention. Half the time I'd see the same story repeated across three different outlets. The other half I'd get sucked into a rabbit hole on one site and forget to check the others.

So I built something to fix it.

## What CyberFeed Actually Is

CyberFeed is a local web application that pulls articles from over 30 RSS feeds, cleans up the content, scores each article by importance, and displays everything in a single filterable feed that I open once in the morning and once in the afternoon.

It runs on my machine at localhost. I open a browser tab, and everything I need to see is right there. No accounts, no subscriptions, no algorithms deciding what I should care about. Just the news, ranked by what actually matters.

Here's what it looks like in practice: I wake up, open CyberFeed, click "Hot" to see the highest priority stories from the last few hours, scan through 10 to 15 articles in about 5 minutes, click through to the 2 or 3 that are worth reading in full, and I'm done. What used to take 45 minutes now takes 10.

## The Version 1 Story

I'll be honest. The first version of this thing was rough. I built it with ChatGPT's help, and it worked, but barely. Articles were grouped by source instead of mixed together, so I'd have to scroll through an entire block of BleepingComputer articles before seeing anything from Krebs. The content was full of raw HTML tags and jumbled text. There was no filtering. No sorting. No way to see what was actually important versus what was noise.

It did the job of pulling RSS feeds into one page, but it wasn't something I actually enjoyed using. I found myself going back to manually checking sites because the tool I built to save time was creating its own friction.

## What Changed in Version 2

I rebuilt the entire thing from scratch. Not a tweak or an update. A full rewrite with a completely different approach to how articles are collected, processed, and displayed.

Here's what's different:

* Everything is mixed and sorted by time. Articles from all 30+ feeds get thrown into one pool and sorted chronologically. The most recent story shows up first, regardless of which outlet published it. This sounds simple, but it completely changes how you consume the feed. You're seeing a real timeline of what's happening across every source at once.
* Content is actually readable. RSS feeds are messy. The raw summary fields contain HTML tags, encoded characters, and all kinds of formatting garbage. Version 2 strips all of that out and gives you a clean 2 to 3 sentence preview for every article. You can scan it and decide whether to click through without decoding HTML in your head.
* Importance scoring puts the best stuff at the top. Every article gets a score based on three things: how authoritative the source is (Krebs and BBC score higher than smaller blogs), whether the headline or content contains high-signal keywords (like "zero-day," "actively exploited," or "data breach"), and how recently it was published. Three sort modes let you control the ranking:
  * "Hot" combines importance with recency. Best for your morning check.
  * "New" is pure chronological. Most recent first, no ranking.
  * "Top" is pure importance regardless of when it was published. Best for catching up after a day or two away.
* Filtering by topic, region, and time. Filter buttons let you narrow the feed by category (Cybersecurity, Technology, Finance, Crypto, World News, Canada), by region (Africa, Asia, Australia, Central/South America, Europe, Global, North America), and by time window (1 hour, 6 hours, today, 24 hours, 48 hours, week, month). All three filters work together, so you can do things like "Cybersecurity + Asia + Last 24 hours" in two clicks.
* Parallel fetching. Version 1 fetched feeds one at a time, which meant waiting 30 to 45 seconds for the page to load. Version 2 fetches all 30+ feeds simultaneously using Python's ThreadPoolExecutor. Load time dropped to about 3 to 5 seconds.
* Deduplication. When a major story breaks, it shows up in 5 different feeds. Version 2 catches duplicates by comparing titles and only shows each story once.
* Smart caching. Articles are cached for 15 minutes so you're not hammering RSS servers every time you refresh the page. A manual refresh button lets you force a re-fetch when you want the absolute latest.
* Optional AI summarization. If you plug in a Claude API key, every article gets a 2-sentence AI summary that highlights the key facts. The summaries are cached locally so you never pay to re-summarize the same article. At daily use, the cost is well under a dollar per month. The feed works perfectly fine without it though.
* Time filtering. A row of time buttons lets you scope the feed to articles from the last hour, 6 hours, today, 24 hours, 48 hours, week, or month. All filters work together, so "Cybersecurity + Asia + Last 24 hours" is two clicks away.
* Collapsible filter bar. The filter panel was taking up half the screen on smaller displays, so I made it collapsible. One button toggles it open and closed, and it remembers your preference between sessions. When it's collapsed, the header is just the logo, search bar, and a filters button. Maximum screen space for actually reading articles.

## How It Works Under the Hood

The tech stack is deliberately simple. Python, Flask, and three pip dependencies. No database. No JavaScript frameworks. No build tools. Four files total.

When you load the page, Flask triggers a fetch of all configured RSS feeds in parallel. Each feed gets parsed with Python's feedparser library. Articles are extracted with their title, content, publication date, source name, category, and region. Raw HTML in the content fields gets stripped and decoded. Dates are normalized into timezone-aware datetime objects (this was a bigger headache than it sounds, because every RSS feed uses a slightly different date format, and mixing timezone-aware and timezone-naive datetimes crashes Python's sort function).

After collection, articles are deduplicated by title similarity, scored for importance, and sorted based on whatever mode you've selected. The results are passed to a Jinja2 template that renders the feed with all the filter controls, search bar, and sort buttons.

If the Claude API key is set, filtered articles are batched (up to 20 at a time) and sent to Claude Haiku for summarization. Summaries come back as a JSON array and get cached to a local file keyed by article hash. Next time you see that article, the summary loads from cache instead of hitting the API again.

## Problems I Ran Into (and How I Fixed Them)

* **The timezone crash.** This was the first bug I hit when testing version 2. Some RSS feeds include timezone info in their dates (like "+0000" or "EST") and others just give you a bare date with no timezone attached. Python can't compare the two types, so the sort function threw a TypeError. The fix was simple once I understood the problem: normalize every date to UTC timezone-aware on ingestion, regardless of what the feed provides. If the feed doesn't specify a timezone, default to UTC.
* **Dead RSS feeds.** I had Reuters feeds configured that no longer exist. Reuters shut down their public RSS endpoints. The app handled it gracefully (just logged a warning and moved on), but I replaced them with working alternatives from Yahoo Finance and CNBC.
* **The Hacker News not appearing.** I had two feed URLs pointing to the same source (a direct Blogger URL and a Feedburner URL), and the deduplication logic was catching them. Consolidating to a single URL fixed it.
* **Sequential fetching being painfully slow.** The original version fetched feeds one at a time. With 30+ feeds and a 10-second timeout per feed, worst case load time was over 5 minutes. Switching to parallel fetching with a thread pool brought that down to single-digit seconds.

## What I'd Build Next

There are a few features on the roadmap that I haven't gotten to yet:

* Article bookmarking would let me save important articles to a local file with one click instead of relying on browser bookmarks that I never go back to.
* Auto-refresh would silently re-fetch in the background on a timer, so the feed stays current without me manually hitting refresh.
* Read/unread tracking would let me mark articles as read so I don't re-scan the same stories every time I open the page.
* Custom keyword alerts would notify me when specific terms appear in new articles. Useful for tracking specific threat actors, vulnerabilities, or companies.

## Why I Built It This Way

I could have used an off-the-shelf RSS reader. Feedly exists. Inoreader exists. But they all have the same problem: they're someone else's tool built for a general audience. They don't score articles by cybersecurity relevance. They don't have my source tier rankings. They don't filter by geopolitical region. They don't integrate with Claude for summarization.

Building my own tool means I control exactly what it does and how it does it. When I want a new feature, I add it. When a feed dies, I swap it out. When my priorities change, I adjust the scoring weights. The tool evolves with me instead of me adapting to someone else's product decisions.

It also forced me to solve real engineering problems. Date normalization, parallel processing, caching strategy, content cleaning, scoring algorithms. None of it is rocket science, but all of it is practical experience that transfers directly to the kind of work I do in cybersecurity. Building tools to solve your own problems is one of the best ways to sharpen your skills.

## Try It Yourself

The full source code is on my GitHub. It's four files, three pip dependencies, and runs on any machine with Python installed. Clone it, run python app.py, and you've got your own personal intelligence dashboard in about 60 seconds.

If you want to add your own feeds, just edit the feeds list in app.py and the UI adapts automatically. No frontend changes needed.

If you build on it or have ideas for improvements, I'd love to hear about it. Reach out through my contact page or find me on X.
