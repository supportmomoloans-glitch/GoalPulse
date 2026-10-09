import React, { useState, useEffect } from 'react';
import { Trophy, ChevronDown, Award, Users, Table, Shield } from 'lucide-react';
import type { Competition, StandingRow, TopScorer } from '../types/football.ts';
import { api } from '../services/api.ts';

interface CompetitionsScreenProps {
  competitions: Competition[];
  selectedLeagueId?: number;
  onSelectTeam: (teamId: number) => void;
}

type SubTab = 'standings' | 'scorers' | 'teams';

export const CompetitionsScreen: React.FC<CompetitionsScreenProps> = ({
  competitions,
  selectedLeagueId: initialLeagueId,
  onSelectTeam,
}) => {
  const [selectedComp, setSelectedComp] = useState<Competition>(
    () =>
      competitions.find((c) => c.id === initialLeagueId) ||
      competitions[0] || {
        id: 39,
        name: 'Premier League',
        code: 'PL',
        country: 'England',
        emblem: 'https://media.api-sports.io/football/leagues/39.png',
        season: 2024,
      }
  );

  const [activeTab, setActiveTab] = useState<SubTab>('standings');
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [season, setSeason] = useState<number>(2024);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync if initialLeagueId changes from external click
  useEffect(() => {
    if (initialLeagueId) {
      const found = competitions.find((c) => c.id === initialLeagueId);
      if (found) setSelectedComp(found);
    }
  }, [initialLeagueId, competitions]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      api.getStandings(selectedComp.id, season),
      api.getTopScorers(selectedComp.id, season),
    ]).then(([standingsRes, scorersRes]) => {
      if (!isMounted) return;
      if (standingsRes.status === 'fulfilled') setStandings(standingsRes.value.data);
      if (scorersRes.status === 'fulfilled') setTopScorers(scorersRes.value.data);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedComp, season]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* League Selection Scroller */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {competitions.map((comp) => {
          const isSelected = selectedComp.id === comp.id;
          return (
            <button
              key={comp.id}
              onClick={() => setSelectedComp(comp)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
                isSelected ? 'clay-pill-active' : 'clay-pill-inactive'
              }`}
            >
              <img
                src={comp.emblem}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="whitespace-nowrap">{comp.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected League Header Banner */}
      <div className="clay-card p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#DDD8EC] dark:bg-[#272042] p-2 clay-card flex items-center justify-center shrink-0 border border-[#C9C2DD] dark:border-[#362C52]">
            <img
              src={selectedComp.emblem}
              alt={selectedComp.name}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#211B35] dark:text-[#F5F3FC]">
              {selectedComp.name}
            </h2>
            <p className="text-xs font-bold text-[#514966] dark:text-[#B8B0D3]">
              {selectedComp.country} · Season {season}/{season + 1}
            </p>
          </div>
        </div>

        {/* Season Selector */}
        <select
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="clay-button text-xs font-black px-3 py-1.5 rounded-xl outline-none text-[#7138E8] dark:text-[#8B5CF6]"
        >
          <option value={2024}>2024/25</option>
          <option value={2023}>2023/24</option>
        </select>
      </div>

      {/* Sub Tabs: Standings vs Top Scorers */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl clay-inset self-start">
        {(
          [
            { id: 'standings', label: 'League Table', icon: Table },
            { id: 'scorers', label: 'Top Scorers', icon: Award },
            { id: 'teams', label: 'Club Profiles', icon: Users },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                isActive ? 'clay-pill-active' : 'text-[#514966] dark:text-[#B8B0D3] hover:text-[#211B35] dark:hover:text-[#F5F3FC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="clay-card p-12 text-center text-xs font-bold text-[#514966] dark:text-[#B8B0D3]">
          Loading official league tables & statistics...
        </div>
      ) : (
        <>
          {/* TAB 1: STANDINGS TABLE */}
          {activeTab === 'standings' && (
            <div className="clay-card p-3 sm:p-4 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#C9C2DD] dark:border-[#362C52] text-[11px] font-black text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider">
                      <th className="py-2.5 px-2 text-center w-8">#</th>
                      <th className="py-2.5 px-2 min-w-[130px]">Club</th>
                      <th className="py-2.5 px-2 text-center">PL</th>
                      <th className="py-2.5 px-2 text-center">W</th>
                      <th className="py-2.5 px-2 text-center">D</th>
                      <th className="py-2.5 px-2 text-center">L</th>
                      <th className="py-2.5 px-2 text-center">GD</th>
                      <th className="py-2.5 px-2 text-center font-black text-[#7138E8] dark:text-[#8B5CF6]">PTS</th>
                      <th className="py-2.5 px-2 text-center hidden md:table-cell">Form</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9C2DD]/60 dark:divide-[#362C52]/60 font-semibold">
                    {standings.map((row) => (
                      <tr
                        key={row.team.id}
                        onClick={() => onSelectTeam(row.team.id)}
                        className="hover:bg-[#DDD8EC]/40 dark:hover:bg-[#272042]/40 cursor-pointer transition-colors"
                      >
                        {/* Position */}
                        <td className="py-2.5 px-2 text-center font-mono font-black text-xs">
                          <span
                            className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center font-black ${
                              row.rank <= 4
                                ? 'bg-purple-200 dark:bg-purple-950 text-[#581c87] dark:text-[#c4b5fd]'
                                : 'text-[#211B35] dark:text-[#F5F3FC]'
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>

                        {/* Team Name & Crest */}
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            {row.team.crest ? (
                              <img
                                src={row.team.crest}
                                alt=""
                                className="w-5 h-5 object-contain shrink-0"
                                onError={(e) => {
                                   (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Shield className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6]" />
                            )}
                            <span className="font-black text-[#211B35] dark:text-[#F5F3FC] truncate">
                              {row.team.name}
                            </span>
                          </div>
                        </td>

                        {/* Stats */}
                        <td className="py-2.5 px-2 text-center font-mono font-bold tabular-nums text-[#211B35] dark:text-[#F5F3FC]">{row.played}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold tabular-nums text-[#211B35] dark:text-[#F5F3FC]">{row.win}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold tabular-nums text-[#211B35] dark:text-[#F5F3FC]">{row.draw}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold tabular-nums text-[#211B35] dark:text-[#F5F3FC]">{row.lose}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold tabular-nums text-[#211B35] dark:text-[#F5F3FC]">
                          {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-black text-[#7138E8] dark:text-[#8B5CF6] text-sm tabular-nums">
                          {row.points}
                        </td>

                        {/* Form */}
                        <td className="py-2.5 px-2 text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1 font-mono text-[9px] font-bold">
                            {(row.form || 'WDWLW').split('').slice(-5).map((char, ci) => (
                              <span
                                key={ci}
                                className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                                  char === 'W'
                                    ? 'bg-emerald-500'
                                    : char === 'D'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              >
                                {char}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TOP SCORERS */}
          {activeTab === 'scorers' && (
            <div className="clay-card p-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3] mb-1">
                Golden Boot Race · Season {season}
              </h3>

              <div className="space-y-2">
                {topScorers.map((scorer) => (
                  <div
                    key={scorer.player.id}
                    className="clay-card p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm text-[#7138E8] dark:text-[#8B5CF6] w-5 text-center">
                        {scorer.rank}
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-[#211B35] dark:text-[#F5F3FC]">
                          {scorer.player.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                          <span>{scorer.team.name}</span>
                          {scorer.player.nationality && (
                            <span>· {scorer.player.nationality}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-base text-[#7138E8] dark:text-[#8B5CF6] block">
                        {scorer.goals} Goals
                      </span>
                      {scorer.assists !== undefined && (
                        <span className="text-[10px] font-bold text-[#6C6285] dark:text-[#968DB8]">
                          {scorer.assists} Assists ({scorer.played ?? 20} matches)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TEAMS DIRECTORY */}
          {activeTab === 'teams' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {standings.map((row) => (
                <button
                  key={row.team.id}
                  onClick={() => onSelectTeam(row.team.id)}
                  className="clay-card p-4 flex flex-col items-center text-center group hover:border-[#7138E8] dark:hover:border-[#8B5CF6] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#DDD8EC] dark:bg-[#272042] p-2 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform border border-[#C9C2DD] dark:border-[#362C52]">
                    {row.team.crest ? (
                      <img
                        src={row.team.crest}
                        alt={row.team.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Shield className="w-6 h-6 text-[#7138E8] dark:text-[#8B5CF6]" />
                    )}
                  </div>
                  <h4 className="font-black text-xs text-[#211B35] dark:text-[#F5F3FC] line-clamp-1">
                    {row.team.name}
                  </h4>
                  <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] mt-0.5">
                    Rank #{row.rank} · {row.points} pts
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
