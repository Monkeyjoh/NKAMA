/**
 * NKAMA — Jetons de thème (couleurs & typographie).
 *
 * Les couleurs sont également exposées en variables CSS dans `global.css`
 * (utilisées via `var(--terracotta)` dans les objets de style inline).
 * Ce module sert de référence centrale côté JS.
 */

export const colors = {
  paper: "#F6F1E7",
  paperDim: "#EDE6D6",
  ink: "#2B2722",
  inkSoft: "#6B6258",
  terracotta: "#C1622D",
  terracottaDim: "#E8C9B4",
  olive: "#5C6B47",
  rust: "#A33B2A",
  line: "#D9CFBC",
  // teintes secondaires utilisées dans les badges
  amber: "#8A6A1F",
  amberBg: "#FBF1DE",
  oliveBg: "#E7EDE0",
  rustBg: "#FBE9E2",
};

export const fonts = {
  display: "'Georgia', 'Iowan Old Style', serif",
  body: "'Helvetica Neue', Arial, sans-serif",
};

export const layout = {
  maxWidth: 480,
  bottomNavHeight: 90,
};
