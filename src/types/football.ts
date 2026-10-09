export interface Competition {
  id: number;
  name: string;
  code: string;
  country: string;
  flag?: string;
  emblem: string;
  season: number;
  isPopular?: boolean;
}

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest: string;
  country?: string;
  founded?: number;
  venue?: {
    name: string;
    city: string;
    capacity?: number;
  };
}

export type MatchStatus =
  | 'NS' // Not Started / Scheduled
  | 'LIVE' // In Play (1H, 2H)
  | '1H' // First Half
  | 'HT' // Halftime
  | '2H' // Second Half
  | 'ET' // Extra Time
  | 'P' // Penalty Shootout
  | 'FT' // Finished
  | 'AET' // Finished after Extra Time
  | 'PEN' // Finished after Penalties
  | 'PST' // Postponed
  | 'CANC' // Cancelled
  | 'ABD'; // Abandoned

export interface FixtureScore {
  home: number | null;
  away: number | null;
  halftime?: { home: number | null; away: number | null };
  fulltime?: { home: number | null; away: number | null };
  extratime?: { home: number | null; away: number | null };
  penalty?: { home: number | null; away: number | null };
}

export interface Fixture {
  id: number;
  competition: {
    id: number;
    name: string;
    country: string;
    emblem: string;
    round?: string;
  };
  homeTeam: Team;
  awayTeam: Team;
  score: FixtureScore;
  status: MatchStatus;
  statusText: string;
  minute?: number;
  addedTime?: number;
  kickoffTime: string; // ISO string (Africa/Nairobi converts smoothly)
  venue?: string;
  referee?: string;
  isLive?: boolean;
}

export interface MatchEvent {
  id: string;
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    crest?: string;
  };
  player: {
    id?: number;
    name: string;
  };
  assist?: {
    id?: number;
    name: string;
  };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
  comments?: string;
}

export interface TeamStatistic {
  team: Team;
  shotsOnTarget?: number;
  shotsOffTarget?: number;
  totalShots?: number;
  possession?: number; // percentage
  corners?: number;
  fouls?: number;
  offsides?: number;
  yellowCards?: number;
  redCards?: number;
  passes?: number;
  passAccuracy?: number; // percentage
  expectedGoals?: number;
}

export interface PlayerLineup {
  id: number;
  name: string;
  number: number;
  pos: 'G' | 'D' | 'M' | 'F';
  grid?: string;
}

export interface TeamLineup {
  team: Team;
  formation: string;
  coach: {
    name: string;
  };
  startXI: PlayerLineup[];
  substitutes: PlayerLineup[];
}

export interface StandingRow {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  form?: string; // e.g. "WWDLW"
  description?: string; // e.g. "Champions League qualification"
}

export interface TopScorer {
  rank: number;
  player: {
    id: number;
    name: string;
    photo?: string;
    nationality?: string;
  };
  team: Team;
  goals: number;
  assists?: number;
  played?: number;
  penalties?: number;
}

export interface HeadToHeadSummary {
  team1Wins: number;
  team2Wins: number;
  draws: number;
  totalMatches: number;
  matches: Fixture[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  category: string;
  readTimeMinutes: number;
}

export interface TeamStatsSummary {
  form: string;
  cleanSheets: number;
  goalsAvg: number;
  biggestWin: string;
  penaltyConversion: number;
}

export interface GoalAlert {
  id: string;
  fixtureId: number;
  scoringTeam: Team;
  concedingTeam: Team;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  scorerName?: string;
  minute?: number;
  competitionName: string;
  timestamp: number;
}
