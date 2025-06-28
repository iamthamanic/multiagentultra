import type { Config } from 'tailwindcss';

/**
 * MultiAgent Ultra Design System v1.0
 *
 * Professional, production-ready design system extracted from existing UI
 * Follows 8px grid system with consistent color palette
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 🎨 Color System - Extracted from existing UI patterns
      colors: {
        // Primary Brand Colors (Blue-based system)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary brand color
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // Success Colors (Green system)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80', // Status indicators
          500: '#22c55e',
          600: '#16a34a', // Primary success
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },

        // Warning Colors (Yellow/Amber)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Primary warning
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        // Error Colors (Red system)
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // Primary error
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },

        // Neutral System (Gray scale)
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },

        // Extended Colors for specific use cases
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea', // Agent/AI related
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },

        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c', // Secondary accent
          800: '#9a3412',
          900: '#7c2d12',
        },
      },

      // 📝 Typography System
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600', // Section headers
        bold: '700', // Page titles
        extrabold: '800',
      },

      // 📏 Spacing System (8px grid)
      spacing: {
        '0.5': '0.125rem', // 2px
        '1': '0.25rem', // 4px
        '1.5': '0.375rem', // 6px
        '2': '0.5rem', // 8px
        '2.5': '0.625rem', // 10px
        '3': '0.75rem', // 12px
        '3.5': '0.875rem', // 14px
        '4': '1rem', // 16px
        '5': '1.25rem', // 20px
        '6': '1.5rem', // 24px - Standard card padding
        '7': '1.75rem', // 28px
        '8': '2rem', // 32px
        '9': '2.25rem', // 36px
        '10': '2.5rem', // 40px
        '12': '3rem', // 48px - Empty state spacing
        '16': '4rem', // 64px
        '20': '5rem', // 80px
        '24': '6rem', // 96px
      },

      // 🔲 Border Radius System
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem', // Standard for cards, buttons
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px', // Status badges, indicators
      },

      // 🌫️ Shadow System (Elevation levels)
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // Cards
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)', // Default elevation
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', // Hover states
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', // Modals
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)', // High elevation
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)', // Maximum elevation
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)', // Pressed states
      },

      // 🎭 Animation & Transitions
      transitionProperty: {
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
        all: 'all',
        transform: 'transform',
      },

      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms', // Standard transition
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      // 🖱️ Interactive States
      ringColor: {
        primary: '#3b82f6',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#dc2626',
      },

      // 📱 Responsive Grid System
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px', // md:grid-cols-2
        lg: '1024px', // lg:grid-cols-3
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },

  plugins: [],

  // Dark mode configuration
  darkMode: 'media', // Respects system preference
} satisfies Config;

export default config;
