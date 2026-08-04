import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Ekspor data ke berkas Excel (.xlsx)
 * @param {Array<Object>} data - Array objek data yang akan diekspor
 * @param {string} fileName - Nama file output
 * @param {string} sheetName - Nama worksheet
 */
export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Lebar kolom dinamis untuk keindahan visual
  const objectKeys = Object.keys(data[0]);
  const cols = objectKeys.map(key => {
    const maxLen = Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    );
    return { wch: maxLen + 2 };
  });
  worksheet['!cols'] = cols;

  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
};

/**
 * Ekspor data ke berkas PDF (.pdf)
 * @param {string} title - Judul Laporan
 * @param {Array<string>} columns - Header kolom tabel
 * @param {Array<Array<any>>} rows - Baris data tabel
 * @param {string} fileName - Nama file output
 * @param {string} orientation - Orientasi kertas ('portrait' atau 'landscape')
 */
export const exportToPDF = (title, columns, rows, fileName, orientation = 'landscape') => {
  const doc = new jsPDF(orientation);
  
  // Judul Laporan
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text(title.toUpperCase(), 14, 20);
  
  // Waktu Cetak
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 26);
  
  // Gambar Tabel
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 32,
    styles: { font: 'times', fontSize: 9 },
    headStyles: { fillColor: [10, 36, 99] }, // Warna Navy khas Scholara
    alternateRowStyles: { fillColor: [242, 236, 216] } // Warna krem Parchment khas Scholara
  });
  
  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};

/**
 * Ekspor data ke berkas CSV (.csv)
 * @param {Array<Object>} data - Array objek data yang akan diekspor
 * @param {string} fileName - Nama file output
 */
export const exportToCSV = (data, fileName) => {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
