import React from 'react';
import { GoldRule } from '../ui/Rules';

/**
 * Helper untuk styling badge level CEFR kata
 */
export const levelBadgeClass = (level = '') => {
  const l = level.toUpperCase();
  if (l.startsWith('A')) return 'bg-green-50 text-green-700 border border-green-200';
  if (l.startsWith('B')) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (l.startsWith('C')) return 'bg-purple-50 text-purple-700 border border-purple-200';
  return 'border border-gray-200 text-gray-500';
};

/**
 * Komponen DetailContent (WordCard) untuk Pustaka Kamus Siswa
 */
const WordCard = ({ item, relatedItems, onClose, onSelectRelated, langMode }) => {
  return (
    <div className="p-6 flex flex-col gap-5 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span style={{ color: '#C9A84C', letterSpacing: 6, fontSize: 10 }}>✦ ✦ ✦</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-sm transition-colors"
          style={{ color: '#6B5A42' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE4CC')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Term + Level */}
      <div className="flex items-start justify-between">
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0A2463', fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{item.term}</h2>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm flex-shrink-0 ml-3 mt-1 ${levelBadgeClass(item.level)}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {item.level || '—'}
        </span>
      </div>

      {/* Category + Sub */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B5A42', fontFamily: "'DM Sans', sans-serif" }}>
          {item.category}
        </span>
        <span style={{ color: '#C8B99A' }}>•</span>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0A2463', fontFamily: "'DM Sans', sans-serif" }}>
          {item.sub_category}
        </span>
      </div>

      <GoldRule />

      {/* Definition */}
      <div className="space-y-4">
        {(langMode === 'EN' || langMode === 'BOTH') && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60" style={{ color: '#6B5A42', fontFamily: "'DM Sans', sans-serif" }}>
              Definition (EN)
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#2C1F0E', fontFamily: "'DM Sans', sans-serif" }}>
              {item.definition}
            </p>
          </div>
        )}

        {(langMode === 'ID' || langMode === 'BOTH') && item.definition_bahasa && (
          <div className="pt-1">
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60" style={{ color: '#BF0A30', fontFamily: "'DM Sans', sans-serif" }}>
              Definisi (ID)
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#2C1F0E', fontFamily: "'DM Sans', sans-serif" }}>
              {item.definition_bahasa}
            </p>
          </div>
        )}
      </div>

      {/* Example sentence */}
      {(item.example_sentence || item.example_sentence_bahasa) && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#6B5A42', fontFamily: "'DM Sans', sans-serif" }}>
            Contoh / Examples
          </p>
          <div className="px-4 py-3 rounded-r-sm space-y-3" style={{ background: '#EDE4CC', borderLeft: '3px solid #C9A84C' }}>
            {(langMode === 'EN' || langMode === 'BOTH') && item.example_sentence && (
              <p className="text-sm italic leading-relaxed" style={{ fontFamily: "'IM Fell English', serif", color: '#6B5A42' }}>
                "{item.example_sentence}"
              </p>
            )}
            {(langMode === 'ID' || langMode === 'BOTH') && item.example_sentence_bahasa && (
              <p className="text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", color: '#2C1F0E', opacity: 0.8 }}>
                "{item.example_sentence_bahasa}"
              </p>
            )}
          </div>
        </div>
      )}

      <GoldRule />

      {/* Related terms */}
      {relatedItems.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#6B5A42', fontFamily: "'DM Sans', sans-serif" }}>
            Istilah Terkait
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedItems.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectRelated(r)}
                className="px-3 py-1.5 text-xs font-semibold rounded-sm transition-all"
                style={{ background: '#EDE4CC', border: '1px solid #C8B99A', color: '#2C1F0E', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0A2463';
                  e.currentTarget.style.color = '#0A2463';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#C8B99A';
                  e.currentTarget.style.color = '#2C1F0E';
                }}
              >
                {r.term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCard;
