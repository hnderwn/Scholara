import React, { useState, useEffect } from 'react';

const Timer = ({ endTime, duration, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  // Background independen penghitungan timer
  useEffect(() => {
    let interval = null;

    const updateTimer = () => {
      if (!endTime) return;
      const remaining = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    if (isActive && endTime) {
      updateTimer(); // Initial sync
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(0);
    }

    return () => clearInterval(interval);
  }, [endTime, isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 300) return '#BF0A30'; // Merah Crimson (< 5 menit)
    if (timeLeft <= 600) return '#D97706'; // Emas/Oranye (< 10 menit)
    return '#0A2463'; // Biru Navy (Normal)
  };

  const isCritical = timeLeft <= 300 && timeLeft > 0;

  return (
    <div className={`flex flex-col rounded-sm overflow-hidden transition-all ${isCritical ? 'animate-pulse' : ''}`} style={{ backgroundColor: '#F2ECD8', border: '1px solid #C8B99A' }}>
      <div className="px-3 py-1.5 flex items-center gap-2.5">
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

      {isActive && duration > 0 && (
        <div className="w-full h-1" style={{ backgroundColor: '#EDE4CC' }}>
          <div
            className="h-full transition-all duration-1000"
            style={{
              backgroundColor: getTimeColor(),
              width: `${(timeLeft / duration) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Timer;
