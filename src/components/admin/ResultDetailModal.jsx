import React, { useRef, useEffect } from 'react';
import { RedRule, GoldRule } from '../ui/Rules';

/**
 * Modal Detail Hasil Ujian Siswa
 */
const ResultDetailModal = ({ isOpen, result, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="max-w-2xl w-full bg-[#FAF6EC] border border-[#C8B99A] rounded-sm shadow-2xl overflow-hidden max-h-[95vh] flex flex-col outline-none"
      >
        {/* Top Accent Line */}
        <RedRule />

        <div className="p-6 md:p-8 flex flex-col flex-1 overflow-hidden">
          {/* Modal Header */}
          <div className="flex justify-between items-start mb-6 flex-shrink-0">
            <div>
              <h2 className="text-3xl font-bold leading-tight text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                {result.profiles?.full_name || 'Anonymous Student'}
              </h2>
              <p className="text-sm italic text-[#6B5A42] mt-1" style={{ fontFamily: "'IM Fell English',serif" }}>
                {result.profiles?.school || 'Institusi Tidak Diketahui'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B5A42] mb-1">Skor Total</p>
              <p className="text-4xl font-black leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: result.score_total >= 80 ? '#16A34A' : result.score_total >= 60 ? '#D97706' : '#BF0A30' }}>
                {result.score_total}
              </p>
            </div>
          </div>

          <GoldRule opacity={0.6} />

          {/* Score Grid & Details - Scrollable on small heights */}
          <div className="flex-1 overflow-y-auto my-6 pr-1">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Grammar', key: 'grammar' },
                { label: 'Vocabulary', key: 'vocab' },
                { label: 'Reading', key: 'reading' },
                { label: 'Cloze', key: 'cloze' },
              ].map((cat) => (
                <div key={cat.label} className="p-4 rounded-sm bg-[#F2ECD8] border border-[rgba(200,185,154,0.5)] flex items-center justify-between transition-transform hover:-translate-y-0.5">
                  <span className="text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">{cat.label}</span>
                  <span className="text-2xl font-black text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                    {result.category_scores?.[cat.key]?.score || 0}%
                  </span>
                </div>
              ))}
            </div>

            {/* Date & Exam Info */}
            <div className="bg-[#0A2463] border border-[rgba(201,168,76,0.3)] text-white rounded-sm p-5 mt-6 relative overflow-hidden">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
              <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(201,168,76,0.7)' }}>
                ✦ Waktu Pelaksanaan Ujian
              </p>
              <p className="text-base font-bold" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                {new Date(result.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
            </div>
          </div>

          {/* Close Action */}
          <div className="flex-shrink-0 pt-2 border-t border-[#C8B99A]/20">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-sm bg-[#FAF6EC] border border-[#C8B99A] text-[#6B5A42] text-sm font-bold uppercase tracking-wider transition-all hover:border-[#0A2463] hover:text-[#0A2463]"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDetailModal;
