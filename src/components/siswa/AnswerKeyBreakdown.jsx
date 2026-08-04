import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { RedRule } from '../ui/Rules';

/**
 * Komponen Modal Ulasan Jawaban Lengkap (Pembahasan Soal)
 */
const AnswerKeyBreakdown = ({
  isOpen,
  onClose,
  detailedQuestions,
  examResult,
  explanationLang,
  setExplanationLang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-[#FAF6EC] rounded-sm w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#C8B99A]">
        <RedRule />

        {/* Modal Header */}
        <div className="p-5 border-b flex justify-between items-center bg-[#FAF6EC] sticky top-0 z-10 text-left" style={{ borderColor: '#C8B99A' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Pembahasan Soal
            </h2>

            {/* Language Toggle Classic */}
            <div className="flex bg-[#EDE4CC] p-1 rounded-sm border border-[#C8B99A]">
              <button
                onClick={() => setExplanationLang('en')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors ${explanationLang === 'en' ? 'bg-[#0A2463] text-white shadow-sm' : 'text-[#6B5A42] hover:text-[#0A2463]'}`}
              >
                English
              </button>
              <button
                onClick={() => setExplanationLang('id')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors ${explanationLang === 'id' ? 'bg-[#0A2463] text-white shadow-sm' : 'text-[#6B5A42] hover:text-[#0A2463]'}`}
              >
                Indonesia
              </button>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 text-left" style={{ backgroundColor: '#F2ECD8' }}>
          {detailedQuestions.length > 0 ? (
            <div className="space-y-6">
              {detailedQuestions.map((item, index) => {
                const userAnswer = examResult.answers[item.id];
                const isCorrect = userAnswer === item.correct_answer;

                return (
                  <Card key={item.id} className="p-6 relative overflow-hidden" style={{ borderLeft: `4px solid ${isCorrect ? '#16A34A' : '#BF0A30'}` }}>
                    <div className="flex items-start justify-between mb-5">
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42' }}>
                        Soal No. {index + 1}
                      </span>
                      <span
                        className="px-2 py-1 border rounded-sm text-[9px] font-black tracking-widest"
                        style={{
                          backgroundColor: isCorrect ? 'rgba(22,163,74,0.1)' : 'rgba(191,10,48,0.1)',
                          color: isCorrect ? '#16A34A' : '#BF0A30',
                          borderColor: isCorrect ? 'rgba(22,163,74,0.3)' : 'rgba(191,10,48,0.3)',
                        }}
                      >
                        {isCorrect ? 'BENAR' : 'SALAH'}
                      </span>
                    </div>

                    <p className="text-black font-sans text-lg mb-6 whitespace-pre-wrap leading-relaxed">{item.question_text}</p>

                    <div className="space-y-3 mb-6">
                      {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                        const optText = item.options?.[opt];
                        if (!optText) return null;

                        let optionStyle = { backgroundColor: '#FAF6EC', borderColor: '#C8B99A', color: '#2C1F0E' };

                        if (opt === item.correct_answer) {
                          optionStyle = { backgroundColor: 'rgba(22,163,74,0.1)', borderColor: '#16A34A', color: '#0A2463' };
                        } else if (opt === userAnswer && !isCorrect) {
                          optionStyle = { backgroundColor: 'rgba(191,10,48,0.1)', borderColor: '#BF0A30', color: '#0A2463' };
                        }

                        return (
                          <div key={opt} className="p-4 rounded-sm border flex items-center transition-all" style={optionStyle}>
                            <span className="w-8 font-bold text-sans">{opt}.</span>
                            <span className="flex-1 font-sans text-[15px]">{optText}</span>

                            {opt === item.correct_answer && (
                              <svg className="w-5 h-5 ml-2" style={{ color: '#16A34A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {opt === userAnswer && !isCorrect && (
                              <svg className="w-5 h-5 ml-2" style={{ color: '#BF0A30' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-sm p-5 border" style={{ backgroundColor: '#EDE4CC', borderColor: '#C8B99A' }}>
                      <div className="flex items-center mb-3">
                        <span className="mr-2 text-lg">📝</span>
                        <h4 className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#0A2463' }}>
                          Ulasan ({explanationLang === 'en' ? 'English' : 'Indonesia'})
                        </h4>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#2C1F0E', fontFamily: "'DM Sans',sans-serif" }}>
                        {explanationLang === 'id' ? item.explanation_bahasa || 'Maaf, penjelasan bahasa Indonesia belum tersedia untuk soal ini.' : item.explanation || 'No explanation available for this question.'}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#6B5A42' }}>
                Memuat arsip rincian soal...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerKeyBreakdown;
