import React from 'react';

/**
 * Komponen Garis Pembagi Merah Gradasi Khas Scholara
 */
export const RedRule = ({ opacity = 1 }) => (
  <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />
);

/**
 * Komponen Garis Pembagi Emas Tipis Gradasi Khas Scholara
 */
export const GoldRule = ({ opacity = 1 }) => (
  <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />
);
