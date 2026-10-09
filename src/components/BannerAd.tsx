import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface BannerAdProps {
  className?: string;
  isTestMode?: boolean;
}

export const BannerAd: React.FC<BannerAdProps> = ({
  className = '',
  isTestMode = true,
}) => {
  return (
    <div
      className={`mx-auto w-full max-w-sm rounded-2xl p-2.5 clay-card text-center overflow-hidden border border-[#C9C2DD] dark:border-[#362C52] ${className}`}
      aria-label="Advertisement Banner"
    >
      <div className="flex items-center justify-between text-[10px] font-black text-[#514966] dark:text-[#B8B0D3] mb-1.5 px-2">
        <span className="uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#DDD8EC] dark:bg-[#272042] text-[#211B35] dark:text-[#F5F3FC] font-black border border-[#C9C2DD] dark:border-[#362C52]">
          AD · Google Mobile Ads
        </span>
        <span className="flex items-center gap-1 font-mono text-[9px] font-bold">
          SPONSORED · 320x50
        </span>
      </div>

      <div className="h-14 rounded-xl bg-[#DDD8EC]/70 dark:bg-[#272042]/70 flex items-center justify-between px-3.5 border border-[#C9C2DD]/60 dark:border-[#362C52]/60">
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-lg bg-[#7138E8] text-white flex items-center justify-center font-black text-xs shadow-sm shadow-purple-500/20">
            GP
          </div>
          <div>
            <p className="text-xs font-black text-[#211B35] dark:text-[#F5F3FC] leading-tight">
              GoalPulse Pro Pass
            </p>
            <p className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">
              Live audio commentary & instant match alerts
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            // Production AdMob / sponsorship banner action
          }}
          className="px-2.5 py-1.5 rounded-lg clay-button-primary text-[10px] font-black text-white shrink-0"
        >
          Explore
        </button>
      </div>
    </div>
  );
};
