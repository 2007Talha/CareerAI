/**
 * CareerAI — Accessible Skip to Content Link
 *
 * Implements WCAG 2.1 AA bypass block allowing keyboard and screen-reader
 * users to bypass top-level navigation and land on the main content area.
 */

import React from 'react';

/**
 * Skip to Content component targeting #main-content.
 * @returns JSX Element for keyboard bypass
 */
export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '16px',
        zIndex: 99999,
        background: '#2563eb',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '6px',
        fontWeight: 600,
        fontSize: '0.875rem',
        textDecoration: 'none',
        transition: 'top 0.2s',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '16px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      Skip to main content (WCAG 2.1 AA)
    </a>
  );
};

export default SkipToContent;
