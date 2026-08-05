import React from 'react';
import { GoldRule } from '../ui/Rules';

/**
 * Komponen Riwayat Hasil Ujian & Latihan Scrollable
 */
const HistoryListWidget = ({ title, historyList, type, scoreBadge, formatDate, onSelectReport }) => {
  const isTryout = type === 'tryout';

  return (
    <div className="text-left">
      <div className="flex items-center gap-2 mb-1">
        {isTryout ? (
          <svg className="w-4 h-4" fill="none" stroke="#C9A84C" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="#BF0A30" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )}
        <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 18 }}>
          {title}
        </h2>
      </div>
      <GoldRule opacity={0.6} />

      <div className="space-y-3 mt-4 max-h-[350px] overflow-y-auto pr-1">
        {historyList.length > 0 ? (
          historyList.map((exam) => {
            const badge = scoreBadge(exam.score_total);
            const packageNames = {
              grammar_master: 'Grammar',
              vocab_power: 'Vocabulary',
              reading_pro: 'Reading',
              cloze_challenge: 'Cloze'
            };
            const pkgId = exam.package_id || exam.category_scores?.package_id;
            const catName = packageNames[pkgId] || 'Latihan';
            
            return (
              <div 
                key={exam.id} 
                onClick={() => onSelectReport(exam)}
                className="rounded-sm p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-[#EDE4CC] hover:-translate-y-0.5" 
                style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 1px 3px rgba(10,36,99,0.05)' }}
              >
                <div>
                  <p className="font-bold text-base flex items-center gap-1.5" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                    {exam.score_total}
                    <span className="text-xs font-normal" style={{ color: '#6B5A42' }}>
                      /100
                    </span>
                    <span className="text-[10px] text-[#A8946C] font-normal italic">
                      (Lihat Laporan)
                    </span>
                  </p>
                  {!isTryout && (
                    <p className="text-[11px] mt-0.5 text-[#6B5A42]">
                      Skill: <span className="font-bold text-[#0A2463]">{catName}</span>
                    </p>
                  )}
                  <p className="text-[10px] mt-0.5 text-stone-500 font-mono">
                    {formatDate(exam.created_at)}
                  </p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-sm" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {badge.label}
                </span>
              </div>
            );
          })
        ) : (
          <div className="rounded-sm p-8 text-center" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
            <p className="text-3xl mb-3 opacity-30">📋</p>
            <p className="text-sm italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
              Belum ada {isTryout ? 'riwayat ujian' : 'riwayat latihan'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#A8946C' }}>
              {isTryout ? 'Mulai dengan Ujian Diagnostic di atas!' : 'Selesaikan latihan penguatan skill di sebelah kiri!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryListWidget;
