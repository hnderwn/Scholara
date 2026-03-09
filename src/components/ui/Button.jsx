import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', disabled = false, className = '', ...props }) => {
  // Ditambahkan: uppercase, tracking-wider, rounded-sm, dan efek hover klasik (elevasi & shadow)
  const baseStyles =
    'inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-sm focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(10,36,99,0.15)] disabled:hover:translate-y-0 disabled:hover:shadow-none';

  const variants = {
    // Primary: Biru Navy Terang ke Biru Navy Gelap
    primary: 'bg-[#1A4FAD] text-white border border-[#0A2463] hover:bg-[#0A2463] focus:ring-2 focus:ring-[#1A4FAD] focus:ring-offset-1 focus:ring-offset-[#F2ECD8]',

    // Secondary: Krem Kertas ke Krem Lebih Gelap
    secondary: 'bg-[#EDE4CC] text-[#0A2463] border border-[#C8B99A] hover:bg-[#E5D7B3] hover:border-[#0A2463] focus:ring-2 focus:ring-[#C8B99A] focus:ring-offset-1 focus:ring-offset-[#F2ECD8]',

    // Danger: Merah Crimson
    danger: 'bg-[#BF0A30] text-white border border-[#8B0020] hover:bg-[#8B0020] focus:ring-2 focus:ring-[#BF0A30] focus:ring-offset-1 focus:ring-offset-[#F2ECD8]',

    // Outline: Transparan/Parchment dengan border Emas, hover menjadi Biru Navy
    outline: 'bg-[#FAF6EC] text-[#6B5A42] border border-[#C8B99A] hover:border-[#0A2463] hover:text-[#0A2463] focus:ring-2 focus:ring-[#C8B99A] focus:ring-offset-1 focus:ring-offset-[#F2ECD8]',
  };

  // Karena menggunakan uppercase dan tracking-wider, ukuran teks diturunkan satu level
  // agar tombol tidak terlihat terlalu "gemuk" atau mendominasi layar
  const sizes = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-5 py-2.5 text-xs',
    lg: 'px-6 py-3 text-sm',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
