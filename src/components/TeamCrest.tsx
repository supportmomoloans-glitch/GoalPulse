import React, { useState } from 'react';
import { Shield, Trophy } from 'lucide-react';

interface TeamCrestProps {
  name: string;
  crest?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TeamCrest: React.FC<TeamCrestProps> = ({
  name,
  crest,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-[11px]',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }[size];

  const initials = (name || 'FC')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  if (!crest || hasError) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-[#DDD8EC] dark:bg-[#272042] border border-[#C9C2DD] dark:border-[#362C52] flex items-center justify-center font-black text-[#35264F] dark:text-[#DDD6FE] shrink-0 shadow-xs ${className}`}
        title={name}
        aria-label={name}
      >
        {initials.length > 0 ? (
          <span>{initials}</span>
        ) : (
          <Shield className={`${iconSizes} text-[#7138E8] dark:text-[#A78BFA]`} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl bg-[#DDD8EC]/40 dark:bg-[#272042]/40 border border-[#C9C2DD]/60 dark:border-[#362C52]/60 p-0.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden ${className}`}
    >
      <img
        src={crest}
        alt={name}
        className="w-full h-full object-contain"
        onError={() => setHasError(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

interface CompetitionBadgeProps {
  name: string;
  emblem?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const CompetitionBadge: React.FC<CompetitionBadgeProps> = ({
  name,
  emblem,
  size = 'sm',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
  }[size];

  if (!emblem || hasError) {
    return (
      <div
        className={`${sizeClasses} rounded-md bg-[#DDD8EC] dark:bg-[#272042] border border-[#C9C2DD] dark:border-[#362C52] flex items-center justify-center shrink-0 text-[#7138E8] dark:text-[#A78BFA] ${className}`}
        title={name}
      >
        <Trophy className="w-3 h-3 stroke-[2.2]" />
      </div>
    );
  }

  return (
    <img
      src={emblem}
      alt={name}
      className={`${sizeClasses} object-contain shrink-0 ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};
