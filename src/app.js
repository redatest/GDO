/**
 * GDO-MT Web — Application SPA en Pur JavaScript (Sans TypeScript, Thème Clair)
 * Architecture Single Page Application (SPA) native sans dépendance serveur Node.js.
 */

import { networkData } from './data/networkData.js';
import { departsSummary } from './data/departsSummary.js';
import { tableSchemas } from './data/tableSchemas.js';
import { fullTablesData } from './data/fullTablesData.js';

// --- RÉFÉRENTIEL PAR DÉFAUT DES PARAMÈTRES RÉSEAU MT ---
const DEFAULT_SETTINGS = {
  transfos: [
    { kva: 50, ucc: 4.0, p0: 145, pk: 1050, in30: 0.96, type: 'AC', desc: 'Poste haut de poteau rural' },
    { kva: 100, ucc: 4.0, p0: 260, pk: 1750, in30: 1.92, type: 'AC/MS', desc: 'Poste agricole / village' },
    { kva: 160, ucc: 4.0, p0: 390, pk: 2350, in30: 3.08, type: 'MS', desc: 'Cabine maçonnée standard' },
    { kva: 250, ucc: 4.0, p0: 530, pk: 3250, in30: 4.81, type: 'MS', desc: 'Agglomération moyenne' },
    { kva: 400, ucc: 4.0, p0: 750, pk: 4600, in30: 7.70, type: 'MS', desc: 'Centre urbain / industrie' },
    { kva: 630, ucc: 4.0, p0: 1100, pk: 6500, in30: 12.12, type: 'MS', desc: 'Zone industrielle / hôpital' },
    { kva: 1000, ucc: 5.0, p0: 1700, pk: 10500, in30: 19.24, type: 'MS', desc: 'Grosse unité industrielle' }
  ],
  conducteurs: [
    { code: 'AM_36', nom: 'Almélec 36 mm²', section: 36, nat: 'AM', r: 0.92, x: 0.38, iMax: 155, pose: 'AÉRIEN NU' },
    { code: 'AM_75', nom: 'Almélec 75 mm²', section: 75, nat: 'AM', r: 0.44, x: 0.36, iMax: 245, pose: 'AÉRIEN NU' },
    { code: 'AM_117', nom: 'Almélec 117 mm²', section: 117, nat: 'AM', r: 0.28, x: 0.35, iMax: 330, pose: 'AÉRIEN NU' },
    { code: 'AM_148', nom: 'Almélec 148 mm²', section: 148, nat: 'AM', r: 0.22, x: 0.34, iMax: 385, pose: 'AÉRIEN NU' },
    { code: 'CU_25', nom: 'Cuivre 25 mm²', section: 25, nat: 'CU', r: 0.72, x: 0.39, iMax: 140, pose: 'AÉRIEN NU' },
    { code: 'CU_50', nom: 'Cuivre 50 mm²', section: 50, nat: 'CU', r: 0.36, x: 0.37, iMax: 215, pose: 'AÉRIEN NU' },
    { code: 'SOUT_150', nom: 'Câble Souterrain Alu 150 mm²', section: 150, nat: 'AL', r: 0.21, x: 0.12, iMax: 320, pose: 'SOUTERRAIN' },
    { code: 'SOUT_240', nom: 'Câble Souterrain Alu 240 mm²', section: 240, nat: 'AL', r: 0.13, x: 0.11, iMax: 415, pose: 'SOUTERRAIN' }
  ],
  noeuds: [
    { prefix: 'H', label: 'Poste Source', tension: '60/30 kV ou 90/30 kV', organe: 'Disjoncteur général + Rame MT', couleur: '#7c3aed' },
    { prefix: 'P', label: 'Poste HTA/BT', tension: '30 kV / 400 V', organe: 'Interrupteur-fusible combiné', couleur: '#ea580c' },
    { prefix: 'E', label: 'Étoilement (Piquage)', tension: '30 kV', organe: 'Ponts de dérivation sur poteau', couleur: '#0d9488' },
    { prefix: 'O', label: 'Poste de Coupure (PC)', tension: '30 kV', organe: 'Interrupteur à commande manuelle / IAT', couleur: '#059669' },
    { prefix: 'R', label: 'Poste de Répartition', tension: '30 kV', organe: 'Cellules d\'aiguillage MT', couleur: '#0284c7' },
    { prefix: 'C', label: 'Cellule MT', tension: '30 kV', organe: 'Disjoncteur départ ou arrivée', couleur: '#2563eb' },
    { prefix: 'B', label: 'Jeu de Barres', tension: '30 kV', organe: 'Barres collectrices en cuivre', couleur: '#475569' },
    { prefix: 'J', label: 'Jonction de passage', tension: '30 kV', organe: 'Support d\'alignement / d\'ancrage', couleur: '#64748b' }
  ],
  seuils: {
    tensionNominale: 30.0,
    tensionMin: 27.0,
    tensionMax: 33.0,
    chuteTensionMax: 5.0,
    chuteTensionMaxRurale: 7.0,
    cosPhi: 0.90,
    frequence: 50,
    tempRef: 40
  }
};

