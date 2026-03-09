import React from 'react';

const Timer = ({ timeLeft, isActive }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Disesuaikan untuk mengembalikan hex code palet klasik
  const getTimeColor = () => {
    if (timeLeft <= 300) return '#BF0A30'; // Merah Crimson (< 5 menit)
    if (timeLeft <= 600) return '#D97706'; // Emas/Oranye (< 10 menit)
    return '#0A2463'; // Biru Navy (Normal)
  };

  const isCritical = timeLeft <= 300;

  return (
    <div className={`flex flex-col rounded-sm overflow-hidden transition-all ${isCritical ? 'animate-pulse' : ''}`} style={{ backgroundColor: '#F2ECD8', border: '1px solid #C8B99A' }}>
      <div className="px-3 py-1.5 flex items-center gap-2.5">
        {/* SVG Ikon Jam Klasik */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: getTimeColor() }}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>

        <div className="flex flex-col justify-center">
          <div className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5" style={{ color: '#6B5A42', fontFamily: "'DM Sans',sans-serif" }}>
            Sisa Waktu
          </div>
          <div className="text-xl font-bold leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: getTimeColor() }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress Bar diubah menjadi garis tipis di bagian bawah */}
      {isActive && (
        <div className="w-full h-1" style={{ backgroundColor: '#EDE4CC' }}>
          <div
            className="h-full transition-all duration-1000"
            style={{
              backgroundColor: getTimeColor(),
              width: `${(timeLeft / 3600) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Timer;
