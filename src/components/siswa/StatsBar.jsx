import React from 'react';

/**
 * Komponen Baris Statistik (Stats Bar) Dashboard Siswa
 */
const StatsBar = ({ stats, passedPracticesLength, formatDate }) => {
  const items = [
    { label: 'Ujian Dikerjakan', value: stats.totalExams, icon: '📝', suffix: 'x' },
    { label: 'Rata-rata Skor', value: stats.averageScore, icon: '⭐', suffix: '%' },
    {
      label: 'Progres Latihan',
      value: `${passedPracticesLength || 0}/4`,
      icon: '📈',
      suffix: 'Lulus',
      isProgress: true,
    },
    {
      label: 'Terakhir Ujian',
      value: stats.lastExamDate ? formatDate(stats.lastExamDate) : 'Belum ada',
      icon: '📅',
      suffix: '',
      isDate: true,
      span: 'col-span-2 md:col-span-1',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-left">
      {items.map(({ label, value, icon, suffix, isDate, isProgress, span = '' }) => (
        <div key={label} className={`rounded-sm p-3 md:p-5 flex items-center gap-3 md:gap-4 ${span}`} style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm flex items-center justify-center flex-shrink-0 text-lg md:text-xl" style={{ background: '#EDE4CC' }}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-wider truncate" style={{ color: '#6B5A42' }}>
              {label}
            </p>
            <p className="font-bold mt-0.5 truncate" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: isDate ? 12 : 20 }}>
              <span className="md:text-2xl">{value}</span>
              <span className="text-[10px] md:text-xs ml-0.5">{suffix}</span>
            </p>
            {isProgress && (
              <div className="w-full bg-[#EDE4CC] rounded-full h-1 mt-2">
                <div 
                  className="bg-[#1A4FAD] h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${((passedPracticesLength || 0) / 4) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
