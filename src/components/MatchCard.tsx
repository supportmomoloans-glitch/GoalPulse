import React from 'react';
import { Star, Clock } from 'lucide-react';
import type { Fixture } from '../types/football.ts';
import { formatToEAT } from '../utils/date.ts';
import { TeamCrest, CompetitionBadge } from './TeamCrest.tsx';

interface MatchCardProps {
  fixture: Fixture;
  onClick: (fixture: Fixture) => void;
  isHomeFav?: boolean;
  isAwayFav?: boolean;
  onToggleFavTeam?: (teamId: number, e: React.MouseEvent) => void;
  variant?: 'default' | 'compact' | 'featured';
}

export const MatchCard: React.FC<MatchCardProps> = ({
  fixture,
  onClick,
  isHomeFav = false,
  isAwayFav = false,
  onToggleFavTeam,
  variant = 'default',
}) => {
  const isLive = fixture.isLive;
  const isFinished = fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN';
  const isScheduled = fixture.status === 'NS';

  const homeScore = fixture.score.home !== null ? fixture.score.home : '-';
  const awayScore = fixture.score.away !== null ? fixture.score.away : '-';

  const kickOffEAT = formatToEAT(fixture.kickoffTime);

  return (
    <div
      onClick={() => onClick(fixture)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(fixture);
        }
      }}
      className={`clay-card p-3.5 cursor-pointer relative group transition-all duration-200 active:scale-[0.99] hover:border-[#7138E8]/50 ${
        isLive
          ? 'border-[#7138E8]/60 dark:border-[#8B5CF6]/50 shadow-md shadow-purple-900/10'
          : 'border-[#C9C2DD] dark:border-[#362C52]'
      }`}
    >
      {/* Header: Competition & Status */}
      <div className="flex items-center justify-between text-xs mb-2.5 pb-2 border-b border-[#C9C2DD]/60 dark:border-[#362C52]/60">
        <div className="flex items-center gap-2 truncate pr-2">
          <CompetitionBadge
            name={fixture.competition.name}
            emblem={fixture.competition.emblem}
            size="xs"
          />
          <span className="font-extrabold text-[#514966] dark:text-[#B8B0D3] truncate text-[11px]">
            {fixture.competition.name}
          </span>
          {fixture.competition.round && (
            <span className="text-[10px] font-bold text-[#6C6285] dark:text-[#968DB8] hidden sm:inline">
              · {fixture.competition.round}
            </span>
          )}
        </div>

        {/* Status Pill / Live Badge */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isLive ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-sm shadow-rose-600/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              {fixture.minute ? `${fixture.minute}'` : fixture.statusText}
            </span>
          ) : isFinished ? (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-[#DDD8EC] dark:bg-[#272042] text-[#211B35] dark:text-[#F5F3FC] border border-[#C9C2DD] dark:border-[#362C52]">
              FT
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-black text-[#211B35] dark:text-[#F5F3FC]">
              <Clock className="w-3.5 h-3.5 text-[#35264F] dark:text-[#DDD6FE] stroke-[2.5]" />
              {kickOffEAT} EAT
            </span>
          )}
        </div>
      </div>

      {/* Main Match Fixture Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Home Team */}
        <div className="flex-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamCrest
              name={fixture.homeTeam.name}
              crest={fixture.homeTeam.crest}
              size="md"
            />
            <div className="truncate">
              <span className="font-black text-sm text-[#211B35] dark:text-[#F5F3FC] truncate block leading-tight">
                {fixture.homeTeam.name}
              </span>
              {fixture.homeTeam.country && (
                <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block mt-0.5">
                  {fixture.homeTeam.country}
                </span>
              )}
            </div>
          </div>

          {/* Home Favourite Button */}
          {onToggleFavTeam && (
            <button
              onClick={(e) => onToggleFavTeam(fixture.homeTeam.id, e)}
              className="p-1.5 rounded-full text-[#35264F] dark:text-[#B8B0D3] hover:text-amber-500 transition-colors focus-visible:outline-none"
              title={`Favourite ${fixture.homeTeam.name}`}
              aria-label={`Favourite ${fixture.homeTeam.name}`}
            >
              <Star
                className={`w-4 h-4 stroke-[2.2] ${
                  isHomeFav ? 'fill-amber-400 text-amber-500' : 'text-[#514966] dark:text-[#B8B0D3]'
                }`}
              />
            </button>
          )}
        </div>

        {/* Score Center Box */}
        <div className="shrink-0 flex flex-col items-center justify-center min-w-[76px] px-2.5 py-1.5 rounded-xl clay-inset">
          {isScheduled ? (
            <span className="text-xs font-black text-[#7138E8] dark:text-[#8B5CF6]">
              VS
            </span>
          ) : (
            <div className="flex items-center gap-1.5 font-mono text-xl font-black tabular-nums tracking-wider text-[#211B35] dark:text-[#F5F3FC]">
              <span className={isLive && fixture.score.home !== null ? 'text-[#7138E8] dark:text-[#A78BFA]' : ''}>
                {homeScore}
              </span>
              <span className="text-[#6C6285] dark:text-[#968DB8]">:</span>
              <span className={isLive && fixture.score.away !== null ? 'text-[#7138E8] dark:text-[#A78BFA]' : ''}>
                {awayScore}
              </span>
            </div>
          )}
          {fixture.score.halftime && (fixture.score.halftime.home !== null) && (
            <span className="text-[9px] font-bold text-[#514966] dark:text-[#B8B0D3] mt-0.5">
              HT ({fixture.score.halftime.home}-{fixture.score.halftime.away})
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center justify-between gap-2 flex-row-reverse">
          <div className="flex items-center gap-2.5 min-w-0 flex-row-reverse">
            <TeamCrest
              name={fixture.awayTeam.name}
              crest={fixture.awayTeam.crest}
              size="md"
            />
            <div className="truncate text-right">
              <span className="font-black text-sm text-[#211B35] dark:text-[#F5F3FC] truncate block leading-tight">
                {fixture.awayTeam.name}
              </span>
              {fixture.awayTeam.country && (
                <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block mt-0.5">
                  {fixture.awayTeam.country}
                </span>
              )}
            </div>
          </div>

          {/* Away Favourite Button */}
          {onToggleFavTeam && (
            <button
              onClick={(e) => onToggleFavTeam(fixture.awayTeam.id, e)}
              className="p-1.5 rounded-full text-[#35264F] dark:text-[#B8B0D3] hover:text-amber-500 transition-colors focus-visible:outline-none"
              title={`Favourite ${fixture.awayTeam.name}`}
              aria-label={`Favourite ${fixture.awayTeam.name}`}
            >
              <Star
                className={`w-4 h-4 stroke-[2.2] ${
                  isAwayFav ? 'fill-amber-400 text-amber-500' : 'text-[#514966] dark:text-[#B8B0D3]'
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
