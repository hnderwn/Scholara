import React from 'react';
import Card from '../ui/Card';

const QuestionCard = ({ question, questionNumber, totalQuestions, selectedAnswer, onAnswerSelect }) => {
  const options = ['A', 'B', 'C', 'D', 'E'];

  const getCategoryLabel = (cat) => {
    const map = {
      Grammar: 'Tata Bahasa',
      Vocabulary: 'Kosakata',
      Reading: 'Membaca',
      Cloze: 'Rumpang',
    };
    return map[cat] || cat;
  };

  return (
    <Card className="p-0 border-none shadow-none bg-transparent font-['DM_Sans']">
      <div className="mb-6">
        <div className="flex items-end justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42' }}>
            Soal {questionNumber} / {totalQuestions}
          </span>
          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-sm border" style={{ backgroundColor: '#EDE4CC', color: '#0A2463', borderColor: '#C8B99A' }}>
            {getCategoryLabel(question.category)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1" style={{ backgroundColor: '#EDE4CC' }}>
          <div
            className="h-1 transition-all duration-500 ease-out"
            style={{
              width: `${(questionNumber / totalQuestions) * 100}%`,
              backgroundColor: '#1A4FAD',
            }}
          />
        </div>
      </div>

      {/* ── Teks Soal (Ketebalan normal, mewarisi font DM Sans bawaan) ── */}
      <div className="mb-8 md:mb-10">
        <h3 className="text-xl md:text-2xl leading-relaxed text-black">{question.question_text}</h3>
      </div>

      {/* ── Pilihan Ganda ── */}
      <div className="space-y-3">
        {options.map((option) => {
          const optionText = question.options?.[option] || '';
          if (!optionText) return null;

          const isSelected = selectedAnswer === option;

          return (
            <label
              key={option}
              className={`flex items-start p-4 rounded-sm border cursor-pointer transition-all duration-200 hover:-translate-y-px ${
                isSelected ? 'border-[#0A2463] bg-[#EDE4CC] shadow-[0_4px_12px_rgba(10,36,99,0.08)]' : 'border-[#C8B99A] bg-[#FAF6EC] hover:border-[#1A4FAD]'
              }`}
            >
              <input type="radio" name={`question-${question.id}`} value={option} checked={isSelected} onChange={() => onAnswerSelect(option)} className="mt-1 h-4 w-4 accent-[#1A4FAD] cursor-pointer" />
              <div className="ml-4 flex-1 leading-snug text-black">
                <span className="font-bold mr-3">{option}.</span>
                <span className="text-[15px]">{optionText}</span>
              </div>
            </label>
          );
        })}
      </div>
    </Card>
  );
};

export default QuestionCard;
