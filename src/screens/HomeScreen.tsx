import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Trophy,
  ChevronRight,
  TrendingUp,
  Star,
  Flame,
  Radio,
  Clock,
} from 'lucide-react';
import type { Fixture, Competition, NewsArticle } from '../types/football.ts';
import { MatchCard } from '../components/MatchCard.tsx';
import { BannerAd } from '../components/BannerAd.tsx';
import heroStadiumImg from '../assets/images/goalpulse_stadium_hero_1791503548901.jpg';

interface HomeScreenProps {
  liveFixtures: Fixture[];
  todayFixtures: Fixture[];
  competitions: Competition[];
  news: NewsArticle[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectMatch: (fixture: Fixture) => void;
  onSelectCompetition: (leagueId: number) => void;
  onSelectTab: (tab: 'scores' | 'competitions' | 'news') => void;
  favouriteTeamIds: number[];
  onToggleFavTeam: (teamId: number, e: React.MouseEvent) => void;
  lastUpdatedText: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  liveFixtures,
  todayFixtures,
  competitions,
  news,
  isRefreshing,
  onRefresh,
  onSelectMatch,
  onSelectCompetition,
  onSelectTab,
  favouriteTeamIds,
  onToggleFavTeam,
  lastUpdatedText,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'favourites'>('all');

  // Featured match of the day
  const featuredMatch = liveFixtures[0] || todayFixtures[0];

  // Favourites filtering
  const favMatches = todayFixtures.filter(
    (f) =>
      favouriteTeamIds.includes(f.homeTeam.id) ||
      favouriteTeamIds.includes(f.awayTeam.id)
  );

  const displayedFixtures =
    filterMode === 'favourites' && favMatches.length > 0
      ? favMatches
      : todayFixtures;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Welcome / Live Banner Strip */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-[#211B35] dark:text-[#F5F3FC] tracking-tight">
            Football Live Pulse
          </h2>
          <p className="text-xs font-bold text-[#514966] dark:text-[#B8B0D3]">
            East Africa Time (EAT) · {lastUpdatedText}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="clay-button px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 text-[#7138E8] dark:text-[#8B5CF6]"
          title="Refresh match scores"
        >
          <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Featured Match Card Hero with Tactile Clay Background */}
      {featuredMatch && (
        <div className="relative rounded-3xl overflow-hidden clay-card shadow-lg border border-[#C9C2DD] dark:border-[#362C52]">
          <div className="relative h-44 sm:h-52 w-full overflow-hidden">
            <img
              src={heroStadiumImg}
              alt="Match Stadium"
              className="w-full h-full object-cover brightness-[0.75] contrast-[1.1]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151124] via-[#151124]/50 to-transparent" />

            <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider bg-white/20 backdrop-blur-md text-white uppercase border border-white/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Featured Match
              </span>
              {featuredMatch.isLive && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 animate-pulse shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {featuredMatch.minute ? `${featuredMatch.minute}' LIVE` : 'LIVE NOW'}
                </span>
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-[11px] font-black text-purple-200 tracking-wide uppercase mb-1">
                {featuredMatch.competition.name}
              </p>
              <div
                onClick={() => onSelectMatch(featuredMatch)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg font-black drop-shadow-sm group-hover:text-purple-300 transition-colors">
                    {featuredMatch.homeTeam.name} vs {featuredMatch.awayTeam.name}
                  </span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md font-mono text-sm font-black tracking-wider">
                  {featuredMatch.status === 'NS' ? 'Scheduled' : `${featuredMatch.score.home ?? 0} : ${featuredMatch.score.away ?? 0}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Competitions Horizontal Quick Rail */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3] flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
            Major Competitions
          </span>
          <button
            onClick={() => onSelectTab('competitions')}
            className="text-xs font-black text-[#7138E8] dark:text-[#8B5CF6] flex items-center hover:underline"
          >
            All <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {competitions.slice(0, 6).map((comp) => (
            <button
              key={comp.id}
              onClick={() => onSelectCompetition(comp.id)}
              className="clay-button px-3.5 py-2 rounded-2xl flex items-center gap-2 shrink-0 hover:border-[#7138E8] dark:hover:border-[#8B5CF6] transition-all text-xs font-black text-[#211B35] dark:text-[#F5F3FC]"
            >
              <img
                src={comp.emblem}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="truncate max-w-[120px]">{comp.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LIVE MATCHES OR NO LIVE MATCHES STATE */}
      {liveFixtures.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <h3 className="text-sm font-black text-[#211B35] dark:text-[#F5F3FC] uppercase tracking-wide">
                Live Now ({liveFixtures.length})
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('scores')}
              className="text-xs font-black text-[#7138E8] dark:text-[#8B5CF6] hover:underline"
            >
              View Scoreboard
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {liveFixtures.map((fixture) => (
              <MatchCard
                key={fixture.id}
                fixture={fixture}
                onClick={onSelectMatch}
                isHomeFav={favouriteTeamIds.includes(fixture.homeTeam.id)}
                isAwayFav={favouriteTeamIds.includes(fixture.awayTeam.id)}
                onToggleFavTeam={onToggleFavTeam}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="clay-card p-4 rounded-2xl flex items-center justify-between border border-[#C9C2DD] dark:border-[#362C52]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#7138E8] dark:text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-[#211B35] dark:text-[#F5F3FC]">No Live Matches Right Now</p>
              <p className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">Showing today&apos;s scheduled fixtures below</p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('scores')}
            className="px-3 py-1.5 rounded-xl text-xs font-black clay-button text-[#7138E8] dark:text-[#8B5CF6]"
          >
            Schedule
          </button>
        </div>
      )}

      {/* TODAY'S FIXTURES & FILTER SWITCH */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-[#211B35] dark:text-[#F5F3FC] tracking-tight">
            Today&apos;s Fixtures & Results
          </h3>

          {/* Interactive Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 rounded-xl clay-inset">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                filterMode === 'all' ? 'clay-pill-active' : 'text-[#514966] dark:text-[#B8B0D3]'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setFilterMode('favourites')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all ${
                filterMode === 'favourites' ? 'clay-pill-active' : 'text-[#514966] dark:text-[#B8B0D3]'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              Favourites
            </button>
          </div>
        </div>

        {displayedFixtures.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {displayedFixtures.map((fixture) => (
              <MatchCard
                key={fixture.id}
                fixture={fixture}
                onClick={onSelectMatch}
                isHomeFav={favouriteTeamIds.includes(fixture.homeTeam.id)}
                isAwayFav={favouriteTeamIds.includes(fixture.awayTeam.id)}
                onToggleFavTeam={onToggleFavTeam}
              />
            ))}
          </div>
        ) : (
          <div className="clay-card p-6 text-center text-xs font-bold text-[#514966] dark:text-[#B8B0D3]">
            {filterMode === 'favourites'
              ? 'None of your favourite teams are scheduled to play today. Star more clubs to see them here!'
              : 'No fixtures scheduled for today.'}
          </div>
        )}
      </div>

      {/* Banner Ad Placement */}
      <BannerAd />

      {/* Football News Preview */}
      {news.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#211B35] dark:text-[#F5F3FC] tracking-tight">
              Top Football Headlines
            </h3>
            <button
              onClick={() => onSelectTab('news')}
              className="text-xs font-black text-[#7138E8] dark:text-[#8B5CF6] hover:underline"
            >
              Read More
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {news.slice(0, 2).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="clay-card p-3.5 block group hover:border-[#7138E8] dark:hover:border-[#8B5CF6] transition-all"
              >
                <div className="text-[10px] font-black text-[#7138E8] dark:text-[#8B5CF6] uppercase tracking-wider mb-1">
                  {item.category} · {item.source}
                </div>
                <h4 className="text-xs font-black text-[#211B35] dark:text-[#F5F3FC] group-hover:text-[#7138E8] dark:group-hover:text-[#8B5CF6] transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] font-medium text-[#514966] dark:text-[#B8B0D3] mt-1 line-clamp-2">
                  {item.summary}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
