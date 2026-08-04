import React from 'react';
import { GoldRule } from '../ui/Rules';

/**
 * Komponen Peta Kekuatan & Kompetensi Skill Akademik Siswa (Mastery & CEFR)
 */
const SkillCompetencyMap = ({ hasDiagnostic, skillProficiency, profile }) => {
  if (!hasDiagnostic) return null;

  const skills = [
    { name: 'Grammar', key: 'grammar', score: skillProficiency.grammar, level: profile?.skill_levels?.grammar || 'A1/A2', desc: 'Struktur & tata bahasa', color: '#1A4FAD' },
    { name: 'Vocabulary', key: 'vocab', score: skillProficiency.vocab, level: profile?.skill_levels?.vocab || 'A1/A2', desc: 'Pemahaman kosakata', color: '#C9A84C' },
    { name: 'Reading', key: 'reading', score: skillProficiency.reading, level: profile?.skill_levels?.reading || 'A1/A2', desc: 'Pemahaman bacaan', color: '#16A34A' },
    { name: 'Cloze Text', key: 'cloze', score: skillProficiency.cloze, level: profile?.skill_levels?.cloze || 'A1/A2', desc: 'Kontekstual rumpang', color: '#BF0A30' },
  ];

  return (
    <section className="rounded-sm p-5 md:p-6 text-left" style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 4px 16px rgba(10,36,99,0.05)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h2 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
            Peta Kekuatan & Kompetensi Skill Akademik Anda
          </h2>
        </div>
        <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-sm" style={{ background: '#0A2463', color: '#C9A84C', border: '1px solid #C9A84C' }}>
          CEFR DETECTED
        </span>
      </div>
      
      <GoldRule opacity={0.6} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {skills.map((skill) => (
          <div key={skill.name} className="p-4 rounded-sm flex flex-col justify-between shadow-xs transition-all hover:-translate-y-0.5" style={{ background: '#EDE4CC', border: '1px solid #C8B99A' }}>
            <div>
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-sm text-[#0A2463] uppercase tracking-wider">{skill.name}</h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-sm text-white" style={{ background: '#0A2463' }}>
                  {skill.level}
                </span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: '#6B5A42' }}>{skill.desc}</p>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-end mb-1 text-xs">
                <span className="text-[10px] font-bold" style={{ color: '#6B5A42' }}>Mastery</span>
                <span className="font-bold text-[#0a2463]">{skill.score}%</span>
              </div>
              
              {/* Progress bar container */}
              <div className="w-full rounded-full h-2" style={{ background: '#FAF6EC', border: '1px solid rgba(200,185,154,0.4)' }}>
                <div 
                  className="h-1.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${skill.score}%`, backgroundColor: skill.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SkillCompetencyMap;
