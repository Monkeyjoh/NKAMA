/**
 * NKAMA — Objets de style partagés (approche inline, identique au prototype).
 *
 * Tous les composants importent ce qu'il leur faut depuis `S`.
 * Garder cette source unique évite toute dérive visuelle entre écrans.
 */
import { fonts } from "@/styles/theme";

export const fontDisplay = fonts.display;
export const fontBody = fonts.body;

export const S = {
  // ── Shell ────────────────────────────────────────────────
  app: { minHeight: "100vh", background: "var(--paper)", color: "var(--ink)", fontFamily: fontBody, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", position: "relative" },
  main: { flex: 1, overflowY: "auto", paddingBottom: 90 },
  screen: { padding: "18px 18px 8px" },

  // ── Header tableau de bord ───────────────────────────────
  dashHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "var(--paper)", zIndex: 5 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerMark: { width: 34, height: 34, borderRadius: "50%", background: "var(--ink)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontSize: 13 },
  headerTitle: { fontFamily: fontDisplay, fontSize: 16, lineHeight: 1.1 },
  headerRole: { fontSize: 11, color: "var(--ink-soft)" },
  bellBtn: { position: "relative", background: "none", border: "none", color: "var(--ink)", padding: 6 },
  bellDot: { position: "absolute", top: 5, right: 6, width: 7, height: 7, borderRadius: "50%", background: "var(--rust)", border: "1.5px solid var(--paper)" },

  // ── Sous-header (avec retour) ────────────────────────────
  subHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "var(--paper)", zIndex: 5 },
  subHeaderTitle: { fontFamily: fontDisplay, fontSize: 17 },
  backBtn: { background: "none", border: "none", color: "var(--ink)", padding: 4 },

  // ── Onglets tableau de bord ──────────────────────────────
  dashTabs: { display: "flex", gap: 6, padding: "12px 18px 0", borderBottom: "1px solid var(--line)" },
  dashTabBtn: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13.5, padding: "8px 4px 12px", borderBottom: "2px solid transparent", marginRight: 14 },
  dashTabBtnActive: { color: "var(--ink)", borderBottomColor: "var(--terracotta)", fontWeight: 600 },
  tabBadge: { background: "var(--rust)", color: "white", fontSize: 10.5, borderRadius: 999, padding: "1px 6px", fontWeight: 700, marginLeft: 4 },

  // ── Onglets plats (finances / maintenance) ───────────────
  dashTabsFlat: { display: "flex", padding: "10px 18px 0", borderBottom: "1px solid var(--line)" },
  flatTabBtn: { background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13, padding: "8px 4px 12px", borderBottom: "2px solid transparent", marginRight: 18 },
  flatTabBtnActive: { color: "var(--ink)", borderBottomColor: "var(--terracotta)", fontWeight: 600 },
  tabCount: { fontSize: 10.5, background: "var(--paper-dim)", borderRadius: 999, padding: "1px 6px" },

  // ── KPI ──────────────────────────────────────────────────
  kpiGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  kpiCard: { background: "white", borderTop: "3px solid", borderRadius: 8, padding: "12px 14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
  kpiLabel: { fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 },
  kpiValue: { fontFamily: fontDisplay, fontSize: 17, lineHeight: 1.2 },
  kpiSubRow: { display: "flex", alignItems: "center", gap: 5, marginTop: 3 },
  kpiSub: { fontSize: 11, color: "var(--ink-soft)" },

  // ── Occupation ───────────────────────────────────────────
  occupationCard: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", marginTop: 14 },
  occupationLabel: { fontSize: 11.5, color: "var(--ink-soft)" },
  occupationValue: { fontSize: 14.5, fontWeight: 600, marginTop: 2 },
  occupationRing: { position: "relative", width: 52, height: 52 },
  occupationRingText: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 },

  // ── Libellés de section ──────────────────────────────────
  sectionLabelRow: { display: "flex", alignItems: "center", gap: 6, color: "var(--ink-soft)", margin: "24px 0 10px" },
  sectionLabel: { fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.6 },
  list: { display: "flex", flexDirection: "column", gap: 10 },

  // ── Alertes ──────────────────────────────────────────────
  alertCard: { display: "flex", gap: 10, borderRadius: 8, padding: "12px 14px", border: "1px solid", width: "100%", textAlign: "left", background: "white" },
  alertCardHigh: { background: "#FBE9E2", borderColor: "var(--rust)", color: "var(--rust)" },
  alertCardMedium: { background: "#FBF1DE", borderColor: "#C1972D", color: "#8A6A1F" },
  alertCardTitle: { fontWeight: 700, fontSize: 13 },
  alertCardDetail: { fontSize: 12, marginTop: 2, lineHeight: 1.4 },

  // ── Aperçus ──────────────────────────────────────────────
  apercusGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  apercuCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", textAlign: "left" },
  apercuHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  apercuTitre: { fontSize: 13, fontWeight: 600 },
  apercuLignes: { display: "flex", flexDirection: "column", gap: 5 },
  apercuLigne: { display: "flex", justifyContent: "space-between", fontSize: 12 },
  apercuLigneLabel: { color: "var(--ink-soft)" },
  apercuLigneValeur: { fontWeight: 700 },

  // ── Bannière ─────────────────────────────────────────────
  banner: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "var(--ink)", color: "var(--paper)", border: "none", borderRadius: 10, padding: "13px 16px", marginTop: 18, fontSize: 13 },
  bannerLeft: { display: "flex", alignItems: "center", gap: 8 },

  // ── Activité récente ─────────────────────────────────────
  activityRow: { display: "flex", alignItems: "flex-start", gap: 10, background: "white", border: "1px solid var(--line)", borderRadius: 8, padding: "11px 14px" },
  activityDot: { width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0 },
  activityText: { fontSize: 13 },
  activityTime: { fontSize: 11, color: "var(--ink-soft)", marginTop: 2 },

  propertyName: { fontWeight: 600, fontSize: 14 },
  propertyMeta: { fontSize: 12, color: "var(--ink-soft)", marginTop: 2 },

  // ── À valider ────────────────────────────────────────────
  aValiderIntro: { fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 14, lineHeight: 1.5 },
  valideCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px" },
  valideCardTop: { display: "flex", alignItems: "flex-start", gap: 10 },
  valideIconWrap: { width: 32, height: 32, borderRadius: 8, background: "var(--paper-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  canalTag: { fontSize: 10.5, color: "var(--ink-soft)", background: "var(--paper-dim)", padding: "3px 8px", borderRadius: 999, flexShrink: 0 },
  valideActions: { display: "flex", gap: 8, marginTop: 12 },
  valideBtnPrimary: { flex: 1, background: "var(--terracotta)", color: "white", border: "none", borderRadius: 7, padding: "9px 12px", fontSize: 12.5, fontWeight: 600 },
  valideBtnGhost: { background: "none", color: "var(--ink-soft)", border: "1px solid var(--line)", borderRadius: 7, padding: "9px 12px", fontSize: 12.5 },

  // ── États vides ──────────────────────────────────────────
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "60px 20px", gap: 8 },
  emptyTitle: { fontFamily: fontDisplay, fontSize: 17, marginTop: 6 },
  emptyText: { fontSize: 13, color: "var(--ink-soft)" },
  emptyInline: { fontSize: 13, color: "var(--ink-soft)", padding: "16px 4px", lineHeight: 1.5 },
  linkBtn: { background: "none", border: "none", color: "var(--terracotta)", fontWeight: 600, fontSize: 13, padding: 0 },

  // ── Navigation basse ─────────────────────────────────────
  bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "white", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-around", padding: "8px 4px 12px", zIndex: 20 },
  navBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", color: "var(--ink-soft)", fontSize: 11, padding: "4px 8px" },
  navBtnActive: { color: "var(--terracotta)" },
  navLabel: { fontSize: 10 },

  // ── Toast ────────────────────────────────────────────────
  toast: { position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--paper)", padding: "10px 16px", borderRadius: 999, fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, zIndex: 60, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },

  // ── Liste de biens ───────────────────────────────────────
  screenHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  screenSubtitle: { fontSize: 12.5, color: "var(--ink-soft)" },
  addBtn: { display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, background: "var(--ink)", color: "var(--paper)", border: "none", borderRadius: 7, padding: "7px 11px" },
  bienRow: { display: "flex", alignItems: "center", gap: 12, background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", width: "100%" },
  bienThumb: { width: 46, height: 46, borderRadius: 8, background: "var(--paper-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bienLoyer: { fontFamily: fontDisplay, fontSize: 13, marginTop: 5 },
  statusTag: { fontSize: 11, padding: "3px 9px", borderRadius: 999, fontWeight: 600, flexShrink: 0 },
  statusOk: { background: "#E7EDE0", color: "var(--olive)" },
  statusVacant: { background: "var(--paper-dim)", color: "var(--ink-soft)" },

  // ── Fiche bien ───────────────────────────────────────────
  gallery: { position: "relative" },
  galleryMain: { width: "100%", height: 200, background: "var(--paper-dim)", display: "flex", alignItems: "center", justifyContent: "center" },
  galleryCount: { position: "absolute", bottom: 10, right: 14, background: "rgba(43,39,34,0.75)", color: "white", border: "none", borderRadius: 999, padding: "5px 11px", fontSize: 11.5, display: "flex", alignItems: "center", gap: 5 },
  titleBlock: { padding: "16px 18px 0" },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  bienTitle: { fontFamily: fontDisplay, fontSize: 21, margin: 0 },
  address: { display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--ink-soft)", marginTop: 5 },
  factsRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-soft)", marginTop: 10 },
  factsDot: { opacity: 0.5 },
  heroKpiRow: { display: "flex", alignItems: "center", background: "white", border: "1px solid var(--line)", borderRadius: 10, margin: "16px 18px 0", padding: "14px 16px" },
  heroKpi: { flex: 1 },
  heroKpiLabel: { fontSize: 11, color: "var(--ink-soft)" },
  heroKpiValue: { fontFamily: fontDisplay, fontSize: 18, marginTop: 3 },
  heroKpiDivider: { width: 1, height: 32, background: "var(--line)", margin: "0 14px" },
  sectionTabs: { display: "flex", gap: 4, margin: "20px 18px 0", padding: 3, background: "var(--paper-dim)", borderRadius: 10 },
  sectionTab: { flex: 1, background: "none", border: "none", color: "var(--ink-soft)", fontSize: 12, padding: "8px 4px", borderRadius: 8, fontWeight: 600 },
  sectionTabActive: { background: "white", color: "var(--ink)", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" },
  sectionBody: { padding: "16px 18px 8px" },
  sectionBodyHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionBodySubtitle: { fontSize: 12.5, color: "var(--ink-soft)" },
  miniAddBtn: { display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, background: "var(--ink)", color: "var(--paper)", border: "none", borderRadius: 7, padding: "6px 10px" },

  rowCard: { display: "flex", alignItems: "center", gap: 10, background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", width: "100%", textAlign: "left" },
  iconWrap32: { width: 32, height: 32, borderRadius: 8, background: "var(--paper-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  amount: { fontFamily: fontDisplay, fontSize: 13.5 },
  validatedTag: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "var(--olive)", marginTop: 3 },
  miniLink: { fontSize: 11, color: "var(--terracotta)", fontWeight: 600, display: "block", marginTop: 3 },

  tenantCard: { background: "white", border: "1px solid var(--line)", borderRadius: 12, padding: "16px" },
  tenantTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  avatar40: { width: 40, height: 40, borderRadius: "50%", background: "var(--terracotta-dim)", color: "var(--terracotta)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 },
  tenantName: { fontSize: 14.5, fontWeight: 600 },
  tenantSince: { fontSize: 12, color: "var(--ink-soft)", marginTop: 2 },
  scoreRow: { marginBottom: 14 },
  scoreLabel: { fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 6 },
  scoreTrack: { height: 8, background: "var(--paper-dim)", borderRadius: 999, overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 999 },
  scoreValue: { fontSize: 12.5, fontWeight: 700, marginTop: 6 },
  quickActions: { display: "flex", gap: 8, marginBottom: 0 },
  quickActionBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--paper-dim)", border: "1px solid var(--line)", borderRadius: 8, padding: "9px 10px", fontSize: 12.5, fontWeight: 600 },
  scoreNote: { fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 12 },

  financeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 },
  financeCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" },
  bienCardLabel: { fontSize: 11, color: "var(--ink-soft)" },
  financeValue: { fontFamily: fontDisplay, fontSize: 15.5, marginTop: 4 },
  netCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  netCardLeft: { display: "flex", alignItems: "center", gap: 10 },
  netFormula: { fontSize: 10.5, color: "var(--ink-soft)", maxWidth: 90, textAlign: "right", lineHeight: 1.4 },

  // ── CRM ──────────────────────────────────────────────────
  summaryRow: { display: "flex", gap: 8, padding: "12px 14px", overflowX: "auto", borderBottom: "1px solid var(--line)" },
  summaryChip: { display: "flex", alignItems: "center", gap: 5, background: "white", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 10px", flexShrink: 0, fontSize: 11.5 },
  summaryDot: { width: 6, height: 6, borderRadius: "50%" },
  summaryCount: { fontWeight: 700 },
  summaryLabel: { color: "var(--ink-soft)" },
  kanbanVertical: { display: "flex", flexDirection: "column", gap: 22, padding: "16px 14px" },
  kanbanColumn: { display: "flex", flexDirection: "column" },
  kanbanColumnHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "0 2px" },
  kanbanDot: { width: 7, height: 7, borderRadius: "50%" },
  kanbanColumnTitle: { fontSize: 13, fontWeight: 700, flex: 1 },
  kanbanColumnCount: { fontSize: 11, color: "var(--ink-soft)", background: "var(--paper-dim)", borderRadius: 999, padding: "1px 7px" },
  kanbanCardsVertical: { display: "flex", flexDirection: "column", gap: 8 },
  kanbanEmpty: { fontSize: 12, color: "var(--ink-soft)", textAlign: "center", padding: "16px 8px", border: "1px dashed var(--line)", borderRadius: 8 },
  prospectRow: { display: "flex", alignItems: "center", gap: 10, background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", width: "100%", textAlign: "left" },
  prospectAvatar: { width: 36, height: 36, borderRadius: "50%", background: "var(--terracotta-dim)", color: "var(--terracotta)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 },
  prospectName: { fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 },
  prospectMeta: { fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 },
  prospectBudgetRow: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  prospectBudget: { fontFamily: fontDisplay, fontSize: 13 },
  prospectNextAction: { display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--terracotta)", fontWeight: 600, marginTop: 4 },

  fab: { position: "fixed", bottom: 88, right: "max(16px, calc(50% - 224px))", width: 50, height: 50, borderRadius: "50%", background: "var(--ink)", color: "var(--paper)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.25)", zIndex: 10 },

  // ── Modale (bottom sheet) ────────────────────────────────
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(43,39,34,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 },
  modalCard: { background: "var(--paper)", width: "100%", maxWidth: 480, borderRadius: "16px 16px 0 0", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)" },
  modalTitle: { fontFamily: fontDisplay, fontSize: 16.5, paddingRight: 10 },
  modalBack: { background: "none", border: "none", color: "var(--ink)", padding: 4, flexShrink: 0 },
  modalBody: { padding: "16px 18px 28px" },
  modalSectionLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--ink-soft)", margin: "18px 0 10px" },
  contactGrid: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  contactRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)" },
  softAlert: { display: "flex", gap: 8, background: "#FBF1DE", color: "#8A6A1F", borderRadius: 8, padding: "10px 12px", fontSize: 12, marginTop: 16, marginBottom: 0, lineHeight: 1.5 },

  // ── Pipelines (CRM + Maintenance) ────────────────────────
  pipelineSteps: { display: "flex", alignItems: "center", marginBottom: 6 },
  pipelineStepWrap: { display: "flex", alignItems: "center", flex: 1 },
  pipelineStep: { width: 24, height: 24, borderRadius: "50%", background: "var(--paper-dim)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", flexShrink: 0 },
  pipelineStepActive: { background: "var(--terracotta)", borderColor: "var(--terracotta)", color: "white" },
  pipelineLine: { flex: 1, height: 2, background: "var(--line)" },
  pipelineLineActive: { background: "var(--terracotta)" },
  pipelineLabels: { display: "flex", justifyContent: "space-between", marginBottom: 20 },
  pipelineLabel: { fontSize: 9, color: "var(--ink-soft)", width: 44, textAlign: "center" },
  statutActions: { display: "flex", flexDirection: "column", gap: 8 },
  advanceBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--terracotta)", color: "white", border: "none", borderRadius: 9, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  refuseBtn: { background: "none", color: "var(--rust)", border: "1px solid var(--rust)", borderRadius: 9, padding: "10px 14px", fontSize: 12.5, fontWeight: 600 },
  terminalBanner: { borderRadius: 9, padding: "11px 14px", fontSize: 12.5, marginTop: 4, lineHeight: 1.5 },
  terminalBannerSigne: { background: "#E7EDE0", color: "var(--olive)" },
  terminalBannerRefuse: { background: "#FBE9E2", color: "var(--rust)" },
  historyList: { display: "flex", flexDirection: "column", gap: 10 },
  historyItem: { borderLeft: "2px solid var(--line)", paddingLeft: 12 },
  historyDate: { fontSize: 11, color: "var(--ink-soft)", marginBottom: 2 },
  historyText: { fontSize: 13, lineHeight: 1.4 },

  // ── Graphiques ───────────────────────────────────────────
  chartCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "16px 14px 12px" },
  barChartWrap: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 110, gap: 6 },
  barGroup: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  barPair: { display: "flex", alignItems: "flex-end", gap: 3, height: 90 },
  barAttendu: { width: 9, background: "var(--paper-dim)", border: "1px solid var(--line)", borderRadius: "3px 3px 0 0" },
  barEncaisse: { width: 9, borderRadius: "3px 3px 0 0" },
  barLabel: { fontSize: 10, color: "var(--ink-soft)", marginTop: 6 },
  legendRow: { display: "flex", gap: 16, marginTop: 14, justifyContent: "center" },
  legendItem: { display: "flex", alignItems: "center", gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: "50%" },
  legendLabel: { fontSize: 11.5, color: "var(--ink-soft)" },
  depensesBarList: { display: "flex", flexDirection: "column", gap: 12 },
  depensesBarTop: { display: "flex", justifyContent: "space-between", marginBottom: 5 },
  depensesBarLabel: { fontSize: 12.5, fontWeight: 600 },
  depensesBarMontant: { fontSize: 12, color: "var(--ink-soft)" },
  depensesBarTrack: { height: 7, background: "var(--paper-dim)", borderRadius: 999, overflow: "hidden" },
  depensesBarFill: { height: "100%", borderRadius: 999 },

  rankRow: { display: "flex", alignItems: "center", gap: 10, background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", width: "100%" },
  rankNumber: { width: 22, height: 22, borderRadius: "50%", background: "var(--paper-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  rentabiliteTag: { fontSize: 13.5, fontWeight: 700 },

  // ── Dépenses ─────────────────────────────────────────────
  expenseCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", width: "100%", textAlign: "left" },
  expenseCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  expenseAmount: { fontFamily: fontDisplay, fontSize: 15 },
  expenseCardBottom: { display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  justifTag: { fontSize: 11, color: "var(--ink-soft)", display: "inline-flex", alignItems: "center", gap: 4 },
  justifTagMuted: { fontSize: 11, color: "var(--ink-soft)", opacity: 0.6 },

  detailAmount: { fontFamily: fontDisplay, fontSize: 26, marginBottom: 16 },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" },
  detailLabel: { fontSize: 12.5, color: "var(--ink-soft)" },
  detailValue: { fontSize: 13.5, fontWeight: 600 },
  motifBox: { display: "flex", gap: 8, background: "#FBE9E2", color: "var(--rust)", borderRadius: 8, padding: "11px 13px", fontSize: 12.5, marginTop: 14, lineHeight: 1.5 },
  modalActions: { display: "flex", gap: 10, marginTop: 20 },
  validateBtnFull: { flex: 1, background: "var(--olive)", color: "white", border: "none", borderRadius: 9, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  rejectBtnFull: { flex: 1, background: "none", color: "var(--rust)", border: "1px solid var(--rust)", borderRadius: 9, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },

  bienFinanceCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px" },
  bienCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  bienCardGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 },
  bienCardValue: { fontSize: 13.5, fontWeight: 600, marginTop: 2 },

  // ── Maintenance ──────────────────────────────────────────
  ticketCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "13px 15px", width: "100%", textAlign: "left" },
  ticketCardTop: { display: "flex", alignItems: "flex-start", gap: 10 },
  ticketCardBottom: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  prioriteTag: { fontSize: 11, fontWeight: 600 },
  proofIcons: { display: "flex", gap: 10 },
  proofDotWrap: { display: "flex", alignItems: "center", gap: 3 },
  proofDot: { width: 14, height: 14, borderRadius: "50%", border: "1.5px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" },
  proofDotDone: { background: "var(--olive)", borderColor: "var(--olive)" },
  proofLabel: { fontSize: 9.5, color: "var(--ink-soft)" },
  metaRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 18 },
  proofGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 },
  proofBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "white", border: "1px solid var(--line)", borderRadius: 9, padding: "12px 6px" },
  proofBoxDone: { background: "#E7EDE0", borderColor: "var(--olive)" },
  proofBoxMissing: { background: "#FBE9E2", borderColor: "var(--rust)" },
  proofBoxLabel: { fontSize: 10.5, fontWeight: 600 },
  proofBoxMissingLabel: { fontSize: 9, color: "var(--rust)" },
  infoRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "9px 0", borderBottom: "1px solid var(--line)" },
  actionsBlock: { marginTop: 18, display: "flex", flexDirection: "column", gap: 10 },
  lockNote: { display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--rust)", background: "#FBE9E2", borderRadius: 8, padding: "9px 11px", lineHeight: 1.4 },
  primaryBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--terracotta)", color: "white", border: "none", borderRadius: 9, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  primaryBtnDisabled: { background: "var(--paper-dim)", color: "var(--ink-soft)" },
  validationNote: { fontSize: 11.5, color: "var(--ink-soft)", background: "var(--paper-dim)", borderRadius: 8, padding: "9px 11px", lineHeight: 1.4 },
  validateBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--olive)", color: "white", border: "none", borderRadius: 9, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  reopenBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", color: "var(--rust)", border: "1px solid var(--rust)", borderRadius: 9, padding: "11px 14px", fontSize: 12.5, fontWeight: 600 },
  imputableNote: { fontSize: 11.5, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.5, fontStyle: "italic" },

  // ── Menu Plus ────────────────────────────────────────────
  group: { marginBottom: 26 },
  groupLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--ink-soft)", marginBottom: 10, padding: "0 2px" },
  menuRow: { display: "flex", alignItems: "center", gap: 12, background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "13px 14px", width: "100%" },
  menuRowHighlight: { borderColor: "var(--rust)" },
  iconWrap36: { width: 36, height: 36, borderRadius: 9, background: "var(--paper-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconWrapHighlight: { background: "#FBE9E2", color: "var(--rust)" },
  menuLabel: { fontSize: 14.5, fontWeight: 600 },
  menuSub: { fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 },
  menuCount: { fontWeight: 700, color: "var(--ink)" },
  logoutRow: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13, padding: "12px 4px", marginTop: 6 },
  footerNote: { textAlign: "center", fontSize: 11, color: "var(--ink-soft)", marginTop: 18, opacity: 0.7 },

  settingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", fontSize: 12.5 },
  settingVal: { fontWeight: 700, color: "var(--terracotta)" },
};
