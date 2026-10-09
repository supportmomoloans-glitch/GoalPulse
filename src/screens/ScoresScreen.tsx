import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Filter,
  Trophy,
  Clock,
  Radio,
} from 'lucide-react';
import type { Fixture, Competition } from '../types/football.ts';
import { MatchCard } from '../components/MatchCard.tsx';
import { BannerAd } from '../components/BannerAd.tsx';
import {
  getTodayDateString,
  getDateOffsetString,
  getRelativeDayLabel,
} from '../utils/date.ts';

interface ScoresScreenProps {
  fixtures: Fixture[];
  competitions: Competition[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectMatch: (fixture: Fixture) => void;
  favouriteTeamIds: number[];
  onToggleFavTeam: (teamId: number, e: React.MouseEvent) => void;
  lastUpdatedText: string;
}

type StatusFilter = 'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED';

export const ScoresScreen: React.FC<ScoresScreenProps> = ({
  fixtures,
  competitions,
  selectedDate,
  onDateChange,
  isRefreshing,
  onRefresh,
  onSelectMatch,
  favouriteTeamIds,
  onToggleFavTeam,
  lastUpdatedText,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | 'ALL'>('ALL');

  // Quick Date Navigation buttons (-2, -1, 0, +1, +2)
  const quickDates = [-2, -1, 0, 1, 2].map((offset) => {
    const dStr = getDateOffsetString(offset);
    return {
      dateString: dStr,
      label: getRelativeDayLabel(dStr),
      isToday: offset === 0,
    };
  });

  // Filter fixtures
  const filtered = fixtures.filter((f) => {
    // League filter
    if (selectedLeagueId !== 'ALL' && f.competition.id !== selectedLeagueId) {
      return false;
    }
    // Status filter
    if (statusFilter === 'LIVE') {
      return f.isLive;
    }
    if (statusFilter === 'UPCOMING') {
      return f.status === 'NS';
    }
    if (statusFilter === 'FINISHED') {
      return f.status === 'FT' || f.status === 'AET' || f.status === 'PEN';
    }
    return true;
  });

  // Group by competition
  const groupedByCompetition = filtered.reduce<Record<number, { comp: Fixture['competition']; matches: Fixture[] }>>(
    (acc, fixture) => {
      const cid = fixture.competition.id;
      if (!acc[cid]) {
        acc[cid] = {
          comp: fixture.competition,
          matches: [],
        };
      }
      acc[cid].matches.push(fixture);
      return acc;
    },
    {}
  );

  const competitionGroups = Object.values(groupedByCompetition);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Top Controls: Date Carousel */}
      <div className="sticky top-[58px] z-20 -mx-4 px-4 py-2 bg-[#F0EFF8]/95 dark:bg-[#120E22]/95 backdrop-blur-md border-b border-[#C9C2DD] dark:border-[#362C52]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Date Slider */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1">
            {quickDates.map((item) => {
              const isSelected = selectedDate === item.dateString;
              return (
                <button
                  key={item.dateString}
                  onClick={() => onDateChange(item.dateString)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-black shrink-0 transition-all ${
                    isSelected ? 'clay-pill-active' : 'clay-pill-inactive'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Date Picker Input */}
          <div className="relative shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              title="Pick specific date"
            />
            <div className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE]">
              <CalendarIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Subheader: Status Tabs & League Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        {/* Status Filters */}
        <div className="flex items-center gap-1 p-1 rounded-2xl clay-inset self-start">
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'LIVE', label: 'Live' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'FINISHED', label: 'Results' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  isActive ? 'clay-pill-active' : 'text-[#514966] dark:text-[#B8B0D3] hover:text-[#211B35] dark:hover:text-[#F5F3FC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Refresh & Last Updated Timestamp */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[#514966] dark:text-[#B8B0D3]">
          <span className="text-[11px] font-bold">{lastUpdatedText}</span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="clay-button px-2.5 py-1 rounded-xl flex items-center gap-1 text-[#7138E8] dark:text-[#8B5CF6] font-black"
            title="Refresh active scores"
          >
            <RefreshCw className={`w-3 h-3 stroke-[2.5] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* League Filter Badges */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedLeagueId('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
            selectedLeagueId === 'ALL' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          All Leagues
        </button>
        {competitions.map((comp) => (
          <button
            key={comp.id}
            onClick={() => setSelectedLeagueId(comp.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 transition-all ${
              selectedLeagueId === comp.id ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            <img
              src={comp.emblem}
              alt=""
              className="w-4 h-4 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {comp.name}
          </button>
        ))}
      </div>

      {/* Fixtures Grouped by Competition */}
      {competitionGroups.length > 0 ? (
        <div className="space-y-5">
          {competitionGroups.map((group) => (
            <div key={group.comp.id} className="space-y-2.5">
              {/* Competition Group Header */}
              <div className="flex items-center gap-2 px-1">
                <img
                  src={group.comp.emblem}
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <h3 className="font-black text-xs text-[#211B35] dark:text-[#F5F3FC] uppercase tracking-wider">
                  {group.comp.name}
                </h3>
                <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">({group.matches.length})</span>
              </div>

              {/* Match Cards */}
              <div className="grid grid-cols-1 gap-2.5">
                {group.matches.map((fixture) => (
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
          ))}
        </div>
      ) : (
        <div className="clay-card p-10 text-center space-y-2">
          <Clock className="w-8 h-8 mx-auto text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
          <h4 className="font-black text-sm text-[#211B35] dark:text-[#F5F3FC]">
            No Matches Found
          </h4>
          <p className="text-xs font-bold text-[#514966] dark:text-[#B8B0D3] max-w-sm mx-auto">
            {statusFilter === 'LIVE'
              ? 'There are currently no live matches in progress for this selection. Try checking "All" or "Upcoming".'
              : 'No matches found matching your filters for this date.'}
          </p>
        </div>
      )}

      {/* Non-intrusive Banner Ad */}
      <BannerAd />
    </div>
  );
};
