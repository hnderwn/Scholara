import React from 'react';

/**
 * Komponen Rekomendasi Topik Lemah (Hasil SAW)
 */
const WeakTopicRecommendations = ({ hasDiagnostic, weakTopics, userCefr, startExam }) => {
  if (!hasDiagnostic || !weakTopics || weakTopics.length === 0) return null;

  return (
    <section className="text-left">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🎯</span>
        <h2 className="font-bold text-base" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 18 }}>
          Rekomendasi Latihan Sesuai Kemampuan
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weakTopics.map((topic) => (
          <div key={topic.id} className="rounded-sm p-5 flex items-center justify-between" style={{ background: '#FAF6EC', border: '1px solid #C8B99A', borderLeft: '4px solid #C9A84C' }}>
            <div>
              <p className="font-bold text-base" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                {topic.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6B5A42' }}>
                {topic.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[9px] px-2 py-0.5 rounded-sm font-bold bg-[#EDE4CC] text-[#0A2463] border border-[#C8B99A]">
                  Tingkat: {userCefr}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-sm font-bold bg-green-100 text-green-800 border border-green-200">
                  Kesesuaian: Sangat Cocok
                </span>
              </div>
            </div>
            <button
              onClick={() => startExam(topic.id)}
              className="ml-4 px-4 py-2 text-xs font-bold rounded-sm flex-shrink-0 transition-all text-white"
              style={{ background: '#BF0A30' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#D41035')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#BF0A30')}
            >
              Latihan →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WeakTopicRecommendations;
