import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { FootballService, SUPPORTED_COMPETITIONS } from './server/services/footballData.ts';
import { NewsService } from './server/services/newsService.ts';
import { cacheService } from './server/services/cache.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const startTime = Date.now();

app.use(express.json());

// Security & CORS middleware (safe for Android WebViews & browser clients)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 1. Health check & status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'GoalPulse API',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    isLiveApiConfigured: FootballService.isConfigured(),
    cacheStats: {
      items: cacheService.getCacheSize(),
      hits: cacheService.stats.hits,
      misses: cacheService.stats.misses,
      fetches: cacheService.stats.fetches,
    },
    timezone: 'Africa/Nairobi',
  });
});

// 2. Leagues / Competitions (/api/leagues and /api/competitions)
const handleLeagues = async (req: Request, res: Response) => {
  try {
    const competitions = await FootballService.getCompetitions();
    res.json({ success: true, data: competitions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve leagues' });
  }
};
app.get('/api/leagues', handleLeagues);
app.get('/api/competitions', handleLeagues);

// 3. Live Fixtures (/api/live and /api/fixtures/live)
const handleLiveFixtures = async (req: Request, res: Response) => {
  try {
    const league = req.query.league ? Number(req.query.league) : undefined;
    const result = await FootballService.getFixtures({ live: true, league });
    res.json({
      success: true,
      data: result.data,
      liveCount: result.data.length,
      isStale: result.isStale,
      cachedAt: result.cachedAt,
    });
  } catch (err: any) {
    res.status(err?.status === 429 ? 429 : 500).json({
      success: false,
      error: err?.message || 'Failed to retrieve live fixtures',
      data: [],
    });
  }
};
app.get('/api/live', handleLiveFixtures);
app.get('/api/fixtures/live', handleLiveFixtures);

// 4. Combined Fixture Details (/api/fixture/:id)
app.get('/api/fixture/:id', async (req: Request, res: Response) => {
  try {
    const fixtureId = Number(req.params.id);
    const [fixtureRes, eventsRes, statsRes, lineupsRes] = await Promise.all([
      FootballService.getFixtureById(fixtureId),
      FootballService.getMatchEvents(fixtureId),
      FootballService.getMatchStatistics(fixtureId),
      FootballService.getMatchLineups(fixtureId),
    ]);

    if (!fixtureRes.data) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }

    res.json({
      success: true,
      data: {
        fixture: fixtureRes.data,
        events: eventsRes.data,
        statistics: statsRes.data,
        lineups: lineupsRes.data,
      },
      isStale: fixtureRes.isStale || eventsRes.isStale,
      cachedAt: fixtureRes.cachedAt,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to retrieve fixture details' });
  }
});

// 4. Head to Head (defined before :fixtureId route)
app.get('/api/fixtures/head-to-head', async (req: Request, res: Response) => {
  try {
    const team1 = Number(req.query.team1);
    const team2 = Number(req.query.team2);
    if (!team1 || !team2) {
      return res.status(400).json({ success: false, error: 'team1 and team2 query parameters are required' });
    }
    const result = await FootballService.getHeadToHead(team1, team2);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve head-to-head' });
  }
});

// 5. Fixtures by date / league / team / status
app.get('/api/fixtures', async (req: Request, res: Response) => {
  try {
    const date = req.query.date ? String(req.query.date) : undefined;
    const live = req.query.live === 'true';
    const league = req.query.league ? Number(req.query.league) : undefined;
    const team = req.query.team ? Number(req.query.team) : undefined;
    const season = req.query.season ? Number(req.query.season) : undefined;

    const result = await FootballService.getFixtures({ date, live, league, team, season });
    res.json({
      success: true,
      data: result.data,
      isStale: result.isStale,
      cachedAt: result.cachedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve fixtures' });
  }
});

// 6. Match Details
app.get('/api/fixtures/:fixtureId', async (req: Request, res: Response) => {
  try {
    const fixtureId = Number(req.params.fixtureId);
    const result = await FootballService.getFixtureById(fixtureId);
    if (!result.data) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }
    res.json({
      success: true,
      data: result.data,
      isStale: result.isStale,
      cachedAt: result.cachedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve fixture' });
  }
});

// 7. Match Events
app.get('/api/fixtures/:fixtureId/events', async (req: Request, res: Response) => {
  try {
    const fixtureId = Number(req.params.fixtureId);
    const result = await FootballService.getMatchEvents(fixtureId);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve match events' });
  }
});

// 8. Match Statistics
app.get('/api/fixtures/:fixtureId/statistics', async (req: Request, res: Response) => {
  try {
    const fixtureId = Number(req.params.fixtureId);
    const result = await FootballService.getMatchStatistics(fixtureId);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve statistics' });
  }
});

// 9. Match Lineups
app.get('/api/fixtures/:fixtureId/lineups', async (req: Request, res: Response) => {
  try {
    const fixtureId = Number(req.params.fixtureId);
    const result = await FootballService.getMatchLineups(fixtureId);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve lineups' });
  }
});

// 10. Standings
app.get('/api/standings', async (req: Request, res: Response) => {
  try {
    const league = Number(req.query.league) || 39;
    const comp = SUPPORTED_COMPETITIONS.find((c) => c.id === league);
    const season = req.query.season ? Number(req.query.season) : (comp?.season || 2026);
    const result = await FootballService.getStandings(league, season);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve standings' });
  }
});

// 11. Top Scorers
app.get('/api/top-scorers', async (req: Request, res: Response) => {
  try {
    const league = Number(req.query.league) || 39;
    const comp = SUPPORTED_COMPETITIONS.find((c) => c.id === league);
    const season = req.query.season ? Number(req.query.season) : (comp?.season || 2026);
    const result = await FootballService.getTopScorers(league, season);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve top scorers' });
  }
});

// 12. Team Profile
app.get('/api/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.teamId);
    const result = await FootballService.getTeamProfile(teamId);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve team profile' });
  }
});

// 13. News
app.get('/api/news', async (req: Request, res: Response) => {
  try {
    const result = await NewsService.getHeadlines();
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve news' });
  }
});

// 14. Global Search
app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '');
    const result = await FootballService.search(query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Search operation failed' });
  }
});

// 15. Catch-all 404 for unhandled API routes (prevents returning index.html)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.path}` });
});

// Vite Middleware integration for dev / static for prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distDir = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))
      ? path.resolve(__dirname, 'dist')
      : fs.existsSync(path.resolve(__dirname, 'index.html'))
      ? __dirname
      : path.resolve(process.cwd(), 'dist');

    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      const indexHtml = path.resolve(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('GoalPulse frontend bundle not found. Please build the web app.');
      }
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('GoalPulse API Server Error:', err);
    if (res.headersSent) return next(err);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
    next(err);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GoalPulse Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}
