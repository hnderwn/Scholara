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
  
  const isPortrait = orientation === 'portrait';
  const pageWidth = isPortrait ? 210 : 297;
  const center = pageWidth / 2;

  // 1. KOP SURAT (LETTERHEAD)
  // Nama Lembaga / Sistem
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(10, 36, 99); // Navy khas Scholara
  doc.text('SCHOLARA ACADEMY', center, 15, { align: 'center' });
  
  // Sub-judul / Alamat Lembaga
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Sistem Pendukung Keputusan Rekomendasi Adaptif Pembelajaran Bahasa Inggris', center, 20, { align: 'center' });
  doc.text('Metode Simple Additive Weighting (SAW) · Terverifikasi Standar CEFR', center, 24, { align: 'center' });
  
  // Kontak / Website
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Website: www.scholara-beryl.vercel.app · Email: hendiss73@gmail.com', center, 28, { align: 'center' });
  
  // Garis Pembatas Kop Surat (Double Line: tebal & tipis)
  doc.setDrawColor(10, 36, 99);
  doc.setLineWidth(0.8);
  doc.line(14, 31, pageWidth - 14, 31); // Garis tebal
  doc.setLineWidth(0.2);
  doc.line(14, 32.5, pageWidth - 14, 32.5); // Garis tipis

  // 2. DOKUMEN HEADER
  // Judul Laporan
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(title.toUpperCase(), 14, 41);
  
  // Waktu Cetak
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 46);
  
  // 3. TABEL DATA
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 51,
    styles: { font: 'times', fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { 
      fillColor: [10, 36, 99], // Navy khas Scholara
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: { 
      fillColor: [250, 248, 240] // Krem Parchment tipis khas Scholara
    },
    margin: { top: 51, bottom: 20 },
    theme: 'grid',
    didDrawPage: () => {
      // Footer Halaman
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const str = `Halaman ${doc.internal.getNumberOfPages()}`;
      doc.text(str, pageWidth - 14 - doc.getTextWidth(str), doc.internal.pageSize.height - 10);
      doc.text('Scholara - Tryout & Learning Platform', 14, doc.internal.pageSize.height - 10);
    }
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

/**
 * Ekspor laporan analitik performa komprehensif ke berkas PDF
 * @param {string} title - Judul Laporan
 * @param {Object} stats - Statistik ringkasan dari calculateReportsStats
 * @param {Array} studentData - Data performa rata-rata per siswa
 * @param {string} fileName - Nama file output
 */
export const exportAnalyticsPDF = (title, stats, studentData, fileName) => {
  const doc = new jsPDF('portrait');
  const pageWidth = 210;
  const center = pageWidth / 2;

  // 1. KOP SURAT (LETTERHEAD)
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(10, 36, 99); // Navy
  doc.text('SCHOLARA ACADEMY', center, 15, { align: 'center' });
  
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Sistem Pendukung Keputusan Rekomendasi Adaptif Pembelajaran Bahasa Inggris', center, 20, { align: 'center' });
  doc.text('Metode Simple Additive Weighting (SAW) · Terverifikasi Standar CEFR', center, 24, { align: 'center' });
  
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Website: www.scholara-beryl.vercel.app · Email: hendiss73@gmail.com', center, 28, { align: 'center' });
  
  doc.setDrawColor(10, 36, 99);
  doc.setLineWidth(0.8);
  doc.line(14, 31, pageWidth - 14, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32.5, pageWidth - 14, 32.5);

  // 2. HEADER DOKUMEN
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(title.toUpperCase(), 14, 41);
  
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 46);

  // 3. RINGKASAN PERFORMA (METRICS SUMMARY)
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 36, 99);
  doc.text('I. RINGKASAN METRIK SISTEM', 14, 54);

  const summaryCols = ['Metrik Performa', 'Nilai Statistik'];
  const summaryRows = [
    ['Total Siswa Terdaftar', `${stats.totalStudents} Siswa`],
    ['Total Ujian Diselesaikan', `${stats.totalExams} Sesi`],
    ['Rata-rata Skor Total Ujian', `${stats.averageScore} / 100`],
    ['Rata-rata Nilai Grammar', `${stats.categoryAverages.Grammar}%`],
    ['Rata-rata Nilai Vocabulary', `${stats.categoryAverages.Vocabulary}%`],
    ['Rata-rata Nilai Reading', `${stats.categoryAverages.Reading}%`],
    ['Rata-rata Nilai Cloze', `${stats.categoryAverages.Cloze}%`],
  ];

  autoTable(doc, {
    head: [summaryCols],
    body: summaryRows,
    startY: 58,
    styles: { font: 'times', fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [10, 36, 99], textColor: [255, 255, 255] },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  let currentY = doc.lastAutoTable.finalY + 8;

  // 4. DISTRIBUSI CEFR SISWA
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 36, 99);
  doc.text('II. DISTRIBUSI LEVEL CEFR SISWA', 14, currentY);

  const cefrRows = [
    ['Level Dasar (A1/A2)', `${stats.cefrDist['A1/A2'] || 0} Siswa`],
    ['Level Menengah (B1/B2)', `${stats.cefrDist['B1/B2'] || 0} Siswa`],
    ['Level Mahir (C1/C2)', `${stats.cefrDist['C1/C2'] || 0} Siswa`],
  ];

  autoTable(doc, {
    head: [['Level Kemahiran CEFR', 'Jumlah Terdistribusi']],
    body: cefrRows,
    startY: currentY + 4,
    styles: { font: 'times', fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [10, 36, 99], textColor: [255, 255, 255] },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 5. TOP 5 TOPIC TER-SULIT
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 36, 99);
  doc.text('III. TOP 5 TOPIK SOAL DENGAN ERROR RATE TERTINGGI', 14, currentY);

  const topicRows = stats.hardestTopics.map(t => [
    t.topic,
    `${t.errorRate}%`
  ]);

  autoTable(doc, {
    head: [['Sub-Kategori / Topik Soal', 'Tingkat Kesalahan (Error Rate)']],
    body: topicRows,
    startY: currentY + 4,
    styles: { font: 'times', fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [10, 36, 99], textColor: [255, 255, 255] },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  // Halaman baru untuk detail per siswa
  doc.addPage();
  
  // Kop Surat Ringkas di halaman kedua
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(10, 36, 99);
  doc.text('SCHOLARA ACADEMY - LAPORAN ANALITIK', 14, 15);
  doc.setLineWidth(0.5);
  doc.line(14, 18, pageWidth - 14, 18);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 36, 99);
  doc.text('IV. DETIL PERFORMA RATA-RATA TIAP SISWA', 14, 26);

  const studentCols = ['Nama Siswa', 'Sekolah', 'CEFR', 'Ujian', 'Skor', 'Grammar', 'Vocab', 'Reading', 'Cloze'];
  const studentRows = studentData.map(s => [
    s.name,
    s.school,
    s.cefr,
    s.examCount,
    `${Math.round(s.averageScore)}`,
    `${Math.round(s.avgGrammar)}%`,
    `${Math.round(s.avgVocab)}%`,
    `${Math.round(s.avgReading)}%`,
    `${Math.round(s.avgCloze)}%`
  ]);

  autoTable(doc, {
    head: [studentCols],
    body: studentRows,
    startY: 30,
    styles: { font: 'times', fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [10, 36, 99], textColor: [255, 255, 255] },
    theme: 'grid',
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      // Footer Halaman
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const str = `Halaman ${doc.internal.getNumberOfPages()}`;
      doc.text(str, pageWidth - 14 - doc.getTextWidth(str), doc.internal.pageSize.height - 10);
      doc.text('Scholara - Tryout & Learning Platform', 14, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};

/**
 * Ekspor laporan hasil belajar individu siswa ke berkas PDF dengan dua tabel terpisah
 * @param {string} title - Judul Laporan
 * @param {Array<string>} columns1 - Header Kolom Tabel 1 (Nilai Kategori)
 * @param {Array<Array<any>>} rows1 - Baris Data Tabel 1
 * @param {Array<string>} columns2 - Header Kolom Tabel 2 (Akurasi CEFR)
 * @param {Array<Array<any>>} rows2 - Baris Data Tabel 2
 * @param {string} fileName - Nama file output
 */
export const exportStudentResultPDF = (title, columns1, rows1, columns2, rows2, fileName) => {
  const doc = new jsPDF('portrait');
  const pageWidth = 210;
  const center = pageWidth / 2;

  // 1. KOP SURAT (LETTERHEAD)
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(10, 36, 99); // Navy
  doc.text('SCHOLARA ACADEMY', center, 15, { align: 'center' });
  
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Sistem Pendukung Keputusan Rekomendasi Adaptif Pembelajaran Bahasa Inggris', center, 20, { align: 'center' });
  doc.text('Metode Simple Additive Weighting (SAW) · Terverifikasi Standar CEFR', center, 24, { align: 'center' });
  
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Website: www.scholara-beryl.vercel.app · Email: hendiss73@gmail.com', center, 28, { align: 'center' });
  
  doc.setDrawColor(10, 36, 99);
  doc.setLineWidth(0.8);
  doc.line(14, 31, pageWidth - 14, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32.5, pageWidth - 14, 32.5);

  // 2. HEADER DOKUMEN
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(title.toUpperCase(), 14, 41);
  
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 46);

  // 3. TABEL 1: RINGKASAN NILAI KATEGORI
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(10, 36, 99);
  doc.text('I. PEROLEHAN NILAI KATEGORI SKILL', 14, 54);

  autoTable(doc, {
    head: [columns1],
    body: rows1,
    startY: 58,
    styles: { font: 'times', fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { 
      fillColor: [10, 36, 99], 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: { 
      fillColor: [250, 248, 240]
    },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  const nextY = doc.lastAutoTable.finalY + 10;

  // 4. TABEL 2: DETAIL AKURASI CEFR (Hanya jika rows2 memiliki data)
  if (rows2 && rows2.length > 0) {
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(10, 36, 99);
    doc.text('II. RINCIAN AKURASI SOAL BERDASARKAN LEVEL CEFR', 14, nextY);

    autoTable(doc, {
      head: [columns2],
      body: rows2,
      startY: nextY + 4,
      styles: { font: 'times', fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { 
        fillColor: [10, 36, 99], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { 
        fillColor: [250, 248, 240]
      },
      theme: 'grid',
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        // Footer Halaman
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const str = `Halaman ${doc.internal.getNumberOfPages()}`;
        doc.text(str, pageWidth - 14 - doc.getTextWidth(str), doc.internal.pageSize.height - 10);
        doc.text('Scholara - Tryout & Learning Platform', 14, doc.internal.pageSize.height - 10);
      }
    });
  }

  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};

/**
 * Asisten penggambar Kop Surat resmi pada dokumen PDF
 * @param {jsPDF} doc - Referensi dokumen jsPDF
 * @param {number} pageWidth - Lebar halaman kertas
 */
const drawKopSurat = (doc, pageWidth) => {
  const center = pageWidth / 2;

  // Nama Lembaga
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(10, 36, 99); // Navy khas Scholara
  doc.text('SCHOLARA ACADEMY', center, 14, { align: 'center' });
  
  // Sub-judul / Deskripsi Lembaga
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Sistem Pendukung Keputusan Rekomendasi Adaptif Pembelajaran Bahasa Inggris', center, 19, { align: 'center' });
  doc.text('Metode Simple Additive Weighting (SAW) · Terverifikasi Standar CEFR', center, 23, { align: 'center' });
  
  // Informasi Kontak
  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Website: www.scholara-beryl.vercel.app · Email: hendiss73@gmail.com', center, 27, { align: 'center' });
  
  // Garis Pembatas Ganda
  doc.setDrawColor(10, 36, 99);
  doc.setLineWidth(0.8);
  doc.line(14, 30, pageWidth - 14, 30);
  doc.setLineWidth(0.2);
  doc.line(14, 31.5, pageWidth - 14, 31.5);
};

/**
 * Ekspor gabungan seluruh riwayat ujian siswa ke berkas PDF dengan detail 2 ujian (4 tabel) per halaman
 * @param {string} title - Judul Laporan
 * @param {Array<Object>} examReports - Daftar riwayat hasil ujian dari database
 * @param {string} fileName - Nama file output
 */
export const exportCombinedStudentResultsPDF = (title, examReports, fileName) => {
  const doc = new jsPDF('portrait');
  const pageWidth = 210;
  const packageNames = {
    kickstart_diagnostic: 'Ujian Diagnostik Awal',
    basic_mastery: 'Ujian Basic Mastery',
    pre_intermediate: 'Ujian Pre-Intermediate',
    intermediate_path: 'Ujian Intermediate Path',
    upper_intermediate: 'Ujian Upper-Intermediate',
    advanced_pro: 'Ujian Advanced Pro'
  };

  let currentY = 53;

  examReports.forEach((report, index) => {
    // Tentukan penempatan ujian pada halaman (2 ujian per halaman)
    const isFirstExamOnPage = index % 2 === 0;

    if (index > 0 && isFirstExamOnPage) {
      doc.addPage();
      drawKopSurat(doc, pageWidth);
      currentY = 40;
    } else if (index > 0 && !isFirstExamOnPage) {
      // Gambar garis pemisah horizontal tipis antara ujian 1 dan ujian 2
      doc.setDrawColor(200, 185, 154);
      doc.setLineWidth(0.3);
      doc.line(14, currentY + 3, pageWidth - 14, currentY + 3);
      currentY += 10;
    } else {
      // Halaman pertama: Gambar Kop Surat & Judul Dokumen Utama
      drawKopSurat(doc, pageWidth);
      
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(title.toUpperCase(), 14, 40);
      
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 45);
      
      currentY = 53;
    }

    // Rincian Sesi Ujian ini
    const pkgId = report.package_id || report.category_scores?.package_id;
    const name = packageNames[pkgId] || 'Ujian Utama';
    const dateStr = new Date(report.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(10, 36, 99);
    doc.text(`SESI UJIAN: ${name.toUpperCase()}`, 14, currentY);
    
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Tanggal Selesai: ${dateStr}   |   Skor Total: ${report.score_total}/100`, 14, currentY + 4.5);

    // Data Tabel 1: Nilai Kategori
    const columns1 = ['Kategori Skill', 'Nilai Perolehan', 'Ambang Batas Kelulusan', 'Status'];
    const categories = [
      { name: 'Grammar', key: 'grammar', fullname: 'Grammar (Struktur Bahasa)' },
      { name: 'Vocabulary', key: 'vocab', fullname: 'Vocabulary (Kosakata)' },
      { name: 'Reading', key: 'reading', fullname: 'Reading (Membaca Bacaan)' },
      { name: 'Cloze', key: 'cloze', fullname: 'Cloze (Kalimat Rumpang)' }
    ];

    const getCategoryScore = (catData) => {
      if (!catData) return 0;
      if (typeof catData === 'number') return catData;
      if (typeof catData === 'object' && catData !== null) {
        if (typeof catData.score === 'number') return catData.score;
      }
      return 0;
    };

    const rows1 = categories.map(c => {
      const score = getCategoryScore(report.category_scores?.[c.key]);
      return [
        c.fullname,
        `${score}%`,
        '80%',
        score >= 80 ? 'Kompeten' : 'Butuh Penguatan'
      ];
    });

    autoTable(doc, {
      head: [columns1],
      body: rows1,
      startY: currentY + 8,
      styles: { font: 'times', fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: [10, 36, 99], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [250, 248, 240] },
      theme: 'grid',
      margin: { left: 14, right: 14 }
    });

    const nextY = doc.lastAutoTable.finalY + 6;

    // Data Tabel 2: Akurasi CEFR
    const columns2 = ['Kategori Skill', 'A1/A2 (Basic)', 'B1/B2 (Intermediate)', 'C1/C2 (Proficient)'];
    const rows2 = categories.map(c => {
      const catData = report.category_scores?.[c.key];
      const stats = catData && typeof catData === 'object' ? catData.difficultyStats : null;

      const getStatStr = (lvl) => {
        if (!stats || !stats[lvl]) return '—';
        return `${stats[lvl].correct}/${stats[lvl].total} Benar`;
      };

      return [
        c.fullname,
        getStatStr('1'),
        getStatStr('2'),
        getStatStr('3')
      ];
    });

    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(10, 36, 99);
    doc.text('RINCIAN AKURASI SOAL BERDASARKAN LEVEL CEFR', 14, nextY);

    autoTable(doc, {
      head: [columns2],
      body: rows2,
      startY: nextY + 3.5,
      styles: { font: 'times', fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: [10, 36, 99], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [250, 248, 240] },
      theme: 'grid',
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        // Footer Halaman
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const str = `Halaman ${doc.internal.getNumberOfPages()}`;
        doc.text(str, pageWidth - 14 - doc.getTextWidth(str), doc.internal.pageSize.height - 10);
        doc.text('Scholara - Tryout & Learning Platform', 14, doc.internal.pageSize.height - 10);
      }
    });

    currentY = doc.lastAutoTable.finalY;
  });

  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};
