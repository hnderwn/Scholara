import React from 'react';

/**
 * Komponen Opsi Debug Dev Mode
 */
const DevDebugPanel = ({ profile, handleDebugAutoFill }) => {
  const isDebugEnabled = import.meta.env.DEV || profile?.is_debug_enabled || profile?.role === 'admin';
  if (!isDebugEnabled) return null;

  return (
    <>
      {/* Mobile View: Dropdown */}
      <div className="flex md:hidden items-center gap-1 bg-red-50/10 border border-red-200/30 rounded-sm px-1.5 py-0.5 no-print">
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleDebugAutoFill(e.target.value);
              e.target.value = '';
            }
          }}
          className="bg-[#FAF6EC] border border-[#C8B99A] text-[10px] font-bold text-[#0A2463] rounded-sm py-0.5 px-1 outline-none cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>🛠️ Debug</option>
          <option value="correct">Auto Benar (100%)</option>
          <option value="incorrect">Auto Salah (0%)</option>
          <option value="random">Auto Acak</option>
          <option value="custom">Set Skor Custom</option>
        </select>
      </div>

      {/* Desktop View: Inline Buttons */}
      <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-red-50/10 border border-red-200/30 rounded-sm no-print">
        <span className="text-[10px] font-bold text-[#C9A84C] font-mono">DEBUG:</span>
        <button
          onClick={() => handleDebugAutoFill('correct')}
          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] font-bold rounded-sm transition-colors"
        >
          Benar
        </button>
        <button
          onClick={() => handleDebugAutoFill('incorrect')}
          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[9px] font-bold rounded-sm transition-colors"
        >
          Salah
        </button>
        <button
          onClick={() => handleDebugAutoFill('random')}
          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-mono text-[9px] font-bold rounded-sm transition-colors"
        >
          Acak
        </button>
        <button
          onClick={() => handleDebugAutoFill('custom')}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[9px] font-bold rounded-sm transition-colors"
        >
          Set Skor
        </button>
      </div>
    </>
  );
};

export default DevDebugPanel;
