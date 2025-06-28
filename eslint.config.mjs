import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // 🚨 Kategorie 1: Potenzielle Fehler (NIEMALS lockern!)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-undef': 'error',
      'no-constant-condition': 'error',
      eqeqeq: 'error',

      // 🔧 Kategorie 2: Best Practices (Streng, aber begründete Ausnahmen erlaubt)
      'no-console': 'warn', // In development OK, in production error
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 4],
      'no-else-return': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',

      // 🎨 Kategorie 3: Stil (Auto-fixable, weniger kritisch)
      'max-len': ['warn', { code: 100, ignoreUrls: true }],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      indent: ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],

      // Next.js spezifisch
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn', // Prefer next/image
    },
  },
];

export default eslintConfig;
