import React from 'react';
import { RedRule, GoldRule } from '../ui/Rules';

/**
 * Komponen Indeks Navigasi Soal Ujian (Sidebar)
 */
const QuestionNavigationSidebar = ({
  totalQuestions,
  questions,
  answers,
  currentQuestionIndex,
  handleQuestionClick,
  isIndexExpanded,
  setIsIndexExpanded
}) => {
  return (
    <div className="rounded-sm sticky top-28 text-left" style={{ backgroundColor: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 4px 16px rgba(10,36,99,0.05)' }}>
      <RedRule opacity={0.6} />
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsIndexExpanded(!isIndexExpanded)}>
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0A2463' }}>
            Indeks Soal
          </h3>
          <span className="text-xs text-[#6B5A42] font-semibold">
            {isIndexExpanded ? '▲ Sembunyikan' : '▼ Tampilkan'}
          </span>
        </div>

        {isIndexExpanded && (
          <>
            <div className="my-3">
              <GoldRule opacity={0.6} />
            </div>

            {/* Solusi Mobile UX: max-h-60 overflow-y-auto */}
            <div className="mt-4 grid grid-cols-5 gap-2 max-h-60 lg:max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const questionId = questions[i]?.id;
                const isAnswered = answers[questionId] !== undefined;
                const isCurrent = i === currentQuestionIndex;

                let btnStyle = { border: '1px solid #C8B99A', color: '#6B5A42', backgroundColor: 'transparent' };
                if (isCurrent) {
                  btnStyle = { border: '1px solid #0A2463', color: '#fff', backgroundColor: '#0A2463' };
                } else if (isAnswered) {
                  btnStyle = { border: '1px solid #1A4FAD', color: '#1A4FAD', backgroundColor: '#EDE4CC' };
                }

                return (
                  <button 
                    key={i} 
                    onClick={() => handleQuestionClick(i)} 
                    className="w-full aspect-square rounded-sm text-xs font-bold font-mono transition-all hover:opacity-80 flex items-center justify-center" 
                    style={btnStyle}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(200,185,154,0.4)' }}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span style={{ color: '#6B5A42' }}>Terjawab:</span>
                <span className="font-bold text-sm" style={{ color: '#0A2463' }}>
                  {Object.keys(answers).length} / {totalQuestions}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionNavigationSidebar;
