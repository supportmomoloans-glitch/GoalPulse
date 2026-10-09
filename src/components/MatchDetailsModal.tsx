import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  User,
  Shield,
  BarChart2,
  List,
  Users,
  History,
  Activity,
  AlertCircle,
} from 'lucide-react';
import type {
  Fixture,
  MatchEvent,
  TeamStatistic,
  TeamLineup,
  HeadToHeadSummary,
} from '../types/football.ts';
import { api } from '../services/api.ts';
import { formatToEAT, formatFullMatchDateTime } from '../utils/date.ts';
import { adMobService } from '../services/adMobService.ts';

interface MatchDetailsModalProps {
  fixture: Fixture | null;
  onClose: () => void;
  onSelectTeam?: (teamId: number) => void;
}

type TabType = 'overview' | 'events' | 'stats' | 'lineups' | 'h2h';

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  fixture,
  onClose,
  onSelectTeam,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [stats, setStats] = useState<TeamStatistic[]>([]);
  const [lineups, setLineups] = useState<TeamLineup[]>([]);
  const [h2h, setH2h] = useState<HeadToHeadSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!fixture) return;

    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      api.getMatchEvents(fixture.id),
      api.getMatchStatistics(fixture.id),
      api.getMatchLineups(fixture.id),
      api.getHeadToHead(fixture.homeTeam.id, fixture.awayTeam.id),
    ]).then(([eventsRes, statsRes, lineupsRes, h2hRes]) => {
      if (!isMounted) return;

      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (lineupsRes.status === 'fulfilled') setLineups(lineupsRes.value.data);
      if (h2hRes.status === 'fulfilled') setH2h(h2hRes.value.data);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [fixture]);

  const handleClose = () => {
    adMobService.showInterstitialIfAllowed();
    onClose();
  };

  if (!fixture) return null;

  const isLive = fixture.isLive;
  const kickOffEAT = formatToEAT(fixture.kickoffTime);
  const fullDateTime = formatFullMatchDateTime(fixture.kickoffTime);

  const homeStat = stats.find((s) => s.team.id === fixture.homeTeam.id) || stats[0];
  const awayStat = stats.find((s) => s.team.id === fixture.awayTeam.id) || stats[1];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#E6E3F2] dark:bg-[#1E1833] w-full max-w-xl max-h-[92vh] sm:rounded-3xl rounded-t-3xl flex flex-col shadow-2xl border border-[#C9C2DD] dark:border-[#362C52] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[#E6E3F2] dark:bg-[#1E1833] border-b border-[#C9C2DD] dark:border-[#362C52] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {fixture.competition.emblem && (
              <img
                src={fixture.competition.emblem}
                alt=""
                className="w-5 h-5 object-contain"
              />
            )}
            <span className="text-xs font-black text-[#514966] dark:text-[#B8B0D3]">
              {fixture.competition.name}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE] hover:text-[#211B35] dark:hover:text-[#F5F3FC]"
            aria-label="Close match details"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Hero Scoreboard */}
        <div className="px-6 py-5 bg-[#E6E3F2] dark:bg-[#1E1833] border-b border-[#C9C2DD] dark:border-[#362C52] text-center">
          <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
            {/* Home Team */}
            <div
              className="flex-1 flex flex-col items-center cursor-pointer group"
              onClick={() => onSelectTeam && onSelectTeam(fixture.homeTeam.id)}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#DDD8EC] dark:bg-[#272042] p-2 clay-card flex items-center justify-center mb-2 shadow-md group-hover:scale-105 transition-transform border border-[#C9C2DD] dark:border-[#362C52]">
                {fixture.homeTeam.crest ? (
                  <img
                    src={fixture.homeTeam.crest}
                    alt={fixture.homeTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <Shield className="w-8 h-8 text-[#7138E8] dark:text-[#8B5CF6]" />
                )}
              </div>
              <h3 className="font-black text-sm text-[#211B35] dark:text-[#F5F3FC] text-center leading-tight">
                {fixture.homeTeam.name}
              </h3>
            </div>

            {/* Score & Status Center */}
            <div className="flex flex-col items-center px-4">
              {fixture.status === 'NS' ? (
                <div className="clay-inset px-4 py-2 rounded-2xl">
                  <span className="text-xs font-black text-[#7138E8] dark:text-[#8B5CF6] block mb-1">
                    KICK-OFF
                  </span>
                  <span className="text-lg font-mono font-black text-[#211B35] dark:text-[#F5F3FC]">
                    {kickOffEAT} EAT
                  </span>
                </div>
              ) : (
                <div className="clay-inset px-5 py-2.5 rounded-2xl mb-1">
                  <div className="font-mono text-3xl font-black tabular-nums tracking-wider text-[#211B35] dark:text-[#F5F3FC]">
                    <span>{fixture.score.home ?? 0}</span>
                    <span className="mx-2 text-[#6C6285] dark:text-[#968DB8]">:</span>
                    <span>{fixture.score.away ?? 0}</span>
                  </div>
                </div>
              )}

              <div className="mt-2">
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm shadow-rose-600/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    {fixture.minute ? `${fixture.minute}' IN PLAY` : 'LIVE'}
                  </span>
                ) : (
                  <span className="text-xs font-black text-[#514966] dark:text-[#B8B0D3]">
                    {fixture.statusText || fixture.status}
                  </span>
                )}
              </div>
            </div>

            {/* Away Team */}
            <div
              className="flex-1 flex flex-col items-center cursor-pointer group"
              onClick={() => onSelectTeam && onSelectTeam(fixture.awayTeam.id)}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#DDD8EC] dark:bg-[#272042] p-2 clay-card flex items-center justify-center mb-2 shadow-md group-hover:scale-105 transition-transform border border-[#C9C2DD] dark:border-[#362C52]">
                {fixture.awayTeam.crest ? (
                  <img
                    src={fixture.awayTeam.crest}
                    alt={fixture.awayTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <Shield className="w-8 h-8 text-[#7138E8] dark:text-[#8B5CF6]" />
                )}
              </div>
              <h3 className="font-black text-sm text-[#211B35] dark:text-[#F5F3FC] text-center leading-tight">
                {fixture.awayTeam.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Tab Controls (Segmented Clay Buttons) */}
        <div className="p-3 bg-[#E6E3F2] dark:bg-[#1E1833] border-b border-[#C9C2DD] dark:border-[#362C52] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max mx-auto justify-center">
            {(
              [
                { id: 'overview', label: 'Overview', icon: AlertCircle },
                { id: 'events', label: 'Events', icon: List },
                { id: 'stats', label: 'Statistics', icon: BarChart2 },
                { id: 'lineups', label: 'Lineups', icon: Users },
                { id: 'h2h', label: 'Head-to-Head', icon: History },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                    isActive ? 'clay-pill-active' : 'clay-pill-inactive'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* Venue & Match Info Card */}
              <div className="clay-card p-4 space-y-3">
                <h4 className="text-xs font-black text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider">
                  Match Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#DDD8EC]/60 dark:bg-[#272042]/60 border border-[#C9C2DD]/60 dark:border-[#362C52]/60">
                    <Clock className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
                    <div>
                      <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block">
                        Kick-Off (East Africa Time)
                      </span>
                      <span className="font-black text-xs text-[#211B35] dark:text-[#F5F3FC]">
                        {fullDateTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#DDD8EC]/60 dark:bg-[#272042]/60 border border-[#C9C2DD]/60 dark:border-[#362C52]/60">
                    <MapPin className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
                    <div>
                      <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block">
                        Stadium Venue
                      </span>
                      <span className="font-black text-xs text-[#211B35] dark:text-[#F5F3FC]">
                        {fixture.venue || 'National Stadium'}
                      </span>
                    </div>
                  </div>

                  {fixture.referee && (
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#DDD8EC]/60 dark:bg-[#272042]/60 border border-[#C9C2DD]/60 dark:border-[#362C52]/60 sm:col-span-2">
                      <User className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
                      <div>
                        <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block">
                          Referee
                        </span>
                        <span className="font-black text-xs text-[#211B35] dark:text-[#F5F3FC]">
                          {fixture.referee}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Form Preview */}
              <div className="clay-card p-4">
                <h4 className="text-xs font-black text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider mb-3">
                  Recent Form
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-[#211B35] dark:text-[#F5F3FC]">
                      {fixture.homeTeam.name}
                    </span>
                    <div className="flex items-center gap-1 font-mono font-bold">
                      {['W', 'W', 'D', 'W', 'L'].map((res, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] text-white ${
                            res === 'W'
                              ? 'bg-emerald-500'
                              : res === 'D'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-[#211B35] dark:text-[#F5F3FC]">
                      {fixture.awayTeam.name}
                    </span>
                    <div className="flex items-center gap-1 font-mono font-bold">
                      {['D', 'W', 'W', 'L', 'W'].map((res, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] text-white ${
                            res === 'W'
                              ? 'bg-emerald-500'
                              : res === 'D'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVENTS TIMELINE */}
          {activeTab === 'events' && (
            <div className="clay-card p-4">
              <h4 className="text-xs font-black text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider mb-4">
                Match Timeline
              </h4>

              {events.length === 0 ? (
                <div className="text-center py-8 text-sm font-bold text-[#514966] dark:text-[#B8B0D3]">
                  No events recorded yet for this fixture.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#C9C2DD] dark:before:bg-[#362C52]">
                  {events.map((ev) => {
                    const isHome = ev.team.id === fixture.homeTeam.id;
                    const isGoal = ev.type === 'Goal';
                    const isCard = ev.type === 'Card';

                    return (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 relative pl-4 text-xs"
                      >
                        {/* Minute Circle */}
                        <div className="w-8 h-8 rounded-full bg-[#DDD8EC] dark:bg-[#272042] text-[#7138E8] dark:text-[#8B5CF6] font-mono font-black text-xs flex items-center justify-center shrink-0 border border-[#C9C2DD] dark:border-[#362C52] shadow-xs">
                          {ev.time.elapsed}&apos;
                        </div>

                        {/* Event Details Box */}
                        <div
                          className={`flex-1 p-2.5 rounded-xl clay-card ${
                            isHome ? 'border-l-4 border-l-[#7138E8]' : 'border-r-4 border-r-[#8B5CF6]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-[#211B35] dark:text-[#F5F3FC]">
                              {ev.player.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                isGoal
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : isCard
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                              }`}
                            >
                              {isGoal ? '⚽ GOAL' : isCard ? '🟨 CARD' : '🔄 SUB'}
                            </span>
                          </div>

                          <div className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3] mt-0.5">
                            {ev.team.name} · {ev.detail}
                            {ev.assist && ` (Assist: ${ev.assist.name})`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STATISTICS */}
          {activeTab === 'stats' && (
            <div className="clay-card p-4 space-y-4">
              <h4 className="text-xs font-black text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider mb-2">
                Team Statistics
              </h4>

              {homeStat && awayStat ? (
                <div className="space-y-4">
                  {/* Possession */}
                  <div>
                    <div className="flex justify-between text-xs font-black mb-1 text-[#211B35] dark:text-[#F5F3FC]">
                      <span>{homeStat.possession ?? 50}%</span>
                      <span className="text-[#514966] dark:text-[#B8B0D3] uppercase font-bold">Possession</span>
                      <span>{awayStat.possession ?? 50}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#DDD8EC] dark:bg-[#272042] overflow-hidden flex border border-[#C9C2DD] dark:border-[#362C52]">
                      <div
                        className="bg-[#7138E8] transition-all duration-500"
                        style={{ width: `${homeStat.possession ?? 50}%` }}
                      />
                      <div
                        className="bg-[#8B5CF6] transition-all duration-500"
                        style={{ width: `${awayStat.possession ?? 50}%` }}
                      />
                    </div>
                  </div>

                  {/* Stat Rows */}
                  {[
                    { label: 'Total Shots', h: homeStat.totalShots, a: awayStat.totalShots },
                    { label: 'Shots on Target', h: homeStat.shotsOnTarget, a: awayStat.shotsOnTarget },
                    { label: 'Corners', h: homeStat.corners, a: awayStat.corners },
                    { label: 'Fouls', h: homeStat.fouls, a: awayStat.fouls },
                    { label: 'Yellow Cards', h: homeStat.yellowCards, a: awayStat.yellowCards },
                    { label: 'Passes Completed', h: homeStat.passes, a: awayStat.passes },
                    { label: 'Passing Accuracy', h: `${homeStat.passAccuracy ?? 80}%`, a: `${awayStat.passAccuracy ?? 80}%` },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#C9C2DD]/60 dark:border-[#362C52]/60 text-xs">
                      <span className="font-mono font-black text-[#211B35] dark:text-[#F5F3FC] w-12">
                        {row.h ?? '-'}
                      </span>
                      <span className="text-[#514966] dark:text-[#B8B0D3] font-bold text-center flex-1">
                        {row.label}
                      </span>
                      <span className="font-mono font-black text-[#211B35] dark:text-[#F5F3FC] w-12 text-right">
                        {row.a ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm font-bold text-[#514966] dark:text-[#B8B0D3]">
                  Statistics are not yet available for this match.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LINEUPS */}
          {activeTab === 'lineups' && (
            <div className="space-y-4">
              {lineups.length > 0 ? (
                lineups.map((lineup, i) => (
                  <div key={i} className="clay-card p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#C9C2DD] dark:border-[#362C52]">
                      <div>
                        <h4 className="font-black text-sm text-[#211B35] dark:text-[#F5F3FC]">
                          {lineup.team.name}
                        </h4>
                        <p className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                          Formation: {lineup.formation} · Coach: {lineup.coach?.name}
                        </p>
                      </div>
                    </div>

                    <h5 className="text-[11px] font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
                      Starting XI
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {lineup.startXI.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-[#DDD8EC]/40 dark:bg-[#272042]/40 border border-[#C9C2DD]/40 dark:border-[#362C52]/40"
                        >
                          <span className="w-5 h-5 rounded-md bg-[#7138E8] text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                            {player.number}
                          </span>
                          <span className="font-black text-[#211B35] dark:text-[#F5F3FC] truncate">
                            {player.name}
                          </span>
                          <span className="ml-auto text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                            {player.pos}
                          </span>
                        </div>
                      ))}
                    </div>

                    <h5 className="text-[11px] font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3] pt-2">
                      Substitutes
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {lineup.substitutes.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-[#DDD8EC]/20 dark:bg-[#272042]/20"
                        >
                          <span className="w-5 h-5 rounded-md bg-[#DDD8EC] dark:bg-[#272042] text-[#211B35] dark:text-[#F5F3FC] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#C9C2DD] dark:border-[#362C52]">
                            {sub.number}
                          </span>
                          <span className="text-[#514966] dark:text-[#B8B0D3] font-bold truncate">
                            {sub.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm font-bold text-[#514966] dark:text-[#B8B0D3]">
                  Official team lineups will be announced closer to kick-off.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HEAD TO HEAD */}
          {activeTab === 'h2h' && (
            <div className="clay-card p-4 space-y-4">
              <h4 className="text-xs font-black text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider">
                Head-to-Head History
              </h4>

              {h2h ? (
                <div className="space-y-3">
                  {/* Summary Bar */}
                  <div className="p-3 rounded-2xl clay-inset grid grid-cols-3 text-center text-xs">
                    <div>
                      <span className="font-mono text-lg font-black text-[#7138E8] dark:text-[#8B5CF6] block">
                        {h2h.team1Wins}
                      </span>
                      <span className="text-[10px] text-[#514966] dark:text-[#B8B0D3] font-bold">
                        {fixture.homeTeam.name.split(' ')[0]} Wins
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-lg font-black text-[#211B35] dark:text-[#F5F3FC] block">
                        {h2h.draws}
                      </span>
                      <span className="text-[10px] text-[#514966] dark:text-[#B8B0D3] font-bold">
                        Draws
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-lg font-black text-[#8B5CF6] block">
                        {h2h.team2Wins}
                      </span>
                      <span className="text-[10px] text-[#514966] dark:text-[#B8B0D3] font-bold">
                        {fixture.awayTeam.name.split(' ')[0]} Wins
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#514966] dark:text-[#B8B0D3] font-bold text-center pt-2">
                    Across the last {h2h.totalMatches} meetings in all competitions.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-sm font-bold text-[#514966] dark:text-[#B8B0D3]">
                  Past meeting records loading...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
