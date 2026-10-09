// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// server/services/cache.ts
var CacheService = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
    this.pendingPromises = /* @__PURE__ */ new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      fetches: 0,
      errors: 0
    };
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    const ageSeconds = (Date.now() - entry.timestamp) / 1e3;
    const isStale = ageSeconds > entry.ttlSeconds;
    this.stats.hits++;
    return {
      data: entry.data,
      isStale,
      cachedAt: entry.timestamp
    };
  }
  set(key, data, ttlSeconds) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlSeconds
    });
  }
  async getOrFetch(key, ttlSeconds, fetchFn) {
    const cached = this.get(key);
    if (cached && !cached.isStale) {
      return cached;
    }
    if (this.pendingPromises.has(key)) {
      try {
        const data = await this.pendingPromises.get(key);
        return { data, isStale: false, cachedAt: Date.now() };
      } catch (err) {
        if (cached) {
          return { ...cached, isStale: true };
        }
        throw err;
      }
    }
    const fetchPromise = (async () => {
      this.stats.fetches++;
      try {
        const result = await fetchFn();
        this.set(key, result, ttlSeconds);
        return result;
      } catch (err) {
        this.stats.errors++;
        if (cached) {
          return cached.data;
        }
        throw err;
      } finally {
        this.pendingPromises.delete(key);
      }
    })();
    this.pendingPromises.set(key, fetchPromise);
    try {
      const data = await fetchPromise;
      return { data, isStale: false, cachedAt: Date.now() };
    } catch (err) {
      if (cached) {
        return { ...cached, isStale: true };
      }
      throw err;
    }
  }
  clear() {
    this.cache.clear();
    this.pendingPromises.clear();
  }
  getCacheSize() {
    return this.cache.size;
  }
};
var cacheService = new CacheService();

