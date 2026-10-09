import React, { useState, useEffect } from 'react';
import { X, Star, Shield, MapPin, Calendar, Award, TrendingUp } from 'lucide-react';
import type { Team, TeamStatsSummary } from '../types/football.ts';
import { api } from '../services/api.ts';

interface TeamModalProps {
  teamId: number | null;
  onClose: () => void;
  isFavourite: boolean;
  onToggleFavourite: (teamId: number) => void;
  onSelectCompetition?: (leagueId: number) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  teamId,
  onClose,
  isFavourite,
  onToggleFavourite,
  onSelectCompetition,
}) => {
  const [profile, setProfile] = useState<(Team & { stats: TeamStatsSummary }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);

    api.getTeamProfile(teamId).then((res) => {
      setProfile(res.data);
      setLoading(false);
    });
  }, [teamId]);

  if (!teamId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#E6E3F2] dark:bg-[#1E1833] w-full max-w-lg max-h-[90vh] sm:rounded-3xl rounded-t-3xl flex flex-col shadow-2xl border border-[#C9C2DD] dark:border-[#362C52] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#E6E3F2] dark:bg-[#1E1833] border-b border-[#C9C2DD] dark:border-[#362C52] flex items-center justify-between">
          <span className="text-xs font-black text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider">
            Team Profile
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE] hover:text-[#211B35] dark:hover:text-[#F5F3FC]"
            aria-label="Close team profile"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading || !profile ? (
            <div className="text-center py-12 text-sm font-bold text-[#514966] dark:text-[#B8B0D3]">
              Loading club information...
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="clay-card p-5 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-[#DDD8EC] dark:bg-[#272042] p-3 clay-card flex items-center justify-center mb-3 border border-[#C9C2DD] dark:border-[#362C52]">
                  {profile.crest ? (
                    <img
                      src={profile.crest}
                      alt={profile.name}
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <Shield className="w-10 h-10 text-[#7138E8] dark:text-[#8B5CF6]" />
                  )}
                </div>

                <h3 className="text-xl font-black text-[#211B35] dark:text-[#F5F3FC] mb-1">
                  {profile.name}
                </h3>
                <p className="text-xs font-bold text-[#514966] dark:text-[#B8B0D3] mb-4">
                  {profile.country} · Founded {profile.founded || 1900}
                </p>

                {/* Follow Button */}
                <button
                  onClick={() => onToggleFavourite(profile.id)}
                  className={`px-5 py-2 rounded-2xl font-black text-xs flex items-center gap-2 transition-all ${
                    isFavourite
                      ? 'clay-pill-active'
                      : 'clay-pill-inactive hover:border-[#7138E8]'
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      isFavourite ? 'fill-white text-white' : 'text-amber-500 fill-amber-400'
                    }`}
                  />
                  {isFavourite ? 'Following Team' : 'Follow Team'}
                </button>
              </div>

              {/* Stadium & Location */}
              {profile.venue && (
                <div className="clay-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl clay-button flex items-center justify-center text-[#7138E8] dark:text-[#8B5CF6] shrink-0">
                    <MapPin className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#514966] dark:text-[#B8B0D3]">
                      Home Stadium
                    </h4>
                    <p className="text-sm font-black text-[#211B35] dark:text-[#F5F3FC]">
                      {profile.venue.name} ({profile.venue.city})
                    </p>
                    {profile.venue.capacity && (
                      <p className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                        Capacity: {profile.venue.capacity.toLocaleString()} seats
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Season Stats Summary */}
              {profile.stats && (
                <div className="clay-card p-4 space-y-3">
                  <h4 className="text-xs font-black text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider">
                    Season Performance
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl clay-inset">
                      <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block">
                        Recent Form
                      </span>
                      <span className="font-mono font-black text-sm text-[#7138E8] dark:text-[#8B5CF6]">
                        {profile.stats.form}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl clay-inset">
                      <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block">
                        Clean Sheets
                      </span>
                      <span className="font-mono font-black text-sm text-[#211B35] dark:text-[#F5F3FC]">
                        {profile.stats.cleanSheets} matches
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl clay-inset">
                      <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block">
                        Avg Goals / Match
                      </span>
                      <span className="font-mono font-black text-sm text-[#211B35] dark:text-[#F5F3FC]">
                        {profile.stats.goalsAvg}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl clay-inset">
                      <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] block">
                        Penalties Converted
                      </span>
                      <span className="font-mono font-black text-sm text-[#211B35] dark:text-[#F5F3FC]">
                        {profile.stats.penaltyConversion}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
