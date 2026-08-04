import React, { useState } from 'react';

/**
 * Dropdown Ekspor Serbaguna untuk Halaman Admin
 */
const ExportDropdown = ({
  onPrint,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  label = 'Ekspor Data'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative no-print">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto px-4 py-2.5 bg-[#0A2463] hover:bg-[#1A4FAD] text-white text-[13px] font-bold rounded-sm flex items-center justify-center gap-2 transition-all shadow-sm active:translate-y-px"
      >
        <span>📥</span>
        <span>{label}</span>
        <span className="text-[9px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-[#FAF6EC] border border-[#C8B99A] rounded-sm shadow-xl z-50 divide-y divide-[rgba(200,185,154,0.3)]">
          {onPrint && (
            <button
              onClick={() => {
                setIsOpen(false);
                onPrint();
              }}
              className="w-full text-left px-4 py-2 text-xs font-bold text-[#6B5A42] hover:bg-[#EDE4CC] transition-colors flex items-center gap-2"
            >
              <span>🖨️</span> Cetak Halaman
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={() => {
                setIsOpen(false);
                onExportPDF();
              }}
              className="w-full text-left px-4 py-2 text-xs font-bold text-[#6B5A42] hover:bg-[#EDE4CC] transition-colors flex items-center gap-2"
            >
              <span>📄</span> Ekspor PDF (.pdf)
            </button>
          )}
          {onExportExcel && (
            <button
              onClick={() => {
                setIsOpen(false);
                onExportExcel();
              }}
              className="w-full text-left px-4 py-2 text-xs font-bold text-[#6B5A42] hover:bg-[#EDE4CC] transition-colors flex items-center gap-2"
            >
              <span>📊</span> Ekspor Excel (.xlsx)
            </button>
          )}
          {onExportCSV && (
            <button
              onClick={() => {
                setIsOpen(false);
                onExportCSV();
              }}
              className="w-full text-left px-4 py-2 text-xs font-bold text-[#6B5A42] hover:bg-[#EDE4CC] transition-colors flex items-center gap-2"
            >
              <span>📁</span> Ekspor CSV (.csv)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
