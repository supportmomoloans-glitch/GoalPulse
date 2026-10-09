import React, { useState, useEffect } from 'react';
import { Search, X, Shield, Trophy, Calendar, ArrowRight } from 'lucide-react';
import type { Team, Competition, Fixture } from '../types/football.ts';
import { api } from '../services/api.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMatch: (fixture: Fixture) => void;
  onSelectTeam: (teamId: number) => void;
  onSelectCompetition: (leagueId: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMatch,
  onSelectTeam,
  onSelectCompetition,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    teams: Team[];
    competitions: Competition[];
    fixtures: Fixture[];
  }>({ teams: [], competitions: [], fixtures: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ teams: [], competitions: [], fixtures: [] });
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.search(query).then((res) => {
        setResults(res);
        setLoading(false);
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 animate-in fade-in duration-200">
      <div className="bg-[#E6E3F2] dark:bg-[#1E1833] w-full max-w-xl max-h-[85vh] rounded-3xl flex flex-col shadow-2xl border border-[#C9C2DD] dark:border-[#362C52] overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 bg-[#E6E3F2] dark:bg-[#1E1833] border-b border-[#C9C2DD] dark:border-[#362C52] flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl clay-inset">
            <Search className="w-5 h-5 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clubs, leagues, or fixtures..."
              className="bg-transparent text-sm w-full outline-none font-black text-[#211B35] dark:text-[#F5F3FC] placeholder:text-[#514966] dark:placeholder:text-[#B8B0D3]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-[#35264F] dark:text-[#DDD6FE] hover:text-[#211B35]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE] hover:text-[#211B35] shrink-0"
            aria-label="Close search"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="text-center py-8 text-xs font-black text-[#514966] dark:text-[#B8B0D3]">
              Searching live records...
            </div>
          )}

          {!loading && !query && (
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {['Gor Mahia', 'Arsenal', 'Premier League', 'Chelsea', 'Real Madrid', 'FKF Premier League'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black clay-button hover:border-[#7138E8] dark:hover:border-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FC]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query && (
            <>
              {/* Competitions */}
              {results.competitions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
                    Competitions
                  </span>
                  <div className="space-y-1.5">
                    {results.competitions.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => {
                          onSelectCompetition(comp.id);
                          onClose();
                        }}
                        className="clay-card p-2.5 flex items-center justify-between cursor-pointer hover:border-[#7138E8] dark:hover:border-[#8B5CF6]"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={comp.emblem}
                            alt=""
                            className="w-5 h-5 object-contain"
                          />
                          <span className="text-xs font-black text-[#211B35] dark:text-[#F5F3FC]">
                            {comp.name} ({comp.country})
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teams */}
              {results.teams.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
                    Teams
                  </span>
                  <div className="space-y-1.5">
                    {results.teams.map((team) => (
                      <div
                        key={team.id}
                        onClick={() => {
                          onSelectTeam(team.id);
                          onClose();
                        }}
                        className="clay-card p-2.5 flex items-center justify-between cursor-pointer hover:border-[#7138E8] dark:hover:border-[#8B5CF6]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#DDD8EC] dark:bg-[#272042] p-1 flex items-center justify-center border border-[#C9C2DD] dark:border-[#362C52]">
                            {team.crest ? (
                              <img
                                src={team.crest}
                                alt={team.name}
                                className="w-5 h-5 object-contain"
                              />
                            ) : (
                              <Shield className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6]" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-black text-[#211B35] dark:text-[#F5F3FC] block">
                              {team.name}
                            </span>
                            {team.country && (
                              <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                                {team.country}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixtures */}
              {results.fixtures.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
                    Matches
                  </span>
                  <div className="space-y-1.5">
                    {results.fixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        onClick={() => {
                          onSelectMatch(fixture);
                          onClose();
                        }}
                        className="clay-card p-2.5 flex items-center justify-between cursor-pointer hover:border-[#7138E8] dark:hover:border-[#8B5CF6] text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-black text-[#211B35] dark:text-[#F5F3FC]">
                            {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                          </span>
                        </div>
                        <span className="font-mono font-black text-xs text-[#7138E8] dark:text-[#8B5CF6] shrink-0 ml-2">
                          {fixture.status === 'NS' ? 'Scheduled' : `${fixture.score.home ?? 0} - ${fixture.score.away ?? 0}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.competitions.length === 0 &&
                results.teams.length === 0 &&
                results.fixtures.length === 0 && (
                  <div className="text-center py-10 text-xs font-bold text-[#514966] dark:text-[#B8B0D3]">
                    No matches, teams, or competitions found matching &quot;{query}&quot;.
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