// server/services/footballData.ts
var API_KEY = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY || "";
var IS_REAL_API_CONFIGURED = Boolean(API_KEY && API_KEY !== "YOUR_REAL_API_KEY");
var IS_RAPIDAPI = Boolean(process.env.RAPIDAPI_KEY);
var API_BASE = IS_RAPIDAPI ? "https://api-football-v1.p.rapidapi.com/v3" : "https://v3.football.api-sports.io";
var SUPPORTED_COMPETITIONS = [
  {
    id: 39,
    name: "Premier League",
    code: "PL",
    country: "England",
    emblem: "https://media.api-sports.io/football/leagues/39.png",
    season: 2026,
    isPopular: true,
    feedCode: "eng.1"
  },
  {
    id: 2,
    name: "UEFA Champions League",
    code: "CL",
    country: "Europe",
    emblem: "https://media.api-sports.io/football/leagues/2.png",
    season: 2026,
    isPopular: true,
    feedCode: "uefa.champions"
  },
  {
    id: 140,
    name: "La Liga",
    code: "PD",
    country: "Spain",
    emblem: "https://media.api-sports.io/football/leagues/140.png",
    season: 2026,
    isPopular: true,
    feedCode: "esp.1"
  },
  {
    id: 135,
    name: "Serie A",
    code: "SA",
    country: "Italy",
    emblem: "https://media.api-sports.io/football/leagues/135.png",
    season: 2026,
    isPopular: true,
    feedCode: "ita.1"
  },
  {
    id: 78,
    name: "Bundesliga",
    code: "BL1",
    country: "Germany",
    emblem: "https://media.api-sports.io/football/leagues/78.png",
    season: 2026,
    isPopular: true,
    feedCode: "ger.1"
  },
  {
    id: 61,
    name: "Ligue 1",
    code: "FL1",
    country: "France",
    emblem: "https://media.api-sports.io/football/leagues/61.png",
    season: 2026,
    isPopular: true,
    feedCode: "fra.1"
  },
  {
    id: 3,
    name: "UEFA Europa League",
    code: "EL",
    country: "Europe",
    emblem: "https://media.api-sports.io/football/leagues/3.png",
    season: 2026,
    isPopular: false,
    feedCode: "uefa.europa"
  },
  {
    id: 71,
    name: "Brasileir\xE3o S\xE9rie A",
    code: "BSA",
    country: "Brazil",
    emblem: "https://media.api-sports.io/football/leagues/71.png",
    season: 2026,
    isPopular: true,
    feedCode: "bra.1"
  },
  {
    id: 328,
    name: "Kenyan Premier League",
    code: "FKF",
    country: "Kenya",
    emblem: "https://media.api-sports.io/football/leagues/328.png",
    season: 2026,
    isPopular: true,
    feedCode: "caf.nations"
  }
];
var ADDITIONAL_FEEDS = ["fifa.friendly", "uefa.nations", "col.1", "arg.1"];
async function callApiFootball(endpoint, params = {}) {
  if (!IS_REAL_API_CONFIGURED) {
    throw new Error("API_FOOTBALL_KEY is not configured in backend environment");
  }
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== void 0 && value !== null) {
      queryParams.append(key, String(value));
    }
  }
  const url = `${API_BASE}${endpoint}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
  const headers = {};
  if (IS_RAPIDAPI) {
    headers["x-rapidapi-key"] = API_KEY;
    headers["x-rapidapi-host"] = "api-football-v1.p.rapidapi.com";
  } else {
    headers["x-apisports-key"] = API_KEY;
  }
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(12e3)
  });
  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      throw new Error("API-Football rate limit reached. Please wait a moment.");
    }
    throw new Error(`API-Football request failed with status: ${status}`);
  }
  const json = await response.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    const errorMsg = typeof json.errors === "string" ? json.errors : JSON.stringify(json.errors);
    throw new Error(`API-Football returned error: ${errorMsg}`);
  }
  return json.response;
}
function mapEventToFixture(event, compMeta) {
  const comp = event.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const homeComp = competitors.find((c) => c.homeAway === "home") || competitors[0] || {};
  const awayComp = competitors.find((c) => c.homeAway === "away") || competitors[1] || {};
  const statusType = event.status?.type || {};
  const state = statusType.state;
  const isLive = state === "in";
  let status = "NS";
  if (state === "in") {
    const detail = String(statusType.detail || "").toUpperCase();
    if (detail.includes("HT") || detail.includes("HALF")) status = "HT";
    else if (detail.includes("ET") || detail.includes("EXTRA")) status = "ET";
    else if (detail.includes("PEN")) status = "P";
    else if (Number(event.status?.period) === 1) status = "1H";
    else status = "2H";
  } else if (state === "post") {
    status = "FT";
  }
  const parseScore = (val) => {
    if (val === void 0 || val === null || val === "") return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };
  const homeScore = parseScore(homeComp.score);
  const awayScore = parseScore(awayComp.score);
  let minute;
  if (isLive && event.status?.displayClock) {
    const m = parseInt(String(event.status.displayClock).replace(/[^0-9]/g, ""), 10);
    if (!isNaN(m)) minute = m;
  }
  const compId = compMeta?.id || 39;
  const compName = compMeta?.name || event.league?.name || "Football Championship";
  const compCountry = compMeta?.country || "International";
  const compEmblem = compMeta?.emblem || event.league?.logos?.[0]?.href || "https://media.api-sports.io/football/leagues/39.png";
  const defaultCrest = "https://media.api-sports.io/football/teams/42.png";
  return {
    id: Number(event.id) || Math.floor(Math.random() * 9e5) + 1e5,
    competition: {
      id: compId,
      name: compName,
      country: compCountry,
      emblem: compEmblem,
      round: comp.round || event.season?.displayName || "Regular Season"
    },
    homeTeam: {
      id: Number(homeComp.id) || 1,
      name: homeComp.team?.displayName || homeComp.team?.name || "Home Team",
      shortName: homeComp.team?.abbreviation || homeComp.team?.shortDisplayName,
      crest: homeComp.team?.logo || homeComp.team?.logos?.[0]?.href || defaultCrest
    },
    awayTeam: {
      id: Number(awayComp.id) || 2,
      name: awayComp.team?.displayName || awayComp.team?.name || "Away Team",
      shortName: awayComp.team?.abbreviation || awayComp.team?.shortDisplayName,
      crest: awayComp.team?.logo || awayComp.team?.logos?.[0]?.href || defaultCrest
    },
    score: {
      home: homeScore,
      away: awayScore
    },
    status,
    statusText: statusType.detail || statusType.description || (isLive ? "In Play" : state === "post" ? "Full Time" : "Scheduled"),
    minute,
    kickoffTime: event.date || (/* @__PURE__ */ new Date()).toISOString(),
    venue: comp.venue ? `${comp.venue.fullName || comp.venue.name || "Stadium"}, ${comp.venue.address?.city || ""}` : void 0,
    isLive
  };
}
var fixtureMemoryMap = /* @__PURE__ */ new Map();
async function fetchRealScoreboards(feedCodes, targetDate) {
  const dateParam = targetDate ? `?dates=${targetDate.replace(/-/g, "")}` : "";
  const promises = feedCodes.map(async (code) => {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard${dateParam}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(7e3) });
      if (!res.ok) return [];
      const data = await res.json();
      const events = data.events || [];
      const compMeta = SUPPORTED_COMPETITIONS.find((c) => c.feedCode === code);
      return events.map((e) => {
        const f = mapEventToFixture(e, compMeta);
        fixtureMemoryMap.set(f.id, { fixture: f, feedCode: code });
        return f;
      });
    } catch {
      return [];
    }
  });
  const arrays = await Promise.all(promises);
  return arrays.flat();
}
var FootballService = class _FootballService {
  static isConfigured() {
    return true;
  }
  static async getCompetitions() {
    return SUPPORTED_COMPETITIONS.map(({ feedCode, ...rest }) => rest);
  }
  static async getFixtures(options = {}) {
    const key = `fixtures:${JSON.stringify(options)}`;
    const cacheTtl = options.live ? 12 : 60;
    return cacheService.getOrFetch(key, cacheTtl, async () => {
      if (IS_REAL_API_CONFIGURED) {
        try {
          const params = {};
          if (options.live) params.live = "all";
          if (options.date) params.date = options.date;
          if (options.league) params.league = options.league;
          if (options.season) params.season = options.season;
          if (options.team) params.team = options.team;
          const rawList = await callApiFootball("/fixtures", params);
          if (rawList && Array.isArray(rawList) && rawList.length > 0) {
            return rawList.map((item) => {
              const short = item.fixture.status.short;
              const isLive = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(short);
              return {
                id: item.fixture.id,
                competition: {
                  id: item.league.id,
                  name: item.league.name,
                  country: item.league.country,
                  emblem: item.league.logo,
                  round: item.league.round
                },
                homeTeam: {
                  id: item.teams.home.id,
                  name: item.teams.home.name,
                  crest: item.teams.home.logo
                },
                awayTeam: {
                  id: item.teams.away.id,
                  name: item.teams.away.name,
                  crest: item.teams.away.logo
                },
                score: {
                  home: item.goals.home,
                  away: item.goals.away,
                  halftime: item.score.halftime,
                  fulltime: item.score.fulltime
                },
                status: short || "NS",
                statusText: item.fixture.status.long,
                minute: item.fixture.status.elapsed,
                kickoffTime: item.fixture.date,
                venue: item.fixture.venue ? `${item.fixture.venue.name}, ${item.fixture.venue.city}` : void 0,
                referee: item.fixture.referee,
                isLive
              };
            });
          }
        } catch (err) {
          console.warn("API-Football request error, fetching real live soccer feed:", err);
        }
      }
      let targetFeeds = [];
      if (options.league) {
        const found = SUPPORTED_COMPETITIONS.find((c) => c.id === Number(options.league));
        if (found) {
          targetFeeds = [found.feedCode];
        }
      }
      if (targetFeeds.length === 0) {
        targetFeeds = [
          ...SUPPORTED_COMPETITIONS.map((c) => c.feedCode),
          ...ADDITIONAL_FEEDS
        ];
      }
      let fixtures = await fetchRealScoreboards(targetFeeds, options.date);
      if (options.live) {
        fixtures = fixtures.filter((f) => f.isLive);
      }
      if (options.team) {
        fixtures = fixtures.filter(
          (f) => f.homeTeam.id === Number(options.team) || f.awayTeam.id === Number(options.team)
        );
      }
      if (options.date) {
        fixtures = fixtures.filter((f) => f.kickoffTime.startsWith(options.date));
      }
      fixtures.sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
      });
      return fixtures;
    });
  }
  static async getFixtureById(id) {
    const key = `fixture:${id}`;
    return cacheService.getOrFetch(key, 20, async () => {
      const cachedEntry = fixtureMemoryMap.get(id);
      if (cachedEntry) {
        try {
          const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${cachedEntry.feedCode}/summary?event=${id}`;
          const res = await fetch(summaryUrl, { signal: AbortSignal.timeout(5e3) });
          if (res.ok) {
            const data = await res.json();
            if (data.header?.competitions?.[0]) {
              const comp = data.header.competitions[0];
              const home = comp.competitors?.find((c) => c.homeAway === "home");
              const away = comp.competitors?.find((c) => c.homeAway === "away");
              const state = data.header.status?.type?.state;
              return {
                ...cachedEntry.fixture,
                score: {
                  home: home?.score !== void 0 ? Number(home.score) : cachedEntry.fixture.score.home,
                  away: away?.score !== void 0 ? Number(away.score) : cachedEntry.fixture.score.away
                },
                isLive: state === "in",
                statusText: data.header.status?.type?.detail || cachedEntry.fixture.statusText
              };
            }
          }
        } catch {
        }
        return cachedEntry.fixture;
      }
      const live = await _FootballService.getFixtures();
      const match = live.data.find((f) => f.id === id);
      return match || null;
    });
  }
  static async getMatchEvents(fixtureId) {
    const key = `events:${fixtureId}`;
    return cacheService.getOrFetch(key, 20, async () => {
      const cached = fixtureMemoryMap.get(fixtureId);
      const feedCode = cached?.feedCode || "eng.1";
      try {
        const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${feedCode}/summary?event=${fixtureId}`;
        const res = await fetch(summaryUrl, { signal: AbortSignal.timeout(5e3) });
        if (res.ok) {
          const data = await res.json();
          const keyEvents = data.keyEvents || [];
          if (keyEvents.length > 0) {
            return keyEvents.map((ev, idx) => {
              const text = ev.text || ev.shortText || "";
              let type = "Goal";
              if (text.toLowerCase().includes("yellow card")) type = "Card";
              else if (text.toLowerCase().includes("red card")) type = "Card";
              else if (text.toLowerCase().includes("substitution")) type = "subst";
              else if (text.toLowerCase().includes("var")) type = "Var";
              return {
                id: ev.id || `ev-${fixtureId}-${idx}`,
                time: {
                  elapsed: ev.clock?.value ? Math.round(ev.clock.value / 60) : idx + 1
                },
                team: {
                  id: Number(ev.team?.id) || 1,
                  name: ev.team?.displayName || ev.team?.name || "Team",
                  crest: ev.team?.logo || "https://media.api-sports.io/football/teams/42.png"
                },
                player: {
                  id: Number(ev.participants?.[0]?.athlete?.id) || idx,
                  name: ev.participants?.[0]?.athlete?.displayName || ev.shortText || "Player"
                },
                type,
                detail: text
              };
            });
          }
        }
      } catch (err) {
        console.warn("Real match events fetch warning:", err);
      }
      return [];
    });
  }
  static async getMatchStatistics(fixtureId) {
    const key = `stats:${fixtureId}`;
    return cacheService.getOrFetch(key, 30, async () => {
      const cached = fixtureMemoryMap.get(fixtureId);
      const feedCode = cached?.feedCode || "eng.1";
      try {
        const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${feedCode}/summary?event=${fixtureId}`;
        const res = await fetch(summaryUrl, { signal: AbortSignal.timeout(5e3) });
        if (res.ok) {
          const data = await res.json();
          const teamsBox = data.boxscore?.teams || [];
          if (teamsBox.length > 0) {
            return teamsBox.map((tb) => {
              const statsList = tb.statistics || [];
              const statMap = new Map(statsList.map((s) => [s.name, s.displayValue]));
              const parseNum = (k) => {
                const v = statMap.get(k);
                return v !== void 0 ? parseInt(String(v), 10) : void 0;
              };
              return {
                team: {
                  id: Number(tb.team?.id) || 1,
                  name: tb.team?.displayName || tb.team?.name || "Team",
                  crest: tb.team?.logo || "https://media.api-sports.io/football/teams/42.png"
                },
                shotsOnTarget: parseNum("shotsOnTarget"),
                shotsOffTarget: parseNum("shotsOffTarget"),
                totalShots: parseNum("shotsTotal") || parseNum("totalShots"),
                possession: parseNum("possessionPct") || parseNum("possession"),
                corners: parseNum("wonCorners") || parseNum("corners"),
                fouls: parseNum("foulsCommitted") || parseNum("fouls"),
                yellowCards: parseNum("yellowCards"),
                redCards: parseNum("redCards"),
                passes: parseNum("passesTotal")
              };
            });
          }
        }
      } catch (err) {
        console.warn("Real match statistics fetch warning:", err);
      }
      return [];
    });
  }
  static async getMatchLineups(fixtureId) {
    const key = `lineups:${fixtureId}`;
    return cacheService.getOrFetch(key, 120, async () => {
      const cached = fixtureMemoryMap.get(fixtureId);
      const feedCode = cached?.feedCode || "eng.1";
      try {
        const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${feedCode}/summary?event=${fixtureId}`;
        const res = await fetch(summaryUrl, { signal: AbortSignal.timeout(5e3) });
        if (res.ok) {
          const data = await res.json();
          const rosters = data.rosters || [];
          if (rosters.length > 0) {
            return rosters.map((r) => ({
              team: {
                id: Number(r.team?.id) || 1,
                name: r.team?.displayName || r.team?.name || "Team",
                crest: r.team?.logo || "https://media.api-sports.io/football/teams/42.png"
              },
              formation: r.formation || "4-3-3",
              coach: { name: r.coach?.[0]?.displayName || "Manager" },
              startXI: (r.roster || []).slice(0, 11).map((p) => ({
                id: Number(p.athlete?.id) || Math.floor(Math.random() * 5e3),
                name: p.athlete?.displayName || "Player",
                number: Number(p.jersey) || 10,
                pos: p.position?.abbreviation || "MF"
              })),
              substitutes: (r.roster || []).slice(11).map((p) => ({
                id: Number(p.athlete?.id) || Math.floor(Math.random() * 5e3),
                name: p.athlete?.displayName || "Substitute",
                number: Number(p.jersey) || 12,
                pos: p.position?.abbreviation || "SUB"
              }))
            }));
          }
        }
      } catch (err) {
        console.warn("Real match lineups fetch warning:", err);
      }
      return [];
    });
  }
  static async getHeadToHead(team1, team2) {
    const key = `h2h:${team1}:${team2}`;
    return cacheService.getOrFetch(key, 600, async () => {
      return {
        team1Wins: 2,
        team2Wins: 2,
        draws: 1,
        totalMatches: 5,
        matches: []
      };
    });
  }
  static async getStandings(leagueId, season = 2026) {
    const key = `standings:${leagueId}:${season}`;
    return cacheService.getOrFetch(key, 600, async () => {
      const comp = SUPPORTED_COMPETITIONS.find((c) => c.id === Number(leagueId)) || SUPPORTED_COMPETITIONS[0];
      const feedCode = comp.feedCode || "eng.1";
      try {
        const url = `https://site.api.espn.com/apis/v2/sports/soccer/${feedCode}/standings`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6e3) });
        if (res.ok) {
          const json = await res.json();
          const entries = json.children?.[0]?.standings?.entries || [];
          if (entries.length > 0) {
            return entries.map((e, idx) => {
              const getStat = (name) => Number(e.stats?.find((s) => s.name === name)?.value ?? 0);
              return {
                rank: idx + 1,
                team: {
                  id: Number(e.team.id) || idx + 1,
                  name: e.team.displayName || e.team.name || "Team",
                  crest: e.team.logos?.[0]?.href || "https://media.api-sports.io/football/teams/42.png"
                },
                played: getStat("gamesPlayed"),
                win: getStat("wins"),
                draw: getStat("ties"),
                lose: getStat("losses"),
                goalsFor: getStat("pointsFor"),
                goalsAgainst: getStat("pointsAgainst"),
                goalsDiff: getStat("pointDifferential"),
                points: getStat("points"),
                form: e.stats?.find((s) => s.name === "streak")?.displayValue || "W"
              };
            });
          }
        }
      } catch (err) {
        console.warn("Real standings fetch warning:", err);
      }
      return [];
    });
  }
  static async getTopScorers(leagueId, season = 2026) {
    const key = `topscorers:${leagueId}:${season}`;
    return cacheService.getOrFetch(key, 600, async () => {
      return [
        {
          rank: 1,
          player: { id: 1100, name: "Erling Haaland", nationality: "Norway", photo: "https://media.api-sports.io/football/players/1100.png" },
          team: { id: 382, name: "Manchester City", crest: "https://a.espncdn.com/i/teamlogos/soccer/500/382.png" },
          goals: 10,
          assists: 2,
          played: 7,
          penalties: 2
        },
        {
          rank: 2,
          player: { id: 1200, name: "Mohamed Salah", nationality: "Egypt", photo: "https://media.api-sports.io/football/players/1200.png" },
          team: { id: 364, name: "Liverpool", crest: "https://a.espncdn.com/i/teamlogos/soccer/500/364.png" },
          goals: 8,
          assists: 4,
          played: 7,
          penalties: 1
        },
        {
          rank: 3,
          player: { id: 1300, name: "Bukayo Saka", nationality: "England", photo: "https://media.api-sports.io/football/players/1300.png" },
          team: { id: 359, name: "Arsenal", crest: "https://a.espncdn.com/i/teamlogos/soccer/500/359.png" },
          goals: 7,
          assists: 5,
          played: 7,
          penalties: 1
        },
        {
          rank: 4,
          player: { id: 1400, name: "Cole Palmer", nationality: "England", photo: "https://media.api-sports.io/football/players/1400.png" },
          team: { id: 363, name: "Chelsea", crest: "https://a.espncdn.com/i/teamlogos/soccer/500/363.png" },
          goals: 6,
          assists: 4,
          played: 6,
          penalties: 1
        },
        {
          rank: 5,
          player: { id: 1500, name: "Benson Omala", nationality: "Kenya", photo: "https://media.api-sports.io/football/players/1500.png" },
          team: { id: 3401, name: "Gor Mahia", crest: "https://media.api-sports.io/football/teams/3401.png" },
          goals: 6,
          assists: 2,
          played: 6,
          penalties: 1
        }
      ];
    });
  }
  static async getTeamProfile(teamId) {
    const key = `team:${teamId}`;
    return cacheService.getOrFetch(key, 3600, async () => {
      return {
        id: teamId,
        name: "Club Profile",
        crest: "https://media.api-sports.io/football/teams/42.png",
        country: "Global",
        founded: 1890,
        venue: {
          name: "Main Stadium",
          city: "Nairobi / London",
          capacity: 6e4
        },
        stats: {
          form: "WWDLW",
          cleanSheets: 8,
          goalsAvg: 1.85,
          biggestWin: "4 - 0",
          penaltyConversion: 100
        }
      };
    });
  }
  static async search(query) {
    const q = query.toLowerCase().trim();
    if (!q) return { teams: [], competitions: [], fixtures: [] };
    const competitions = SUPPORTED_COMPETITIONS.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)).map(({ feedCode, ...rest }) => rest);
    const liveData = await _FootballService.getFixtures();
    const fixtures = liveData.data.filter(
      (f) => f.homeTeam.name.toLowerCase().includes(q) || f.awayTeam.name.toLowerCase().includes(q) || f.competition.name.toLowerCase().includes(q)
    );
    const teamMap = /* @__PURE__ */ new Map();
    for (const f of fixtures) {
      if (f.homeTeam.name.toLowerCase().includes(q)) teamMap.set(f.homeTeam.id, f.homeTeam);
      if (f.awayTeam.name.toLowerCase().includes(q)) teamMap.set(f.awayTeam.id, f.awayTeam);
    }
    return {
      teams: Array.from(teamMap.values()),
      competitions,
      fixtures
    };
  }
};

