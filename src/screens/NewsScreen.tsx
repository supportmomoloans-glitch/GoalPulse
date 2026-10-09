import React, { useState } from 'react';
import { ExternalLink, Clock, Newspaper, Sparkles, Filter } from 'lucide-react';
import type { NewsArticle } from '../types/football.ts';
import newsBannerImg from '../assets/images/goalpulse_news_banner_1791503558709.jpg';
import { BannerAd } from '../components/BannerAd.tsx';

interface NewsScreenProps {
  articles: NewsArticle[];
}

export const NewsScreen: React.FC<NewsScreenProps> = ({ articles }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Champions League', 'Kenyan Premier League', 'Premier League', 'La Liga'];

  const filtered = selectedCategory === 'ALL'
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  const heroArticle = articles[0];

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* Editorial Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden clay-card shadow-lg border border-[#C9C2DD] dark:border-[#362C52]">
        <div className="relative h-44 sm:h-52 w-full overflow-hidden">
          <img
            src={newsBannerImg}
            alt="Football News Banner"
            className="w-full h-full object-cover brightness-[0.8] contrast-[1.1]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151124] via-[#151124]/40 to-transparent" />

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-[#7138E8] text-white uppercase inline-block mb-1.5 shadow-sm border border-white/20">
              Featured Analysis
            </span>
            <h2 className="text-base sm:text-lg font-black leading-snug drop-shadow-sm">
              Tactical Previews, League Roundups & Mashemeji Derby Special
            </h2>
            <p className="text-xs font-bold text-purple-200 line-clamp-1 mt-1">
              Curated official reporting and tactical breakdowns across African & European football
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-black shrink-0 transition-all ${
                isActive ? 'clay-pill-active' : 'clay-pill-inactive'
              }`}
            >
              {cat === 'ALL' ? 'All Headlines' : cat}
            </button>
          );
        })}
      </div>

      {/* Article Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="clay-card p-4 flex flex-col justify-between group hover:border-[#7138E8] dark:hover:border-[#8B5CF6] transition-all"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-black text-[#7138E8] dark:text-[#8B5CF6] mb-2">
                <span>{article.category}</span>
                <span className="text-[#514966] dark:text-[#B8B0D3] flex items-center gap-1 font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#35264F] dark:text-[#DDD6FE] stroke-[2.5]" />
                  {article.readTimeMinutes} min read
                </span>
              </div>

              <h3 className="font-black text-sm text-[#211B35] dark:text-[#F5F3FC] group-hover:text-[#7138E8] dark:group-hover:text-[#8B5CF6] transition-colors leading-snug mb-2">
                {article.title}
              </h3>

              <p className="text-xs font-bold text-[#514966] dark:text-[#B8B0D3] line-clamp-3 leading-relaxed mb-4">
                {article.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-[#C9C2DD] dark:border-[#362C52] flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                Source: {article.source}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-black text-[#7138E8] dark:text-[#8B5CF6] group-hover:translate-x-0.5 transition-transform">
                Read Source <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* AdMob Placement */}
      <BannerAd />
    </div>
  );
};
