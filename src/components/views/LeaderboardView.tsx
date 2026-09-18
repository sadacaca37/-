import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Sparkles, 
  Flame, 
  Calendar, 
  Gauge, 
  CheckCircle, 
  RotateCcw,
  BookOpen,
  FileText
} from 'lucide-react';
import { LeaderboardEntry } from '../../types';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  onClearLeaderboard?: () => void;
  onStartSentencePractice: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  onClearLeaderboard,
  onStartSentencePractice,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');

  // Strictly filter for Sentence Practice mode entries (as user requested)
  // And filter by selected grade if not 'all'
  const sentenceEntries = entries
    .filter((e) => e.mode === 'sentence' || !e.mode) // only sentence practice
    .map((e, index) => ({
      ...e,
      // If entry has no grade explicitly set, provide a deterministic grade 1~6 for rich presentation
      grade: e.grade || ((index % 6) + 1),
    }))
    .filter((e) => selectedGrade === 'all' || e.grade === selectedGrade)
    .sort((a, b) => b.cpm - a.cpm); // sorted by CPM descending

  const top1 = sentenceEntries[0];
  const top2 = sentenceEntries[1];
  const top3 = sentenceEntries[2];

  const gradeList: Array<{ id: number | 'all'; label: string; icon: string }> = [
    { id: 'all', label: '전체 학년', icon: '🌟' },
    { id: 1, label: '1학년', icon: '🐣' },
    { id: 2, label: '2학년', icon: '🌱' },
    { id: 3, label: '3학년', icon: '🌸' },
    { id: 4, label: '4학년', icon: '🚀' },
    { id: 5, label: '5학년', icon: '⚡' },
    { id: 6, label: '6학년', icon: '👑' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-yellow-300 shadow-xl relative overflow-hidden arcade-card-glow text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
            <Crown className="w-4 h-4 text-amber-600" />
            <span>학년별 짧은 글 타자왕 명예의 전당</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-arcade">
            🏆 명예의 전당 (1~6학년 학년별 랭킹)
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            <strong className="text-pink-600">[짧은 글 연습]</strong>에서 기록한 최고 타수(CPM)와 정확도로 1~6학년 각 학년별 등수가 집계됩니다.
            우리 학년 1등 트로피의 주인공에 도전해 보세요!
          </p>
        </div>

        {/* Action Button to Start Sentence Practice */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={onStartSentencePractice}
            className="arcade-btn-pink text-white px-5 py-3 rounded-2xl font-black text-sm shadow-md flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <FileText className="w-4 h-4" />
            <span>짧은 글 연습하고 랭킹 등록하기</span>
          </button>
        </div>
      </div>

      {/* Grade Filter Tabs (1~6학년 + 전체) */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-3xl border-2 border-pink-200 shadow-md flex items-center gap-2 overflow-x-auto no-scrollbar">
        {gradeList.map((tab) => {
          const isActive = selectedGrade === tab.id;
          return (
            <button
              key={String(tab.id)}
              onClick={() => setSelectedGrade(tab.id)}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md scale-105 ring-2 ring-pink-300'
                  : 'bg-pink-50 text-slate-700 hover:bg-pink-100 hover:text-pink-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {isActive && (
                <span className="ml-1 bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
                  {sentenceEntries.length}명
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Top 3 Podium (1등, 2등, 3등) */}
      {sentenceEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4">
          {/* 2nd Place (Left) */}
          <div className="order-2 md:order-1 bg-white rounded-3xl p-6 border-4 border-slate-200 shadow-md flex flex-col items-center text-center relative mt-0 md:mt-6">
            <div className="absolute -top-5 w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-black text-sm border-2 border-white shadow-md">
              🥈 2위
            </div>
            {top2 ? (
              <div className="space-y-2 mt-2 w-full">
                <span className="text-4xl block">{top2.userAvatar || '🥈'}</span>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-300">
                    {top2.grade}학년
                  </span>
                  <h3 className="font-black text-slate-900 text-lg">{top2.userName}</h3>
                </div>
                <div className="bg-slate-50 py-2 px-3 rounded-2xl border border-slate-200">
                  <p className="text-2xl font-black text-slate-700 font-mono">{top2.cpm} <span className="text-xs text-slate-400">CPM</span></p>
                  <p className="text-[11px] text-teal-600 font-bold">정확도 {top2.accuracy}%</p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">{top2.details || '짧은 글 완주'}</p>
              </div>
            ) : (
              <div className="py-8 text-slate-400 text-xs font-bold">도전자가 없습니다</div>
            )}
          </div>

          {/* 1st Place (Center - Highlighted) */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-4 border-amber-300 shadow-xl flex flex-col items-center text-center relative scale-105 z-10 arcade-card-glow">
            <div className="absolute -top-6 w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-lg border-2 border-amber-200 shadow-lg animate-bounce">
              👑 1위
            </div>
            {top1 ? (
              <div className="space-y-2 mt-2 w-full">
                <span className="text-5xl block animate-float">{top1.userAvatar || '👑'}</span>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-black border border-amber-400">
                    {top1.grade}학년
                  </span>
                  <h3 className="font-black text-slate-900 text-xl text-amber-900">{top1.userName}</h3>
                </div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-300">
                  {selectedGrade === 'all' ? '전체 타자 챔피언' : `${selectedGrade}학년 타자 챔피언`}
                </span>
                <div className="bg-amber-100/70 py-3 px-4 rounded-2xl border-2 border-amber-300">
                  <p className="text-3xl font-black text-amber-950 font-mono">{top1.cpm} <span className="text-xs text-amber-700">CPM</span></p>
                  <p className="text-xs text-teal-700 font-extrabold">정확도 {top1.accuracy}%</p>
                </div>
                <p className="text-[11px] text-amber-700 font-bold truncate">{top1.details || '짧은 글 완주'}</p>
              </div>
            ) : (
              <div className="py-8 text-slate-400 text-xs font-bold">1등 자리에 도전하세요!</div>
            )}
          </div>

          {/* 3rd Place (Right) */}
          <div className="order-3 md:order-3 bg-white rounded-3xl p-6 border-4 border-amber-200 shadow-md flex flex-col items-center text-center relative mt-0 md:mt-8">
            <div className="absolute -top-5 w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center font-black text-sm border-2 border-white shadow-md">
              🥉 3위
            </div>
            {top3 ? (
              <div className="space-y-2 mt-2 w-full">
                <span className="text-4xl block">{top3.userAvatar || '🥉'}</span>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                    {top3.grade}학년
                  </span>
                  <h3 className="font-black text-slate-900 text-lg">{top3.userName}</h3>
                </div>
                <div className="bg-slate-50 py-2 px-3 rounded-2xl border border-slate-200">
                  <p className="text-2xl font-black text-amber-800 font-mono">{top3.cpm} <span className="text-xs text-slate-400">CPM</span></p>
                  <p className="text-[11px] text-teal-600 font-bold">정확도 {top3.accuracy}%</p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">{top3.details || '짧은 글 완주'}</p>
              </div>
            ) : (
              <div className="py-8 text-slate-400 text-xs font-bold">도전자가 없습니다</div>
            )}
          </div>
        </div>
      )}

      {/* Full Leaderboard Table (Top 10) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-pink-200 shadow-md">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-pink-500 rounded-full"></div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              전체 랭킹 순위표 (TOP 10)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">
            총 {sentenceEntries.length}명의 기록 등록됨
          </span>
        </div>

        {sentenceEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pink-50/60 text-slate-600 font-extrabold border-b border-pink-100">
                <tr>
                  <th className="py-3 px-4 text-center">순위</th>
                  <th className="py-3 px-4">학년</th>
                  <th className="py-3 px-4">학생 이름</th>
                  <th className="py-3 px-4 text-center">타수 (CPM)</th>
                  <th className="py-3 px-4 text-center">정확도</th>
                  <th className="py-3 px-4">세부 연습 내용</th>
                  <th className="py-3 px-4 text-right">기록 일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sentenceEntries.slice(0, 10).map((entry, idx) => (
                  <tr
                    key={entry.id || idx}
                    className={`hover:bg-pink-50/40 transition-colors ${
                      idx === 0 ? 'bg-amber-50/50 font-bold' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Grade Badge */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-xl bg-pink-100 text-pink-700 font-black text-[11px] border border-pink-200">
                        {entry.grade}학년
                      </span>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{entry.userAvatar || '👻'}</span>
                        <span className="font-extrabold text-slate-900">{entry.userName}</span>
                      </div>
                    </td>

                    {/* CPM */}
                    <td className="py-3 px-4 text-center font-mono font-black text-base text-pink-600">
                      {entry.cpm} <span className="text-[10px] text-slate-400 font-normal">CPM</span>
                    </td>

                    {/* Accuracy */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-teal-600">
                      {entry.accuracy}%
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-medium">
                        {entry.details || '짧은 글 완주'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {entry.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <Trophy className="w-12 h-12 mx-auto text-amber-300 opacity-60" />
            <p className="font-bold text-slate-600 text-sm">아직 등록된 짧은 글 기록이 없습니다.</p>
            <button
              onClick={onStartSentencePractice}
              className="arcade-btn-pink text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs"
            >
              지금 첫 번째로 도전하기!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