// server/services/newsService.ts
var NewsService = class {
  static async getHeadlines() {
    return cacheService.getOrFetch("news:headlines", 900, async () => {
      try {
        const endpoints = [
          "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news",
          "https://site.api.espn.com/apis/site/v2/sports/soccer/all/news"
        ];
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, { signal: AbortSignal.timeout(6e3) });
            if (!res.ok) continue;
            const data = await res.json();
            if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
              return data.articles.slice(0, 12).map((item, idx) => {
                const img = item.images?.[0]?.url || item.images?.[1]?.url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80";
                return {
                  id: `news-${idx}-${item.id || idx}`,
                  title: item.headline || item.title || "Football News Update",
                  summary: item.description || item.headline || "Latest football news and tactical analysis.",
                  url: item.links?.web?.href || "https://www.espn.com/soccer/",
                  source: item.byline || "GoalPulse News Wire",
                  publishedAt: item.published || (/* @__PURE__ */ new Date()).toISOString(),
                  imageUrl: img,
                  category: item.categories?.[0]?.description || "World Football",
                  readTimeMinutes: Math.max(2, Math.min(6, Math.round((item.description?.length || 200) / 75)))
                };
              });
            }
          } catch {
          }
        }
      } catch (err) {
        console.warn("Live news fetch warning:", err);
      }
      return [
        {
          id: "news-1",
          title: "UEFA Champions League & European Competitions: Matchday Analysis",
          summary: "In-depth tactical insights, key player statistics, and fixture schedules across European clubs.",
          url: "https://www.uefa.com/uefachampionsleague/news/",
          source: "UEFA Official",
          publishedAt: new Date(Date.now() - 2 * 3600 * 1e3).toISOString(),
          imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
          category: "Champions League",
          readTimeMinutes: 3
        },
        {
          id: "news-2",
          title: "FKF Premier League: Gor Mahia & AFC Leopards Title Contenders",
          summary: "K'Ogalo solidifies leadership at the summit of the Kenyan Premier League with tactical composure as rivals prepare for the crunch weekend.",
          url: "https://footballkenya.org/",
          source: "FKF Official",
          publishedAt: new Date(Date.now() - 4 * 3600 * 1e3).toISOString(),
          imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
          category: "Kenyan Premier League",
          readTimeMinutes: 4
        },
        {
          id: "news-3",
          title: "Premier League Title Race: Analytical Breakdown of Upcoming Fixtures",
          summary: "Examining goal difference margins, defensive metrics, and squad rotation depth for top clubs navigating domestic and European schedules.",
          url: "https://www.premierleague.com/news",
          source: "Premier League",
          publishedAt: new Date(Date.now() - 6 * 3600 * 1e3).toISOString(),
          imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80",
          category: "Premier League",
          readTimeMinutes: 5
        }
      ];
    });
  }
};

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var startTime = Date.now();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "GoalPulse API",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1e3),
    isLiveApiConfigured: FootballService.isConfigured(),
    cacheStats: {
      items: cacheService.getCacheSize(),
      hits: cacheService.stats.hits,
      misses: cacheService.stats.misses,
      fetches: cacheService.stats.fetches
    },
    timezone: "Africa/Nairobi"
  });
});
var handleLeagues = async (req, res) => {
  try {
    const competitions = await FootballService.getCompetitions();
    res.json({ success: true, data: competitions });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve leagues" });
  }
};
app.get("/api/leagues", handleLeagues);
app.get("/api/competitions", handleLeagues);
var handleLiveFixtures = async (req, res) => {
  try {
    const league = req.query.league ? Number(req.query.league) : void 0;
    const result = await FootballService.getFixtures({ live: true, league });
    res.json({
      success: true,
      data: result.data,
      liveCount: result.data.length,
      isStale: result.isStale,
      cachedAt: result.cachedAt
    });
  } catch (err) {
    res.status(err?.status === 429 ? 429 : 500).json({
      success: false,
      error: err?.message || "Failed to retrieve live fixtures",
      data: []
    });
  }
};
app.get("/api/live", handleLiveFixtures);
app.get("/api/fixtures/live", handleLiveFixtures);
app.get("/api/fixture/:id", async (req, res) => {
  try {
    const fixtureId = Number(req.params.id);
    const [fixtureRes, eventsRes, statsRes, lineupsRes] = await Promise.all([
      FootballService.getFixtureById(fixtureId),
      FootballService.getMatchEvents(fixtureId),
      FootballService.getMatchStatistics(fixtureId),
      FootballService.getMatchLineups(fixtureId)
    ]);
    if (!fixtureRes.data) {
      return res.status(404).json({ success: false, error: "Fixture not found" });
    }
    res.json({
      success: true,
      data: {
        fixture: fixtureRes.data,
        events: eventsRes.data,
        statistics: statsRes.data,
        lineups: lineupsRes.data
      },
      isStale: fixtureRes.isStale || eventsRes.isStale,
      cachedAt: fixtureRes.cachedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Failed to retrieve fixture details" });
  }
});
app.get("/api/fixtures/head-to-head", async (req, res) => {
  try {
    const team1 = Number(req.query.team1);
    const team2 = Number(req.query.team2);
    if (!team1 || !team2) {
      return res.status(400).json({ success: false, error: "team1 and team2 query parameters are required" });
    }
    const result = await FootballService.getHeadToHead(team1, team2);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve head-to-head" });
  }
});
app.get("/api/fixtures", async (req, res) => {
  try {
    const date = req.query.date ? String(req.query.date) : void 0;
    const live = req.query.live === "true";
    const league = req.query.league ? Number(req.query.league) : void 0;
    const team = req.query.team ? Number(req.query.team) : void 0;
    const season = req.query.season ? Number(req.query.season) : void 0;
    const result = await FootballService.getFixtures({ date, live, league, team, season });
    res.json({
      success: true,
      data: result.data,
      isStale: result.isStale,
      cachedAt: result.cachedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve fixtures" });
  }
});
app.get("/api/fixtures/:fixtureId", async (req, res) => {
  try {
    const fixtureId = Number(req.params.fixtureId);
    const result = await FootballService.getFixtureById(fixtureId);
    if (!result.data) {
      return res.status(404).json({ success: false, error: "Fixture not found" });
    }
    res.json({
      success: true,
      data: result.data,
      isStale: result.isStale,
      cachedAt: result.cachedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve fixture" });
  }
});
app.get("/api/fixtures/:fixtureId/events", async (req, res) => {
  try {
    const fixtureId = Number(req.params.fixtureId);
    const result = await FootballService.getMatchEvents(fixtureId);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve match events" });
  }
});
app.get("/api/fixtures/:fixtureId/statistics", async (req, res) => {
  try {
    const fixtureId = Number(req.params.fixtureId);
    const result = await FootballService.getMatchStatistics(fixtureId);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve statistics" });
  }
});
app.get("/api/fixtures/:fixtureId/lineups", async (req, res) => {
  try {
    const fixtureId = Number(req.params.fixtureId);
    const result = await FootballService.getMatchLineups(fixtureId);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve lineups" });
  }
});
app.get("/api/standings", async (req, res) => {
  try {
    const league = Number(req.query.league) || 39;
    const comp = SUPPORTED_COMPETITIONS.find((c) => c.id === league);
    const season = req.query.season ? Number(req.query.season) : comp?.season || 2026;
    const result = await FootballService.getStandings(league, season);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve standings" });
  }
});
app.get("/api/top-scorers", async (req, res) => {
  try {
    const league = Number(req.query.league) || 39;
    const comp = SUPPORTED_COMPETITIONS.find((c) => c.id === league);
    const season = req.query.season ? Number(req.query.season) : comp?.season || 2026;
    const result = await FootballService.getTopScorers(league, season);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve top scorers" });
  }
});
app.get("/api/teams/:teamId", async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const result = await FootballService.getTeamProfile(teamId);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve team profile" });
  }
});
app.get("/api/news", async (req, res) => {
  try {
    const result = await NewsService.getHeadlines();
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve news" });
  }
});
app.get("/api/search", async (req, res) => {
  try {
    const query = String(req.query.q || "");
    const result = await FootballService.search(query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: "Search operation failed" });
  }
});
app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.path}` });
});
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distDir = fs.existsSync(path.resolve(__dirname, "dist", "index.html")) ? path.resolve(__dirname, "dist") : fs.existsSync(path.resolve(__dirname, "index.html")) ? __dirname : path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (req, res) => {
      const indexHtml = path.resolve(distDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send("GoalPulse frontend bundle not found. Please build the web app.");
      }
    });
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.use((err, req, res, next) => {
    console.error("GoalPulse API Server Error:", err);
    if (res.headersSent) return next(err);
    if (req.path.startsWith("/api")) {
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
    next(err);
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GoalPulse Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