function loadStoredSettings() {
  try {
    const saved = localStorage.getItem('gdo_mt_settings');
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.warn('Impossible de charger les paramètres locaux:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

// --- ÉTAT GLOBAL DE L'APPLICATION (SPA STATE) ---
const state = {
  activeTab: 'dashboard',
  selectedDepartId: '125H3C20',
  layoutMode: 'hierarchical', // 'hierarchical' | 'radial' | 'simplified'
  showJunctions: false,
  showLengths: true,
  colorMode: 'type',
  zoom: 1,
  pan: { x: 60, y: 120 },
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  selectedNode: null,
  selectedEdge: null,
  searchQuery: '',
  // Paramètres réseau
  settingsSubTab: 'transfos', // 'transfos' | 'conducteurs' | 'noeuds' | 'seuils'
  settings: loadStoredSettings(),
  settingsSavedNotice: false,
  showNewTransfoModal: false,
  showNewConducteurModal: false,
  // Explorateur
  explorerTable: 'Poste_htabt_lig',
  explorerSheet: 'anomalie',
  explorerPage: 1,
  explorerPageSize: 20,
  explorerSearch: '',
  // GPARC Mobile
  mobileDepartId: '125H3C20',
  mobileSearchQuery: '',
  mobileSelectedPosteId: '125P8002',
  mobileAnomalieType: 'RAS',
  mobileNote: '',
  mobileInterventions: [
    {
      id: 'INT-001',
      posteId: '121P8002',
      date: '28/10/2026 09:30',
      type: 'Contrôle Huile Transfo',
      note: 'Niveau d\'huile normal, disjoncteur BT OK.'
    }
  ],
  // Modal rapport
  showReportModal: false,
  reportCopied: false
};

// --- RAPPORT TECHNIQUE EN TEXTE PUR ---
const REPORT_TEXT = `# RAPPORT DE SYNTHÈSE TECHNIQUE — GDO-MT (RÉSEAU MOYENNE TENSION)
Date d'analyse : 28 Octobre 2026
Source : Fichiers Excel DBase III / FoxPro (12 tables)
Wilaya : Guelma (Districts 121, 123, 125, 127)
Architecture : 100% PUR JAVASCRIPT / CLIENT-SIDE SPA (0% NODE.JS)

1. VOLUMÉTRIE & INVENTAIRE PHYSIQUE
- Départs Moyenne Tension (HTA 30 kV) : 51 départs opérationnels
- Linéaire Total de Réseau : 1 240,8 km de lignes
- Arcs de Lignes & Tronçons : 7 678 branches physiques
- Postes de Distribution HTA / BT : 504 transformateurs de distribution
- Puissance Totale Installée : ~38 450 kVA
- Nœuds de Piquage (Étoilements) : 378 nœuds de bifurcation
- Postes Sources (HTB / HTA) : 2 sous-stations (125H3 NADOR 60/30kV, 125H2 MEDJEZ SFA 90/30kV)
- Postes de Coupure & Répartition : 1 PC Fendjel (121O1), 1 PC Ain Amara (121R2)

2. RÈGLE DE CODIFICATION NORMALISÉE
- Format : [Agence 3 ch.][Type Ouvrage 1 car.][N° Ouvrage][Cellule]
  * H = Poste Source HTB/HTA
  * C = Cellule MT
  * B = Jeu de barres MT
  * O = Poste de Coupure (PC)
  * E = Étoilement de ligne (Piquage)
  * P = Poste HTA/BT (Transfo 30kV/400V)
  * J = Jonction de passage / Support

3. AUDIT DE QUALITÉ & ANOMALIES
- 7 664 arcs avec tension enregistrée à 0.0V (anomalie de saisie DBase, normalisée à 30 kV).
- 6 départs dans Depart.xls avec 'num_depart' vide (réconciliés via 'num_depart_cellule').
- 14 arcs orphelins sans correspondance de tronçon physique.

4. PARAMÈTRES & RÉFÉRENTIEL DU RÉSEAU MT
- Transformateurs gérés : calibres 50 à 1000 kVA (Ucc 4%, pertes fer et cuivre configurables).
- Arcs de lignes : Almélec 36, 75, 117, 148 mm², Cuivre 25/50 mm², Souterrain 150/240 mm².
- Chute de tension maximale admissible : 5.0 % (7.0 % en zone rurale).`;

// --- FONCTIONS UTILITAIRES ---
function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('fr-FR');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function setTab(tabName) {
  state.activeTab = tabName;
  renderApp();
}

// --- RENDU DU HEADER ---
function renderHeader() {
  const tabs = [
    { id: 'dashboard', label: 'Synthèse Réseau' },
    { id: 'topology', label: 'Architecture Physique' },
    { id: 'mobile', label: 'GPARC-Mobile (Terrain)' },
    { id: 'structural', label: 'Modèle DBase' },
    { id: 'settings', label: 'Paramètres Réseau' },
    { id: 'explorer', label: '12 Tables Excel' },
  ];

  return `
    <header class="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs">
      <!-- Zone 1 : Wordmark Brand -->
      <div class="flex items-center gap-3 shrink-0">
        <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
          MT
        </div>
        <div>
          <span class="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
            GDO-MT Web
          </span>
          <span class="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">
            Pur JavaScript &middot; Thème Clair
          </span>
        </div>
      </div>

      <!-- Zone 2 : Navigation SPA -->
      <nav class="hidden lg:flex items-center gap-1 text-xs font-semibold">
        ${tabs.map(t => `
          <button
            onclick="window.app.setTab('${t.id}')"
            class="px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              state.activeTab === t.id
                ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }"
          >
            ${t.label}
          </button>
        `).join('')}
      </nav>

      <!-- Zone 3 : Action Primaire -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          onclick="window.app.toggleReportModal(true)"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <span>Exporter Synthèse</span>
        </button>
      </div>
    </header>
  `;
}

// --- VUE 1 : DASHBOARD & SYNTHÈSE RÉSEAU ---
function renderDashboard() {
  const topDeparts = departsSummary.slice(0, 8);
  const totalKm = departsSummary.reduce((acc, d) => acc + d.totalLengthKm, 0).toFixed(1);
  const totalPostes = departsSummary.reduce((acc, d) => acc + d.posteCount, 0);
  const totalPower = departsSummary.reduce((acc, d) => acc + d.totalPowerKva, 0);
  const totalArcs = departsSummary.reduce((acc, d) => acc + d.arcCount, 0);

  return `
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <!-- Hero Card -->
      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-2 max-w-3xl">
            <span class="text-xs font-bold text-blue-700 uppercase tracking-wider block">
              Application SPA 100% Pur JavaScript &middot; Zéro Node.js &middot; Thème Clair
            </span>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Gestion &amp; Visualisation des Ouvrages Moyenne Tension (HTA)
            </h1>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Modernisation intégrale de l'application patrimoniale DBase III / FoxPro pour l'exploitation du réseau électrique Moyenne Tension (30 kV). Cette version fonctionne entièrement côté client sans aucun serveur Node.js et permet de configurer tous les paramètres clés des ouvrages (arcs, nœuds, transformateurs).
            </p>
          </div>

          <div class="flex sm:flex-col gap-2 shrink-0">
            <button
              onclick="window.app.setTab('topology')"
              class="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer text-center"
            >
              Schéma Unifilaire &amp; Graphe
            </button>
            <button
              onclick="window.app.setTab('settings')"
              class="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
            >
              Paramètres des Ouvrages
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-1">Départs Moyenne Tension</span>
          <div class="text-2xl font-bold text-slate-900 font-mono tabular-nums">51</div>
          <span class="text-[11px] text-slate-500 mt-1 block">Alimentés via Postes Sources</span>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-1">Linéaire Total MT</span>
          <div class="text-2xl font-bold text-slate-900 font-mono tabular-nums">${totalKm} <span class="text-xs font-normal text-slate-500">km</span></div>
          <span class="text-[11px] text-slate-500 mt-1 block">${formatNumber(totalArcs)} arcs de lignes aériennes/souterraines</span>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-1">Postes HTA / BT</span>
          <div class="text-2xl font-bold text-slate-900 font-mono tabular-nums">${totalPostes}</div>
          <span class="text-[11px] text-slate-500 mt-1 block">Transformateurs 30 kV / 400 V</span>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-1">Puissance Installée</span>
          <div class="text-2xl font-bold text-slate-900 font-mono tabular-nums">${formatNumber(totalPower)} <span class="text-xs font-normal text-slate-500">kVA</span></div>
          <span class="text-[11px] text-slate-500 mt-1 block">Puissance de transformation</span>
        </div>
      </div>

      <!-- Top Départs Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-900">Départs MT Principaux</h2>
              <p class="text-xs text-slate-500">Cliquez sur un départ pour ouvrir son schéma physique</p>
            </div>
            <button
              onclick="window.app.setTab('topology')"
              class="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Voir les 51 départs &rarr;
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-700 border-y border-slate-200">
                <tr>
                  <th class="py-2 px-3 font-semibold">Code Départ</th>
                  <th class="py-2 px-3 font-semibold text-right">Longueur (km)</th>
                  <th class="py-2 px-3 font-semibold text-right">Arcs</th>
                  <th class="py-2 px-3 font-semibold text-right">Postes HTA/BT</th>
                  <th class="py-2 px-3 font-semibold text-right">Puissance (kVA)</th>
                  <th class="py-2 px-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${topDeparts.map(d => `
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-2.5 px-3 font-mono font-bold text-slate-900">${d.id}</td>
                    <td class="py-2.5 px-3 text-right font-mono text-slate-700">${d.totalLengthKm}</td>
                    <td class="py-2.5 px-3 text-right font-mono text-slate-700">${d.arcCount}</td>
                    <td class="py-2.5 px-3 text-right font-mono font-semibold text-amber-700">${d.posteCount}</td>
                    <td class="py-2.5 px-3 text-right font-mono text-slate-700">${d.totalPowerKva > 0 ? formatNumber(d.totalPowerKva) : '—'}</td>
                    <td class="py-2.5 px-3 text-center">
                      <button
                        onclick="window.app.selectDepart('${d.id}')"
                        class="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                      >
                        Visualiser
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Postes Sources Card -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 class="text-base font-bold text-slate-900">Postes Sources HTB / HTA</h2>
          <p class="text-xs text-slate-500">Sous-stations d'injection du réseau MT</p>

          <div class="space-y-3">
            <div class="p-3.5 rounded-lg border border-purple-200 bg-purple-50/50 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-purple-900">125H3 &middot; NADOR</span>
                <span class="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">60 / 30 kV</span>
              </div>
              <p class="text-xs text-slate-600">2 transformateurs &times; 40 MVA &middot; Commune 2416 (Nador)</p>
            </div>

            <div class="p-3.5 rounded-lg border border-purple-200 bg-purple-50/50 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-purple-900">125H2 &middot; MEDJEZ SFA</span>
                <span class="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">90 / 30 kV</span>
              </div>
              <p class="text-xs text-slate-600">2 transformateurs &times; 10 MVA &middot; Commune 2430</p>
            </div>

            <div class="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-emerald-900">121O1 &middot; PC FENDJEL</span>
                <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Poste Coupure</span>
              </div>
              <p class="text-xs text-slate-600">Organe de sectionnement 30 kV (MS) &middot; Agence 121</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- VUE 2 : ARCHITECTURE PHYSIQUE (SCHÉMA UNIFILAIRE CLAIR) ---
function renderTopology() {
  const currentDepart = networkData.departs[state.selectedDepartId] || networkData.departs['125H3C20'];
  if (!currentDepart) return '<div class="p-8 text-center">Départ introuvable</div>';

  const nodes = currentDepart.nodes;
  const rawEdges = currentDepart.edges;

  let renderNodes = nodes;
  let renderEdges = rawEdges;
  if (!state.showJunctions && state.layoutMode === 'simplified') {
    const essentialSet = new Set(nodes.filter(n => n.type !== 'JONCTION').map(n => n.id));
    renderNodes = nodes.filter(n => essentialSet.has(n.id));
    renderEdges = rawEdges.filter(e => essentialSet.has(e.from) && essentialSet.has(e.to));
  }

  let rootNode = nodes.find(n => n.type === 'POSTE_SOURCE' || n.type === 'CELLULE');
  if (!rootNode) {
    const prefixMatch = currentDepart.id.match(/^(\d+[A-Z]\d+)/);
    if (prefixMatch) rootNode = nodes.find(n => n.id.startsWith(prefixMatch[1]));
  }
  if (!rootNode) rootNode = nodes[0];
  const rootId = rootNode ? rootNode.id : nodes[0]?.id;

  const adj = {};
  for (const e of rawEdges) {
    if (!adj[e.from]) adj[e.from] = [];
    if (!adj[e.to]) adj[e.to] = [];
    adj[e.from].push(e.to);
    adj[e.to].push(e.from);
  }

  const depthMap = {};
  const parentMap = {};
  const visited = new Set([rootId]);
  const queue = [{ id: rootId, d: 0 }];
  depthMap[rootId] = 0;
  parentMap[rootId] = null;

  while (queue.length > 0) {
    const { id, d } = queue.shift();
    for (const nbr of (adj[id] || [])) {
      if (!visited.has(nbr)) {
        visited.add(nbr);
        depthMap[nbr] = d + 1;
        parentMap[nbr] = id;
        queue.push({ id: nbr, d: d + 1 });
      }
    }
  }

  let unvisitedDepth = 1;
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      depthMap[n.id] = unvisitedDepth;
      unvisitedDepth++;
    }
  }

  const inPathSet = new Set();
  if (state.selectedNode) {
    let curr = state.selectedNode.id;
    while (curr) {
      inPathSet.add(curr);
      curr = parentMap[curr] || null;
    }
  }

  const depthGroups = {};
  for (const n of renderNodes) {
    const d = depthMap[n.id] ?? 0;
    if (!depthGroups[d]) depthGroups[d] = [];
    depthGroups[d].push(n);
  }

  const calculatedNodes = [];
  const maxDepth = Math.max(...Object.keys(depthGroups).map(Number), 0);

  if (state.layoutMode === 'radial') {
    const cx = 750;
    const cy = 450;
    for (let d = 0; d <= maxDepth; d++) {
      const group = depthGroups[d] || [];
      const r = d === 0 ? 0 : 80 + d * 65;
      const count = group.length;
      group.forEach((n, idx) => {
        const angle = count === 1 ? 0 : (idx / count) * 2 * Math.PI - Math.PI / 2;
        calculatedNodes.push({
          ...n,
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
          depth: d,
          inPath: inPathSet.has(n.id)
        });
      });
    }
  } else {
    const xSpacing = 160;
    const ySpacing = 65;
    for (let d = 0; d <= maxDepth; d++) {
      const group = depthGroups[d] || [];
      const totalH = group.length * ySpacing;
      const startY = 320 - totalH / 2;
      group.forEach((n, idx) => {
        calculatedNodes.push({
          ...n,
          x: 100 + d * xSpacing,
          y: startY + idx * ySpacing,
          depth: d,
          inPath: inPathSet.has(n.id)
        });
      });
    }
  }

  const nodePosMap = new Map();
  for (const n of calculatedNodes) nodePosMap.set(n.id, n);

  const searchSuggestions = state.searchQuery.trim()
    ? nodes.filter(n =>
        n.id.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (n.meta?.nom && n.meta.nom.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
        (n.meta?.localite && n.meta.localite.toLowerCase().includes(state.searchQuery.toLowerCase()))
      ).slice(0, 8)
    : [];

  return `
    <div class="flex flex-col h-[calc(100vh-62px)] bg-slate-50 text-slate-800 overflow-hidden">
      <!-- Toolbar Supérieure -->
      <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-2.5 bg-white border-b border-slate-200 z-20 shrink-0 shadow-2xs">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-slate-500 uppercase">Départ MT :</span>
          <select
            onchange="window.app.selectDepart(this.value)"
            class="bg-slate-50 text-slate-900 text-xs font-mono font-bold rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
          >
            ${departsSummary.map(d => `
              <option value="${d.id}" ${d.id === state.selectedDepartId ? 'selected' : ''}>
                ${d.id} &mdash; ${d.totalLengthKm} km &middot; ${d.posteCount} Postes &middot; ${d.arcCount} Arcs
              </option>
            `).join('')}
          </select>

          <div class="hidden xl:flex items-center gap-3 text-xs text-slate-500 border-l border-slate-200 pl-3">
            <span>Longueur : <strong class="text-slate-900 font-mono">${currentDepart.totalLengthKm} km</strong></span>
            <span>&middot;</span>
            <span>Postes HTA/BT : <strong class="text-amber-700 font-mono">${currentDepart.posteCount}</strong></span>
            <span>&middot;</span>
            <span>Puissance : <strong class="text-purple-700 font-mono">${formatNumber(currentDepart.totalPowerKva)} kVA</strong></span>
          </div>
        </div>

        <!-- Recherche rapide -->
        <div class="relative w-64">
          <input
            type="text"
            placeholder="Rechercher poste, piquage..."
            value="${escapeHtml(state.searchQuery)}"
            oninput="window.app.setSearchQuery(this.value)"
            class="w-full bg-slate-50 text-slate-900 text-xs rounded-lg pl-3 pr-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
          />

          ${searchSuggestions.length > 0 ? `
            <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
              ${searchSuggestions.map(n => `
                <button
                  onclick="window.app.selectNodeById('${n.id}')"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 transition-colors flex items-center justify-between border-b border-slate-100 last:border-0 cursor-pointer"
                >
                  <div class="truncate">
                    <span class="font-mono font-bold text-slate-900">${n.id}</span>
                    ${n.meta?.nom ? `<span class="text-slate-500 ml-1.5">(${escapeHtml(n.meta.nom)})</span>` : ''}
                  </div>
                  <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    ${n.type.replace('POSTE_', '')}
                  </span>
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Contrôles d'Affichage -->
        <div class="flex items-center gap-2">
          <div class="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onclick="window.app.setLayoutMode('hierarchical')"
              class="px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                state.layoutMode === 'hierarchical' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }"
            >
              Unifilaire
            </button>
            <button
              onclick="window.app.setLayoutMode('radial')"
              class="px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                state.layoutMode === 'radial' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }"
            >
              Radial
            </button>
            <button
              onclick="window.app.setLayoutMode('simplified')"
              class="px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                state.layoutMode === 'simplified' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }"
            >
              Postes Seuls
            </button>
          </div>

          <button
            onclick="window.app.toggleJunctions()"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              state.showJunctions ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-slate-200 text-slate-600'
            }"
            title="Afficher/Masquer jonctions de passage"
          >
            Jonctions ${state.showJunctions ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <!-- Zone Centrale (Canvas SVG Thème Clair) -->
      <div class="relative flex-1 flex overflow-hidden">
        <div
          id="svgContainer"
          class="relative flex-1 bg-white overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style="background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 24px 24px;"
          onmousedown="window.app.handleMouseDown(event)"
          onmousemove="window.app.handleMouseMove(event)"
          onmouseup="window.app.handleMouseUp(event)"
        >
          <svg
            id="networkSvg"
            class="w-full h-full"
            style="transform: translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom}); transform-origin: 0 0;"
          >
            <g class="edges">
              ${renderEdges.map(edge => {
                const u = nodePosMap.get(edge.from);
                const v = nodePosMap.get(edge.to);
                if (!u || !v) return '';

                const isEdgeSelected = state.selectedEdge?.id === edge.id;
                const isInPath = u.inPath && v.inPath;
                let strokeColor = isInPath ? '#d97706' : (edge.nat_cond === 'CU' ? '#c2410c' : '#334155');
                if (isEdgeSelected) strokeColor = '#2563eb';
                const strokeWidth = isInPath ? 3.5 : (isEdgeSelected ? 3 : (edge.section >= 117 ? 2.5 : 1.5));

                const midX = (u.x + v.x) / 2;
                const midY = (u.y + v.y) / 2;

                return `
                  <g class="cursor-pointer" onclick="window.app.selectEdge('${edge.id}')">
                    <line
                      x1="${u.x}" y1="${u.y}" x2="${v.x}" y2="${v.y}"
                      stroke="${strokeColor}"
                      stroke-width="${strokeWidth}"
                      stroke-dasharray="${edge.struct === 'SOUTERRAIN' ? '4 3' : 'none'}"
                      opacity="${isInPath || isEdgeSelected ? '1' : '0.85'}"
                    />
                    ${state.showLengths && state.zoom >= 0.8 && edge.longueur > 0 ? `
                      <text x="${midX}" y="${midY - 4}" fill="#64748b" font-size="9" font-family="monospace" text-anchor="middle">
                        ${edge.longueur}m
                      </text>
                    ` : ''}
                  </g>
                `;
              }).join('')}
            </g>

            <g class="nodes">
              ${calculatedNodes.map(node => {
                const isSelected = state.selectedNode?.id === node.id;
                const isRoot = node.id === rootId;
                let r = node.type === 'POSTE_SOURCE' ? 16 : (node.type === 'POSTE_HTA_BT' ? 12 : (node.type === 'ETOILEMENT' ? 9 : 5));

                let fillColor = '#64748b';
                let strokeColor = '#334155';
                if (node.type === 'POSTE_SOURCE') {
                  fillColor = '#7c3aed';
                  strokeColor = '#5b21b6';
                } else if (node.type === 'POSTE_HTA_BT') {
                  fillColor = '#ea580c';
                  strokeColor = '#9a3412';
                } else if (node.type === 'ETOILEMENT') {
                  fillColor = '#0d9488';
                  strokeColor = '#115e59';
                } else if (node.type === 'POSTE_COUPURE') {
                  fillColor = '#059669';
                  strokeColor = '#065f46';
                }

                if (node.inPath) {
                  strokeColor = '#d97706';
                  fillColor = node.type === 'POSTE_HTA_BT' ? '#d97706' : fillColor;
                }
                if (isSelected) {
                  strokeColor = '#2563eb';
                  fillColor = '#2563eb';
                }

                return `
                  <g transform="translate(${node.x}, ${node.y})" class="cursor-pointer" onclick="window.app.selectNode('${node.id}')">
                    ${(isSelected || isRoot) ? `
                      <circle r="${r + 5}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="3 3"/>
                    ` : ''}

                    ${node.type === 'POSTE_SOURCE' ? `
                      <circle r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
                      <circle r="${r - 5}" fill="none" stroke="#ffffff" stroke-width="1.5"/>
                      <text y="3" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">HT</text>
                    ` : node.type === 'POSTE_HTA_BT' ? `
                      <rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" rx="3" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
                      <text y="3.5" fill="#ffffff" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">T</text>
                    ` : node.type === 'ETOILEMENT' ? `
                      <polygon points="0,${-r} ${r},${r} ${-r},${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
                    ` : `
                      <circle r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>
                    `}

                    ${(node.type !== 'JONCTION' || state.zoom > 1.2 || isSelected) ? `
                      <text x="0" y="${r + 13}" fill="${isSelected ? '#1d4ed8' : '#0f172a'}" font-size="10" font-family="monospace" font-weight="${node.type === 'POSTE_HTA_BT' || isSelected ? 'bold' : 'normal'}" text-anchor="middle">
                        ${escapeHtml(node.meta?.nom ? `${node.meta.nom} (${node.id})` : node.id)}
                      </text>
                    ` : ''}

                    ${node.type === 'POSTE_HTA_BT' && node.meta?.p_instal ? `
                      <text x="0" y="${-r - 4}" fill="#b45309" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">
                        ${node.meta.p_instal} kVA
                      </text>
                    ` : ''}
                  </g>
                `;
              }).join('')}
            </g>
          </svg>

          <!-- Légende -->
          <div class="absolute top-4 left-4 p-3 bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1.5 z-10 pointer-events-auto">
            <span class="font-bold text-slate-800 text-xs block pb-1 border-b border-slate-200">Légende Réseau MT</span>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-purple-600 shrink-0"></span><span>Poste Source 60/30kV</span></div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-orange-600 shrink-0"></span><span>Poste HTA/BT (Transfo)</span></div>
              <div class="flex items-center gap-2"><span class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-teal-600 shrink-0"></span><span>Piquage Étoilement</span></div>
              <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-slate-500 shrink-0"></span><span>Jonction de passage</span></div>
              <div class="flex items-center gap-2"><span class="w-4 h-0.5 bg-amber-600 shrink-0"></span><span class="font-bold text-amber-700">Chemin vers source</span></div>
            </div>
          </div>

          <!-- Contrôles Zoom / Pan -->
          <div class="absolute bottom-5 left-5 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 shadow-lg z-10">
            <button onclick="window.app.zoomCanvas(0.2)" class="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded text-xs font-bold cursor-pointer" title="Zoom +">+</button>
            <button onclick="window.app.zoomCanvas(-0.2)" class="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded text-xs font-bold cursor-pointer" title="Zoom -">&minus;</button>
            <button onclick="window.app.fitView()" class="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded text-xs cursor-pointer">Centrer</button>
            <button onclick="window.app.resetView()" class="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded text-xs cursor-pointer">Reset</button>
            <span class="text-[11px] font-mono text-slate-500 px-2">${Math.round(state.zoom * 100)}%</span>
          </div>
        </div>

        <!-- Tiroir Inspecteur d'Ouvrage -->
        ${(state.selectedNode || state.selectedEdge) ? `
          <div class="w-80 md:w-96 bg-white border-l border-slate-200 p-5 overflow-y-auto space-y-4 shrink-0 shadow-lg z-20">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Fiche Technique Ouvrage</span>
              <button onclick="window.app.clearSelection()" class="text-xs text-slate-400 hover:text-slate-700 cursor-pointer">&times; Fermer</button>
            </div>

            ${state.selectedNode ? `
              <div class="space-y-4 text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 font-mono uppercase block">Identifiant Nœud</span>
                  <div class="text-lg font-mono font-bold text-slate-900">${state.selectedNode.id}</div>
                  ${state.selectedNode.meta?.nom ? `
                    <div class="text-sm font-bold text-amber-700 mt-0.5">${escapeHtml(state.selectedNode.meta.nom)}</div>
                  ` : ''}
                </div>

                <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <span class="font-bold text-slate-800 text-[11px] uppercase block">Paramètres Électriques</span>
                  <div class="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span class="text-slate-400 block text-[10px]">Tension Nominale</span>
                      <strong class="font-mono text-slate-900">30 kV (HTA)</strong>
                    </div>
                    ${state.selectedNode.type === 'POSTE_HTA_BT' ? `
                      <div>
                        <span class="text-slate-400 block text-[10px]">Puissance Transfo</span>
                        <strong class="font-mono text-amber-700">${state.selectedNode.meta?.p_instal || 160} kVA</strong>
                      </div>
                      <div>
                        <span class="text-slate-400 block text-[10px]">Type de Poste</span>
                        <span class="font-mono text-slate-900">${state.selectedNode.meta?.t_poste === 'MS' ? 'Cabine Maçonnée (MS)' : 'Poteau (AC)'}</span>
                      </div>
                      <div>
                        <span class="text-slate-400 block text-[10px]">Nb Transformateurs</span>
                        <span class="font-mono text-slate-900">${state.selectedNode.meta?.nb_trans || 1}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-slate-700">
                  <span class="font-bold text-slate-800 text-[11px] uppercase block">Localisation &amp; Rattachement</span>
                  <div>Localité : <strong>${escapeHtml(state.selectedNode.meta?.localite || 'Wilaya de Guelma')}</strong></div>
                  <div>Commune : <span class="font-mono text-slate-900">${state.selectedNode.meta?.commune || '—'}</span></div>
                  <div>Départ MT : <span class="font-mono font-bold text-blue-700">${state.selectedDepartId}</span></div>
                </div>

                ${state.selectedNode.inPath ? `
                  <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    <strong class="block text-xs font-bold mb-0.5">Chemin d'alimentation amont tracé</strong>
                    <p class="text-[11px] text-amber-800">
                      Cet ouvrage est raccordé au départ <strong>${state.selectedDepartId}</strong> à l'échelon topologique ${state.selectedNode.depth}.
                    </p>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${state.selectedEdge ? `
              <div class="space-y-4 text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 font-mono uppercase block">Arc de Ligne MT</span>
                  <div class="text-base font-mono font-bold text-slate-900">${state.selectedEdge.id}</div>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-slate-700">
                  <span class="font-bold text-slate-800 text-[11px] uppercase block">Caractéristiques Ligne</span>
                  <div>De : <code class="font-mono font-bold text-slate-900">${state.selectedEdge.from}</code></div>
                  <div>Vers : <code class="font-mono font-bold text-slate-900">${state.selectedEdge.to}</code></div>
                  <div>Longueur : <strong class="font-mono text-emerald-700">${state.selectedEdge.longueur} mètres</strong></div>
                  <div>Conducteur : <strong class="font-mono text-slate-900">${state.selectedEdge.nat_cond === 'AM' ? 'Almélec (AM)' : state.selectedEdge.nat_cond}</strong></div>
                  <div>Section : <strong class="font-mono text-slate-900">${state.selectedEdge.section} mm²</strong></div>
                  <div>Pose : <span class="font-mono text-slate-900">${state.selectedEdge.struct}</span></div>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <span class="font-bold text-slate-800 text-[11px] uppercase block">Supports (Poteaux)</span>
                  <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="p-2 bg-white rounded border border-slate-200"><span class="text-slate-400 text-[10px] block">Béton</span><strong class="font-mono">${state.selectedEdge.supports.beton}</strong></div>
                    <div class="p-2 bg-white rounded border border-slate-200"><span class="text-slate-400 text-[10px] block">Bois</span><strong class="font-mono">${state.selectedEdge.supports.bois}</strong></div>
                    <div class="p-2 bg-white rounded border border-slate-200"><span class="text-slate-400 text-[10px] block">Métal</span><strong class="font-mono">${state.selectedEdge.supports.metal}</strong></div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// --- VUE 3 : GPARC-MOBILE (SIMULATEUR TERRAIN CLAIR) ---
function renderGparcMobile() {
  const currentDepart = networkData.departs[state.mobileDepartId] || networkData.departs['125H3C20'];
  const allPostes = currentDepart.nodes.filter(n => n.type === 'POSTE_HTA_BT');

  const filteredPostes = state.mobileSearchQuery.trim()
    ? allPostes.filter(p =>
        p.id.toLowerCase().includes(state.mobileSearchQuery.toLowerCase()) ||
        (p.meta?.nom && p.meta.nom.toLowerCase().includes(state.mobileSearchQuery.toLowerCase())) ||
        (p.meta?.localite && p.meta.localite.toLowerCase().includes(state.mobileSearchQuery.toLowerCase()))
      ).slice(0, 15)
    : allPostes.slice(0, 15);

  const activePoste = allPostes.find(p => p.id === state.mobileSelectedPosteId) || allPostes[0];

  return `
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold text-blue-700 uppercase tracking-wider block">
            Architecture Type GPARC-Mobile &middot; 0% Node.js
          </span>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Simulateur Mobile de Terrain (Mode Déconnecté SQLite)
          </h1>
          <p class="text-xs text-slate-600 mt-1">
            Les techniciens d'intervention exploitent les 504 postes et 7 678 arcs sans connexion Internet grâce à la base locale SQLite (1,8 Mo).
          </p>
        </div>

        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shrink-0">
          <span>Mode Hors-Ligne &middot; Base Locale 1,8 Mo</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-7 flex justify-center">
          <div class="w-full max-w-md bg-slate-100 rounded-[36px] p-3 shadow-xl border-4 border-slate-300">
            <div class="w-28 h-3.5 bg-slate-300 rounded-full mx-auto mb-2"></div>

            <div class="bg-white rounded-[24px] overflow-hidden flex flex-col h-[620px] border border-slate-200 text-xs">
              <div class="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-mono text-[11px] text-slate-600 shrink-0">
                <span class="font-bold text-slate-900">GPARC-MT Mobile</span>
                <span class="text-emerald-700 font-bold">&bull; GPS Actif</span>
              </div>

              <div class="p-3 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-slate-500 font-bold uppercase">Départ :</span>
                  <select
                    onchange="window.app.setMobileDepart(this.value)"
                    class="bg-white text-slate-900 text-xs font-mono rounded px-2 py-1 border border-slate-300 font-semibold"
                  >
                    ${departsSummary.slice(0, 15).map(d => `
                      <option value="${d.id}" ${d.id === state.mobileDepartId ? 'selected' : ''}>
                        ${d.id} (${d.posteCount} Postes)
                      </option>
                    `).join('')}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Chercher poste (code ou nom)..."
                  value="${escapeHtml(state.mobileSearchQuery)}"
                  oninput="window.app.setMobileSearch(this.value)"
                  class="w-full bg-white text-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-300"
                />
              </div>

              <div class="flex-1 overflow-y-auto p-3 space-y-3">
                ${activePoste ? `
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div class="flex items-start justify-between">
                      <div>
                        <span class="font-mono text-xs font-bold text-blue-700 block">${activePoste.id}</span>
                        <span class="text-sm font-bold text-slate-900">${activePoste.meta?.nom || 'Poste HTA / BT'}</span>
                        <div class="text-[11px] text-slate-500 mt-0.5">${activePoste.meta?.localite || 'Wilaya de Guelma (24)'}</div>
                      </div>
                      <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        ${activePoste.meta?.p_instal || 160} kVA
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-[11px] p-2 bg-white rounded-lg border border-slate-200 font-mono">
                      <div><span class="text-slate-400 block text-[9px]">Tension</span><span class="text-slate-800">30 kV</span></div>
                      <div><span class="text-slate-400 block text-[9px]">Type</span><span class="text-slate-800">${activePoste.meta?.t_poste === 'MS' ? 'Cabine MS' : 'Poteau AC'}</span></div>
                      <div><span class="text-slate-400 block text-[9px]">Mise en service</span><span class="text-slate-800">${activePoste.meta?.an_mes || '01/01/1985'}</span></div>
                      <div><span class="text-slate-400 block text-[9px]">Commune</span><span class="text-slate-800">${activePoste.meta?.commune || '2401'}</span></div>
                    </div>

                    <form onsubmit="window.app.saveMobileIntervention(event)" class="space-y-2 pt-1 border-t border-slate-200">
                      <span class="text-[10px] font-bold text-slate-600 uppercase block">Relevé de Terrain :</span>
                      <select id="mobileAnomalieSelect" class="w-full bg-white text-slate-900 text-xs rounded px-2.5 py-1.5 border border-slate-300">
                        <option value="RAS">RAS &mdash; Poste en bon état</option>
                        <option value="Huile">Fuite d'huile transformateur</option>
                        <option value="Fusible">Fusible MT à remplacer</option>
                        <option value="Elagage">Élagage nécessaire</option>
                      </select>

                      <input
                        id="mobileNoteInput"
                        type="text"
                        placeholder="Observation technicien..."
                        class="w-full bg-white text-slate-900 text-xs rounded px-2.5 py-1.5 border border-slate-300"
                      />

                      <button
                        type="submit"
                        class="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-colors cursor-pointer"
                      >
                        Enregistrer dans SQLite Local
                      </button>
                    </form>
                  </div>
                ` : ''}

                <div class="space-y-1">
                  <span class="text-[10px] text-slate-500 font-bold uppercase block px-1">Postes du départ (${filteredPostes.length})</span>
                  ${filteredPostes.map(p => `
                    <button
                      onclick="window.app.selectMobilePoste('${p.id}')"
                      class="w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between border cursor-pointer ${
                        state.mobileSelectedPosteId === p.id
                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }"
                    >
                      <div class="truncate pr-2">
                        <span class="font-mono text-xs block">${p.id}</span>
                        <span class="text-slate-500 text-[10px] truncate block">${p.meta?.nom || p.meta?.localite || 'Poste HTA/BT'}</span>
                      </div>
                      <span class="font-mono text-[10px] text-amber-700 font-semibold shrink-0">${p.meta?.p_instal || 160} kVA</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 space-y-4 text-xs">
          <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h2 class="text-base font-bold text-slate-900">Principes du Modèle GPARC-Mobile</h2>
            <div class="space-y-2.5 text-slate-600 leading-relaxed">
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <strong class="text-slate-900 block font-semibold">1. Pur JavaScript / Dart Mobile</strong>
                <p>Aucun serveur Node.js en production. Le code tourne soit sur le navigateur web, soit sur l'application mobile Flutter / Android.</p>
              </div>

              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <strong class="text-slate-900 block font-semibold">2. Poids Minimal (1,8 Mo)</strong>
                <p>Les 7 678 arcs et 504 postes tiennent dans moins de 2 Mo sous SQLite, permettant une installation immédiate sur n'importe quel smartphone.</p>
              </div>

              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <strong class="text-slate-900 block font-semibold">3. Synchronisation Différée</strong>
                <p>Les interventions saisies en zone blanche sont synchronisées dès le retour en agence.</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Relevés Locaux SQLite (${state.mobileInterventions.length})
            </h3>
            <div class="space-y-2">
              ${state.mobileInterventions.map(it => `
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-slate-900">${it.posteId} &middot; ${it.type}</span>
                    <span class="text-[10px] text-slate-500 font-mono">${it.date}</span>
                  </div>
                  <p class="text-slate-600 text-[11px]">${escapeHtml(it.note)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- VUE 4 : ANALYSE STRUCTURALE DBASE ---
function renderStructural() {
  return `
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div class="space-y-1">
        <span class="text-xs font-bold text-blue-700 uppercase tracking-wider block">Rétro-Ingénierie &middot; Modèle dBase</span>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Structure des Données DBase (GDO MT)</h1>
        <p class="text-xs sm:text-sm text-slate-600 max-w-4xl leading-relaxed">
          Décryptage du modèle relationnel dBase III / FoxPro et règles de codification hiérarchiques.
        </p>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 class="text-base font-bold text-slate-900">Règle de Codification Alphanumérique</h2>
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div class="text-xs font-semibold text-slate-800">
            Exemple : Code Départ <code class="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">125H3C20</code>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3 bg-white rounded-lg border border-slate-200"><strong class="font-mono text-blue-700 text-sm block">125</strong>Agence (Bouchegouf)</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200"><strong class="font-mono text-purple-700 text-sm block">H</strong>Poste Source HTB/HTA</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200"><strong class="font-mono text-purple-700 text-sm block">3</strong>N°3 (Nador 60/30kV)</div>
            <div class="p-3 bg-white rounded-lg border border-slate-200"><strong class="font-mono text-emerald-700 text-sm block">C20</strong>Cellule Départ n°20</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 class="text-base font-bold text-slate-900">Les 12 Tables Relationnelles Extraites</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          ${tableSchemas.map(t => `
            <div class="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
              <span class="font-mono font-bold text-xs text-slate-900 block truncate">${t.fileName}</span>
              <span class="text-slate-500 text-[11px] block mt-1">${t.rowCount} lignes &middot; ${t.fields.length} colonnes</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// --- VUE 5 : NOUVELLE PAGE DE PARAMÈTRES RÉSEAU (GESTION ARCS, NŒUDS, TRANSFOS) ---
function renderSettings() {
  const { transfos, conducteurs, noeuds, seuils } = state.settings;

  const subTabs = [
    { id: 'transfos', label: 'Transformateurs HTA/BT' },
    { id: 'conducteurs', label: 'Conducteurs & Arcs MT' },
    { id: 'noeuds', label: 'Nœuds & Organes MT' },
    { id: 'seuils', label: 'Seuils & Normes Réseau' }
  ];

  return `
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <!-- En-tête -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold text-blue-700 uppercase tracking-wider block">
            Référentiel Métier &middot; Paramètres des Ouvrages MT
          </span>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Gestion des Points Clés du Réseau
          </h1>
          <p class="text-xs text-slate-600 mt-1">
            Configurez les caractéristiques physiques des transformateurs, sections d'arcs, types de nœuds et seuils d'exploitation normalisés.
          </p>
        </div>

        <div class="flex items-center gap-2">
          ${state.settingsSavedNotice ? `
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs">
              Paramètres enregistrés en local !
            </span>
          ` : ''}
          <button
            onclick="window.app.resetDefaultSettings()"
            class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Réinitialiser Normes
          </button>
        </div>
      </div>

      <!-- Sous-onglets de configuration -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
        ${subTabs.map(st => `
          <button
            onclick="window.app.setSettingsSubTab('${st.id}')"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              state.settingsSubTab === st.id
                ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }"
          >
            ${st.label}
          </button>
        `).join('')}
      </div>

      <!-- Sous-Vue A : Transformateurs HTA / BT -->
      ${state.settingsSubTab === 'transfos' ? `
        <div class="space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 class="text-base font-bold text-slate-900">Catalogue des Transformateurs HTA / BT (30 kV / 400 V)</h2>
                <p class="text-xs text-slate-500">Calibres normalisés utilisés dans les 504 postes du réseau</p>
              </div>
              <button
                onclick="window.app.toggleNewTransfoModal(true)"
                class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                + Ajouter un Calibre
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-700 border-y border-slate-200">
                  <tr>
                    <th class="py-2.5 px-3 font-semibold">Puissance (kVA)</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Tension Court-Circuit (Ucc %)</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Pertes à Vide P0 (W)</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Pertes en Charge Pk (W)</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Courant Nominal MT (A)</th>
                    <th class="py-2.5 px-3 font-semibold">Type de Pose</th>
                    <th class="py-2.5 px-3 font-semibold">Usage Typique</th>
                    <th class="py-2.5 px-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${transfos.map((t, idx) => `
                    <tr class="hover:bg-slate-50/70">
                      <td class="py-2.5 px-3 font-mono font-bold text-amber-800">
                        <span class="inline-block px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                          ${t.kva} kVA
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-right font-mono text-slate-800">${t.ucc} %</td>
                      <td class="py-2.5 px-3 text-right font-mono text-slate-800">${t.p0} W</td>
                      <td class="py-2.5 px-3 text-right font-mono text-slate-800">${t.pk} W</td>
                      <td class="py-2.5 px-3 text-right font-mono font-bold text-blue-700">${t.in30} A</td>
                      <td class="py-2.5 px-3 font-mono text-slate-600">${t.type}</td>
                      <td class="py-2.5 px-3 text-slate-600">${escapeHtml(t.desc)}</td>
                      <td class="py-2.5 px-3 text-center">
                        <button
                          onclick="window.app.deleteTransfo(${idx})"
                          class="text-red-600 hover:text-red-800 text-[11px] font-semibold cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Sous-Vue B : Conducteurs & Arcs MT -->
      ${state.settingsSubTab === 'conducteurs' ? `
        <div class="space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 class="text-base font-bold text-slate-900">Catalogue des Conducteurs &amp; Lignes (Arcs MT)</h2>
                <p class="text-xs text-slate-500">Paramètres linéiques pour le calcul des chutes de tension (&Delta;U) et pertes Joules</p>
              </div>
              <button
                onclick="window.app.toggleNewConducteurModal(true)"
                class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                + Ajouter une Section
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-700 border-y border-slate-200">
                  <tr>
                    <th class="py-2.5 px-3 font-semibold">Désignation</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Section (mm²)</th>
                    <th class="py-2.5 px-3 font-semibold">Nature</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Résistance R' (&Omega;/km)</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Réactance X' (&Omega;/km)</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Intensité Admissible (A)</th>
                    <th class="py-2.5 px-3 font-semibold">Type de Pose</th>
                    <th class="py-2.5 px-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${conducteurs.map((c, idx) => `
                    <tr class="hover:bg-slate-50/70">
                      <td class="py-2.5 px-3 font-mono font-bold text-slate-900">${c.nom}</td>
                      <td class="py-2.5 px-3 text-right font-mono font-bold text-blue-700">${c.section}</td>
                      <td class="py-2.5 px-3 font-mono text-slate-700">${c.nat}</td>
                      <td class="py-2.5 px-3 text-right font-mono text-slate-800">${c.r}</td>
                      <td class="py-2.5 px-3 text-right font-mono text-slate-800">${c.x}</td>
                      <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">${c.iMax} A</td>
                      <td class="py-2.5 px-3 font-mono text-slate-600">${c.pose}</td>
                      <td class="py-2.5 px-3 text-center">
                        <button
                          onclick="window.app.deleteConducteur(${idx})"
                          class="text-red-600 hover:text-red-800 text-[11px] font-semibold cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Sous-Vue C : Nœuds & Organes MT -->
      ${state.settingsSubTab === 'noeuds' ? `
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 class="text-base font-bold text-slate-900">Référentiel des Nœuds &amp; Organes de Coupure</h2>
            <p class="text-xs text-slate-500">Correspondance des préfixes de codification dBase et appareillages associés</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            ${noeuds.map(n => `
              <div class="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm text-white shrink-0" style="background-color: ${n.couleur}">
                  ${n.prefix}
                </span>
                <div class="space-y-0.5 flex-1">
                  <div class="flex items-center justify-between">
                    <strong class="text-slate-900 text-xs">${n.label}</strong>
                    <span class="font-mono text-[10px] text-slate-500">${n.tension}</span>
                  </div>
                  <p class="text-slate-600 text-[11px]">Appareillage : <span class="font-medium text-slate-800">${n.organe}</span></p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Sous-Vue D : Seuils & Normes Réseau -->
      ${state.settingsSubTab === 'seuils' ? `
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 class="text-base font-bold text-slate-900">Seuils Électriques &amp; Normes d'Exploitation HTA</h2>
            <p class="text-xs text-slate-500">Limites de chute de tension, cosinus phi et plages de tension admissibles</p>
          </div>

          <form onsubmit="window.app.saveSeuils(event)" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label class="block text-slate-700 font-semibold text-[11px]">Tension Nominale MT (kV)</label>
              <input
                id="inputTensionNominale"
                type="number"
                step="0.5"
                value="${seuils.tensionNominale}"
                class="w-full bg-white text-slate-900 rounded p-1.5 border border-slate-300 font-mono"
              />
            </div>

            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label class="block text-slate-700 font-semibold text-[11px]">Tension Minimale Admissible (kV)</label>
              <input
                id="inputTensionMin"
                type="number"
                step="0.5"
                value="${seuils.tensionMin}"
                class="w-full bg-white text-slate-900 rounded p-1.5 border border-slate-300 font-mono"
              />
            </div>

            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label class="block text-slate-700 font-semibold text-[11px]">Tension Maximale Admissible (kV)</label>
              <input
                id="inputTensionMax"
                type="number"
                step="0.5"
                value="${seuils.tensionMax}"
                class="w-full bg-white text-slate-900 rounded p-1.5 border border-slate-300 font-mono"
              />
            </div>

            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label class="block text-slate-700 font-semibold text-[11px]">Chute de Tension Max Urbaine (%)</label>
              <input
                id="inputChuteTensionMax"
                type="number"
                step="0.1"
                value="${seuils.chuteTensionMax}"
                class="w-full bg-white text-slate-900 rounded p-1.5 border border-slate-300 font-mono"
              />
            </div>

            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label class="block text-slate-700 font-semibold text-[11px]">Chute de Tension Max Rurale (%)</label>
              <input
                id="inputChuteTensionMaxRurale"
                type="number"
                step="0.1"
                value="${seuils.chuteTensionMaxRurale}"
                class="w-full bg-white text-slate-900 rounded p-1.5 border border-slate-300 font-mono"
              />
            </div>

            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label class="block text-slate-700 font-semibold text-[11px]">Facteur de Puissance Moyen (cos &phi;)</label>
              <input
                id="inputCosPhi"
                type="number"
                step="0.01"
                value="${seuils.cosPhi}"
                class="w-full bg-white text-slate-900 rounded p-1.5 border border-slate-300 font-mono"
              />
            </div>

            <div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Enregistrer les Paramètres d'Exploitation
              </button>
            </div>
          </form>
        </div>
      ` : ''}

      <!-- Modal Ajout Transfo -->
      ${state.showNewTransfoModal ? `
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 class="text-sm font-bold text-slate-900">Ajouter un Calibre Transformateur</h3>
              <button onclick="window.app.toggleNewTransfoModal(false)" class="text-slate-400 hover:text-slate-700 cursor-pointer">&times;</button>
            </div>

            <form onsubmit="window.app.addNewTransfo(event)" class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-700 font-semibold">Puissance (kVA)</label>
                <input id="newTransfoKva" type="number" required placeholder="ex: 800" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300 font-mono" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-slate-700 font-semibold">Pertes P0 (W)</label>
                  <input id="newTransfoP0" type="number" value="1300" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-700 font-semibold">Pertes Pk (W)</label>
                  <input id="newTransfoPk" type="number" value="8000" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300 font-mono" />
                </div>
              </div>
              <div>
                <label class="block text-slate-700 font-semibold">Type de Pose</label>
                <select id="newTransfoType" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300">
                  <option value="MS">Cabine Maçonnée (MS)</option>
                  <option value="AC">Haut de Poteau (AC)</option>
                  <option value="COMPACT">Poste Urbain Compact</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-700 font-semibold">Description / Usage</label>
                <input id="newTransfoDesc" type="text" placeholder="ex: Industrie moyenne" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300" />
              </div>

              <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onclick="window.app.toggleNewTransfoModal(false)" class="px-3 py-1.5 rounded border border-slate-300 text-slate-600">Annuler</button>
                <button type="submit" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-xs">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- Modal Ajout Conducteur -->
      ${state.showNewConducteurModal ? `
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 class="text-sm font-bold text-slate-900">Ajouter une Section de Conducteur</h3>
              <button onclick="window.app.toggleNewConducteurModal(false)" class="text-slate-400 hover:text-slate-700 cursor-pointer">&times;</button>
            </div>

            <form onsubmit="window.app.addNewConducteur(event)" class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-700 font-semibold">Nom Conducteur</label>
                <input id="newCondNom" type="text" required placeholder="ex: Almélec 93 mm²" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-slate-700 font-semibold">Section (mm²)</label>
                  <input id="newCondSection" type="number" required placeholder="93" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-700 font-semibold">Nature Métal</label>
                  <select id="newCondNat" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300">
                    <option value="AM">Almélec (AM)</option>
                    <option value="CU">Cuivre (CU)</option>
                    <option value="AL">Aluminium (AL)</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-slate-700 font-semibold">R' (&Omega;/km)</label>
                  <input id="newCondR" type="number" step="0.01" value="0.35" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-700 font-semibold">X' (&Omega;/km)</label>
                  <input id="newCondX" type="number" step="0.01" value="0.35" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-700 font-semibold">I max (A)</label>
                  <input id="newCondImax" type="number" value="280" class="w-full bg-slate-50 rounded p-1.5 border border-slate-300 font-mono" />
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onclick="window.app.toggleNewConducteurModal(false)" class="px-3 py-1.5 rounded border border-slate-300 text-slate-600">Annuler</button>
                <button type="submit" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-xs">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// --- VUE 6 : EXPLORATEUR DE DONNÉES ---
function renderExplorer() {
  const currentTable = fullTablesData[state.explorerTable] || fullTablesData['Poste_htabt_lig'];
  const rawRows = state.explorerSheet === 'corrigé' && currentTable.rowsCorrige?.length > 0
    ? currentTable.rowsCorrige
    : currentTable.rows || [];

  const filteredRows = state.explorerSearch.trim()
    ? rawRows.filter(r => Object.values(r).some(val => String(val ?? '').toLowerCase().includes(state.explorerSearch.toLowerCase())))
    : rawRows;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / state.explorerPageSize));
  const start = (state.explorerPage - 1) * state.explorerPageSize;
  const paginatedRows = filteredRows.slice(start, start + state.explorerPageSize);
  const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  return `
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">12 Tables Extraites &middot; Thème Clair</span>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Explorateur des Données</h1>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="window.app.exportExplorerCsv()" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer">
            Exporter CSV
          </button>
          <button onclick="window.app.exportExplorerJson()" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer">
            Exporter JSON
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1">
          <span class="text-xs font-bold text-slate-900 uppercase block mb-2 px-1">Sélectionner une Table</span>
          ${Object.keys(fullTablesData).map(tName => `
            <button
              onclick="window.app.setExplorerTable('${tName}')"
              class="w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                state.explorerTable === tName
                  ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                  : 'text-slate-700 hover:bg-slate-50 border border-transparent'
              }"
            >
              <span class="truncate">${fullTablesData[tName].fileName}</span>
              <span class="text-[11px] font-sans text-slate-500 tabular-nums">${fullTablesData[tName].totalRows}</span>
            </button>
          `).join('')}
        </div>

        <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <span class="font-mono text-sm font-bold text-slate-900">${currentTable.fileName}</span>
              ${currentTable.sheets?.length > 1 ? `
                <div class="flex items-center p-0.5 bg-slate-200 rounded-lg text-xs">
                  <button onclick="window.app.setExplorerSheet('anomalie')" class="px-2 py-0.5 rounded cursor-pointer ${state.explorerSheet === 'anomalie' ? 'bg-white font-bold shadow-xs' : 'text-slate-600'}">anomalie (${currentTable.totalRows})</button>
                  <button onclick="window.app.setExplorerSheet('corrigé')" class="px-2 py-0.5 rounded cursor-pointer ${state.explorerSheet === 'corrigé' ? 'bg-white font-bold shadow-xs' : 'text-slate-600'}">corrigé (${currentTable.totalRowsCorrige})</button>
                </div>
              ` : ''}
            </div>

            <input
              type="text"
              placeholder="Filtrer..."
              value="${escapeHtml(state.explorerSearch)}"
              oninput="window.app.setExplorerSearch(this.value)"
              class="bg-white text-slate-900 text-xs rounded-lg px-3 py-1.5 border border-slate-300 w-52"
            />
          </div>

          <div class="flex-1 overflow-x-auto min-h-[400px]">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0">
                <tr>
                  <th class="py-2.5 px-3 font-semibold text-slate-500 w-10 text-center">#</th>
                  ${columns.map(c => `<th class="py-2.5 px-3 font-semibold font-mono whitespace-nowrap">${c}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${paginatedRows.map((row, idx) => `
                  <tr class="hover:bg-blue-50/40 transition-colors">
                    <td class="py-2 px-3 text-center font-mono text-[11px] text-slate-400">${start + idx + 1}</td>
                    ${columns.map(c => `
                      <td class="py-2 px-3 whitespace-nowrap max-w-xs truncate ${c === 'code' || c === 'n_depart' ? 'font-mono font-bold text-slate-900' : (c === 'anomalie' && row[c] ? 'text-amber-800 bg-amber-50 font-mono text-[11px]' : 'text-slate-700')}">
                        ${row[c] !== undefined && row[c] !== null ? escapeHtml(String(row[c])) : '—'}
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <span>Affichage de <strong>${paginatedRows.length}</strong> sur <strong>${filteredRows.length}</strong> lignes</span>
            <div class="flex items-center gap-2">
              <button onclick="window.app.setExplorerPage(${state.explorerPage - 1})" ${state.explorerPage <= 1 ? 'disabled' : ''} class="px-2 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 cursor-pointer">&larr;</button>
              <span class="font-mono">Page ${state.explorerPage} / ${totalPages}</span>
              <button onclick="window.app.setExplorerPage(${state.explorerPage + 1})" ${state.explorerPage >= totalPages ? 'disabled' : ''} class="px-2 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 cursor-pointer">&rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- MODAL DE RAPPORT EXPORTABLE ---
function renderReportModal() {
  if (!state.showReportModal) return '';

  return `
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <h3 class="text-base font-bold text-slate-900">Rapport de Synthèse d'Architecture Réseau (Thème Clair)</h3>
          <button onclick="window.app.toggleReportModal(false)" class="text-slate-400 hover:text-slate-700 cursor-pointer">&times;</button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
          ${escapeHtml(REPORT_TEXT)}
        </div>

        <div class="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onclick="window.app.copyReport()"
            class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            ${state.reportCopied ? 'Copié dans le presse-papier !' : 'Copier le texte'}
          </button>
          <button
            onclick="window.app.downloadReport()"
            class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            Télécharger (.md)
          </button>
        </div>
      </div>
    </div>
  `;
}

// --- RENDU GÉNÉRAL DU SITE ---
export function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  let viewHtml = '';
  if (state.activeTab === 'dashboard') viewHtml = renderDashboard();
  else if (state.activeTab === 'topology') viewHtml = renderTopology();
  else if (state.activeTab === 'mobile') viewHtml = renderGparcMobile();
  else if (state.activeTab === 'structural') viewHtml = renderStructural();
  else if (state.activeTab === 'settings') viewHtml = renderSettings();
  else if (state.activeTab === 'explorer') viewHtml = renderExplorer();

  root.innerHTML = `
    <div class="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      ${renderHeader()}
      <main class="flex-1">
        ${viewHtml}
      </main>
      ${renderReportModal()}
    </div>
  `;
}

// --- MÉTHODES GLOBALES ACCESSIBLES DEPUIS LE HTML (WINDOW.APP) ---
window.app = {
  setTab: (tab) => setTab(tab),
  selectDepart: (depId) => {
    state.selectedDepartId = depId;
    state.selectedNode = null;
    state.selectedEdge = null;
    state.activeTab = 'topology';
    renderApp();
  },
  setLayoutMode: (mode) => {
    state.layoutMode = mode;
    renderApp();
  },
  toggleJunctions: () => {
    state.showJunctions = !state.showJunctions;
    renderApp();
  },
  zoomCanvas: (delta) => {
    state.zoom = Math.min(Math.max(0.2, state.zoom + delta), 3.5);
    renderApp();
  },
  fitView: () => {
    state.zoom = 1;
    state.pan = { x: 80, y: 150 };
    renderApp();
  },
  resetView: () => {
    state.zoom = 1;
    state.pan = { x: 60, y: 120 };
    state.selectedNode = null;
    state.selectedEdge = null;
    renderApp();
  },
  setSearchQuery: (query) => {
    state.searchQuery = query;
    renderApp();
  },
  selectNode: (nodeId) => {
    const dep = networkData.departs[state.selectedDepartId];
    const n = dep?.nodes.find(item => item.id === nodeId);
    if (n) {
      state.selectedNode = n;
      state.selectedEdge = null;
      renderApp();
    }
  },
  selectNodeById: (nodeId) => {
    const dep = networkData.departs[state.selectedDepartId];
    const n = dep?.nodes.find(item => item.id === nodeId);
    if (n) {
      state.selectedNode = n;
      state.selectedEdge = null;
      state.searchQuery = '';
      renderApp();
    }
  },
  selectEdge: (edgeId) => {
    const dep = networkData.departs[state.selectedDepartId];
    const e = dep?.edges.find(item => item.id === edgeId);
    if (e) {
      state.selectedEdge = e;
      state.selectedNode = null;
      renderApp();
    }
  },
  clearSelection: () => {
    state.selectedNode = null;
    state.selectedEdge = null;
    renderApp();
  },
  handleMouseDown: (e) => {
    if (e.button !== 0) return;
    state.isDragging = true;
    state.dragStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
  },
  handleMouseMove: (e) => {
    if (!state.isDragging) return;
    state.pan.x = e.clientX - state.dragStart.x;
    state.pan.y = e.clientY - state.dragStart.y;
    const svg = document.getElementById('networkSvg');
    if (svg) {
      svg.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
    }
  },
  handleMouseUp: () => {
    state.isDragging = false;
  },

  // Paramètres Réseau
  setSettingsSubTab: (subTab) => {
    state.settingsSubTab = subTab;
    renderApp();
  },
  toggleNewTransfoModal: (show) => {
    state.showNewTransfoModal = show;
    renderApp();
  },
  toggleNewConducteurModal: (show) => {
    state.showNewConducteurModal = show;
    renderApp();
  },
  addNewTransfo: (e) => {
    e.preventDefault();
    const kva = Number(document.getElementById('newTransfoKva').value);
    const p0 = Number(document.getElementById('newTransfoP0').value) || 1000;
    const pk = Number(document.getElementById('newTransfoPk').value) || 6000;
    const type = document.getElementById('newTransfoType').value;
    const desc = document.getElementById('newTransfoDesc').value || 'Nouveau transformateur';
    const in30 = Number((kva / (30 * Math.sqrt(3))).toFixed(2));

    state.settings.transfos.push({ kva, ucc: 4.0, p0, pk, in30, type, desc });
    state.settings.transfos.sort((a, b) => a.kva - b.kva);
    state.showNewTransfoModal = false;
    state.settingsSavedNotice = true;
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
    setTimeout(() => { state.settingsSavedNotice = false; renderApp(); }, 3000);
  },
  deleteTransfo: (index) => {
    state.settings.transfos.splice(index, 1);
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
  },
  addNewConducteur: (e) => {
    e.preventDefault();
    const nom = document.getElementById('newCondNom').value;
    const section = Number(document.getElementById('newCondSection').value);
    const nat = document.getElementById('newCondNat').value;
    const r = Number(document.getElementById('newCondR').value);
    const x = Number(document.getElementById('newCondX').value);
    const iMax = Number(document.getElementById('newCondImax').value);
    const code = `${nat}_${section}`;
    const pose = nat === 'AL' && section >= 150 ? 'SOUTERRAIN' : 'AÉRIEN NU';

    state.settings.conducteurs.push({ code, nom, section, nat, r, x, iMax, pose });
    state.settings.conducteurs.sort((a, b) => a.section - b.section);
    state.showNewConducteurModal = false;
    state.settingsSavedNotice = true;
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
    setTimeout(() => { state.settingsSavedNotice = false; renderApp(); }, 3000);
  },
  deleteConducteur: (index) => {
    state.settings.conducteurs.splice(index, 1);
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
  },
  saveSeuils: (e) => {
    e.preventDefault();
    state.settings.seuils.tensionNominale = Number(document.getElementById('inputTensionNominale').value) || 30.0;
    state.settings.seuils.tensionMin = Number(document.getElementById('inputTensionMin').value) || 27.0;
    state.settings.seuils.tensionMax = Number(document.getElementById('inputTensionMax').value) || 33.0;
    state.settings.seuils.chuteTensionMax = Number(document.getElementById('inputChuteTensionMax').value) || 5.0;
    state.settings.seuils.chuteTensionMaxRurale = Number(document.getElementById('inputChuteTensionMaxRurale').value) || 7.0;
    state.settings.seuils.cosPhi = Number(document.getElementById('inputCosPhi').value) || 0.90;

    state.settingsSavedNotice = true;
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
    setTimeout(() => { state.settingsSavedNotice = false; renderApp(); }, 3000);
  },
  resetDefaultSettings: () => {
    state.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    try { localStorage.removeItem('gdo_mt_settings'); } catch (err) {}
    state.settingsSavedNotice = true;
    renderApp();
    setTimeout(() => { state.settingsSavedNotice = false; renderApp(); }, 3000);
  },

  // Explorateur
  setExplorerTable: (tName) => {
    state.explorerTable = tName;
    state.explorerSheet = 'anomalie';
    state.explorerPage = 1;
    state.explorerSearch = '';
    renderApp();
  },
  setExplorerSheet: (sName) => {
    state.explorerSheet = sName;
    state.explorerPage = 1;
    renderApp();
  },
  setExplorerSearch: (q) => {
    state.explorerSearch = q;
    state.explorerPage = 1;
    renderApp();
  },
  setExplorerPage: (p) => {
    state.explorerPage = Math.max(1, p);
    renderApp();
  },
  exportExplorerCsv: () => {
    const currentTable = fullTablesData[state.explorerTable];
    const rows = state.explorerSheet === 'corrigé' ? currentTable.rowsCorrige : currentTable.rows;
    if (!rows || rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.explorerTable}_${state.explorerSheet}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
  exportExplorerJson: () => {
    const currentTable = fullTablesData[state.explorerTable];
    const rows = state.explorerSheet === 'corrigé' ? currentTable.rowsCorrige : currentTable.rows;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.explorerTable}_${state.explorerSheet}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // GPARC Mobile
  setMobileDepart: (dId) => {
    state.mobileDepartId = dId;
    state.mobileSelectedPosteId = '';
    renderApp();
  },
  setMobileSearch: (q) => {
    state.mobileSearchQuery = q;
    renderApp();
  },
  selectMobilePoste: (pId) => {
    state.mobileSelectedPosteId = pId;
    renderApp();
  },
  saveMobileIntervention: (e) => {
    e.preventDefault();
    const typeSelect = document.getElementById('mobileAnomalieSelect');
    const noteInput = document.getElementById('mobileNoteInput');
    const newInt = {
      id: `INT-${String(state.mobileInterventions.length + 1).padStart(3, '0')}`,
      posteId: state.mobileSelectedPosteId || '125P8002',
      date: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: typeSelect ? typeSelect.value : 'RAS',
      note: (noteInput && noteInput.value) ? noteInput.value : 'Intervention enregistrée.'
    };
    state.mobileInterventions.unshift(newInt);
    renderApp();
  },

  // Modal rapport
  toggleReportModal: (show) => {
    state.showReportModal = show;
    state.reportCopied = false;
    renderApp();
  },
  copyReport: () => {
    navigator.clipboard.writeText(REPORT_TEXT);
    state.reportCopied = true;
    renderApp();
    setTimeout(() => {
      state.reportCopied = false;
      renderApp();
    }, 2000);
  },
  downloadReport: () => {
    const blob = new Blob([REPORT_TEXT], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Rapport_Synthese_GDO_MT.md';
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  renderApp();
}
