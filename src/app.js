/**
 * GPARC-Mobile MT — Application Web Mobile de Gestion des Ouvrages Moyenne Tension
 * Wilaya de Guelma (24) — Direction de Distribution de l'Électricité (SDO)
 *
 * Interface 100% GPARC-Mobile :
 * - Navigation mobile dock (Accueil, Schéma MT, Parc Ouvrages, Carnet Terrain, Paramètres & Tables)
 * - Thème Clair haute visibilité pour agents de terrain
 * - Pure HTML5 & JavaScript Vanilla (Zéro TypeScript, Zéro Node.js serveur, compatible GitHub Pages)
 */

import { networkData } from './data/networkData.js';
import { departsSummary } from './data/departsSummary.js';
import { tableSchemas } from './data/tableSchemas.js';
import { fullTablesData } from './data/fullTablesData.js';

// --- RÉFÉRENTIEL DES PARAMÈTRES RÉSEAU MT ---
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
  seuils: {
    tensionNominale: 30.0,
    tensionMin: 27.0,
    tensionMax: 33.0,
    chuteTensionMax: 5.0,
    chuteTensionMaxRurale: 7.0,
    cosPhi: 0.90
  }
};

function loadStoredSettings() {
  try {
    const saved = localStorage.getItem('gdo_mt_settings');
    if (saved) return JSON.parse(saved);
  } catch (err) {}
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function loadStoredInterventions() {
  try {
    const saved = localStorage.getItem('gdo_mt_interventions');
    if (saved) return JSON.parse(saved);
  } catch (err) {}
  return [
    {
      id: 'INT-2026-001',
      posteId: '121P8036',
      posteNom: 'Pge Bentabouche',
      date: '28/10/2026 09:30',
      type: 'Contrôle Huile Transfo',
      statut: 'RAS',
      note: 'Niveau d\'huile normal, pas de fuite au niveau des traversées. Disjoncteur BT OK.'
    },
    {
      id: 'INT-2026-002',
      posteId: '121P8519',
      posteNom: '30 LOGTS BENTABOUCHE',
      date: '27/10/2026 14:15',
      type: 'Vérification Parafoudres & Prise de Terre',
      statut: 'Anomalie Mineure',
      note: 'Résistance de terre mesurée à 8.2 ohms. Nettoyage de la tresse de mise à la masse recommandé.'
    }
  ];
}

// --- ÉTAT GLOBAL DE L'APPLICATION ---
const state = {
  activeTab: 'home', // 'home' | 'unifilaire' | 'ouvrages' | 'terrain' | 'settings'
  selectedDepartId: '127H1C3',
  selectedAgency: 'ALL', // 'ALL' | '121' | '123' | '125' | '127'
  
  // Recherche rapide globale (Header)
  showQuickSearchModal: false,
  quickSearchQuery: '',

  // Schéma Unifilaire
  showJunctions: false,
  zoom: 1,
  pan: { x: 30, y: 70 },
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  selectedNode: null,
  selectedEdge: null,
  showBottomSheet: false,

  // Ouvrages (Parc MT)
  ouvragesFilterType: 'P', // 'P' (Postes HTA/BT) | 'E' (Étoilements) | 'H_O' (Postes Sources & Coupures)
  ouvragesSearch: '',

  // Terrain & Visites (GPARC-Mobile)
  interventions: loadStoredInterventions(),
  newVisitPosteId: '121P8036',
  newVisitType: 'Inspection Visuelle Générale',
  newVisitStatut: 'RAS',
  newVisitNote: '',
  visitSuccessNotice: false,

  // Paramètres & Tables
  settingsSubTab: 'transfos', // 'transfos' | 'conducteurs' | 'seuils' | 'tables'
  settings: loadStoredSettings(),
  settingsSavedNotice: false,
  showNewTransfoModal: false,
  showNewConducteurModal: false,

  // Tables DBase
  tableSelected: 'Poste_htabt_lig',
  tablePage: 1,
  tablePageSize: 15,
  tableSearch: ''
};

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

// --- EN-TÊTE GPARC-MOBILE (TOP BAR) ---
function renderMobileTopBar() {
  return `
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2 shadow-xs">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <!-- Logo & Identité GPARC Mobile -->
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-xs shadow-xs tracking-wider">
            GP
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black tracking-tight text-slate-900 leading-none">GPARC-Mobile</span>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">MT 30kV</span>
            </div>
            <span class="text-[10px] text-slate-500 font-medium">SDO &middot; Wilaya de Guelma (24)</span>
          </div>
        </div>

        <!-- Outils & Sélecteur d'Agence -->
        <div class="flex items-center gap-1.5">
          <button
            onclick="window.app.openQuickSearch()"
            title="Recherche rapide d'ouvrage"
            class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold border border-slate-200 cursor-pointer"
          >
            🔍
          </button>

          <select
            onchange="window.app.setAgency(this.value)"
            class="bg-slate-50 text-slate-800 text-[11px] font-semibold rounded-lg px-2 py-1 border border-slate-300 cursor-pointer shadow-2xs max-w-[130px]"
          >
            <option value="ALL" ${state.selectedAgency === 'ALL' ? 'selected' : ''}>Toutes agences</option>
            <option value="121" ${state.selectedAgency === '121' ? 'selected' : ''}>121 &middot; Guelma</option>
            <option value="123" ${state.selectedAgency === '123' ? 'selected' : ''}>123 &middot; Oued Zenati</option>
            <option value="125" ${state.selectedAgency === '125' ? 'selected' : ''}>125 &middot; Bouchegouf</option>
            <option value="127" ${state.selectedAgency === '127' ? 'selected' : ''}>127 &middot; District Est</option>
          </select>
        </div>
      </div>
    </header>
  `;
}

// --- DOCK DE NAVIGATION GPARC-MOBILE (BOTTOM BAR) ---
function renderMobileBottomBar() {
  const navItems = [
    { id: 'home', label: 'Accueil', icon: '🏠' },
    { id: 'unifilaire', label: 'Schéma MT', icon: '⚡' },
    { id: 'ouvrages', label: 'Ouvrages', icon: '🏢' },
    { id: 'terrain', label: 'Visites', icon: '📝' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' }
  ];

  return `
    <nav class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div class="max-w-md mx-auto grid grid-cols-5 gap-1">
        ${navItems.map(item => {
          const isActive = state.activeTab === item.id;
          return `
            <button
              onclick="window.app.setTab('${item.id}')"
              class="flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer select-none ${
                isActive
                  ? 'text-blue-600 font-bold bg-blue-50/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }"
            >
              <span class="text-base leading-none mb-0.5">${item.icon}</span>
              <span class="text-[10px] leading-tight truncate tracking-tight">${item.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    </nav>
  `;
}

// --- VUE 1 : ACCUEIL MOBILE GPARC ---
function renderHomeView() {
  const totalKm = departsSummary.reduce((acc, d) => acc + d.totalLengthKm, 0).toFixed(1);
  const totalPostes = departsSummary.reduce((acc, d) => acc + d.posteCount, 0);
  const totalPower = departsSummary.reduce((acc, d) => acc + d.totalPowerKva, 0);
  const totalArcs = departsSummary.reduce((acc, d) => acc + d.arcCount, 0);

  const filteredDeparts = state.selectedAgency === 'ALL'
    ? departsSummary
    : departsSummary.filter(d => d.id.startsWith(state.selectedAgency));

  return `
    <div class="p-4 space-y-4 max-w-2xl mx-auto">
      <!-- Bannière Principale GPARC-Mobile -->
      <div class="p-4 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-100">
              GPARC-Terrain Connecté &middot; Cache Local
            </span>
          </div>
          <span class="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-bold">
            ${filteredDeparts.length} Départs MT
          </span>
        </div>

        <div>
          <h1 class="text-lg font-black tracking-tight">Réseau Moyenne Tension (HTA)</h1>
          <p class="text-xs text-blue-100 leading-relaxed mt-0.5">
            Cartographie topologique, caractéristiques physiques des ouvrages et carnet de visite technique.
          </p>
        </div>

        <!-- 3 Boutons d'Action Rapide de Terrain -->
        <div class="pt-1 grid grid-cols-3 gap-2 text-xs">
          <button
            onclick="window.app.openDepart('${filteredDeparts[0]?.id || '127H1C3'}')"
            class="py-2 px-2 bg-white text-blue-700 font-bold rounded-xl shadow-xs text-center cursor-pointer flex flex-col items-center justify-center hover:bg-blue-50"
          >
            <span class="text-sm mb-0.5">⚡</span>
            <span>Schéma MT</span>
          </button>
          <button
            onclick="window.app.setTab('ouvrages')"
            class="py-2 px-2 bg-blue-800/80 hover:bg-blue-800 text-white font-semibold rounded-xl text-center cursor-pointer flex flex-col items-center justify-center border border-white/10"
          >
            <span class="text-sm mb-0.5">🏢</span>
            <span>Ouvrages</span>
          </button>
          <button
            onclick="window.app.setTab('terrain')"
            class="py-2 px-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl text-center cursor-pointer flex flex-col items-center justify-center border border-white/10"
          >
            <span class="text-sm mb-0.5">📝</span>
            <span>Visite Terrain</span>
          </button>
        </div>
      </div>

      <!-- 4 Compteurs Statistiques Tactiles -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Linéaire Total</span>
          <div class="text-lg font-mono font-bold text-slate-900">${totalKm} <span class="text-xs font-normal text-slate-500">km</span></div>
          <span class="text-[10px] text-slate-500">${formatNumber(totalArcs)} tronçons de lignes</span>
        </div>

        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Postes HTA/BT</span>
          <div class="text-lg font-mono font-bold text-amber-700">${totalPostes}</div>
          <span class="text-[10px] text-slate-500">Postes transformateurs</span>
        </div>

        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Puissance Réseau</span>
          <div class="text-lg font-mono font-bold text-purple-700">${formatNumber(totalPower)} <span class="text-xs font-normal text-slate-500">kVA</span></div>
          <span class="text-[10px] text-slate-500">Tension : 30 kV / 400 V</span>
        </div>

        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Étoilements</span>
          <div class="text-lg font-mono font-bold text-teal-700">378</div>
          <span class="text-[10px] text-slate-500">Piquages de dérivation</span>
        </div>
      </div>

      <!-- Liste Rapide des Départs MT -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">Départs MT &middot; Agence ${state.selectedAgency} (${filteredDeparts.length})</h2>
          <span class="text-[10px] text-slate-400">Touchez pour ouvrir</span>
        </div>

        <div class="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          ${filteredDeparts.map(d => `
            <div
              onclick="window.app.openDepart('${d.id}')"
              class="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between cursor-pointer"
            >
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-bold text-xs text-slate-900">${d.id}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">${d.posteCount} Postes</span>
                </div>
                <span class="text-[11px] text-slate-500 block">${d.totalLengthKm} km &middot; ${d.arcCount} Arcs &middot; ${formatNumber(d.totalPowerKva)} kVA</span>
              </div>
              <span class="text-xs text-blue-600 font-bold px-2 py-1 rounded-lg bg-blue-50">&rarr;</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Postes Sources HTB / HTA -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">Postes Sources HTB / HTA</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
            <span class="font-mono font-bold text-purple-900 block text-xs">125H3 &middot; NADOR</span>
            <span class="text-[11px] text-slate-600">60 / 30 kV &middot; 2 &times; 40 MVA &middot; 12 Départs</span>
          </div>
          <div class="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
            <span class="font-mono font-bold text-purple-900 block text-xs">125H2 &middot; MEDJEZ SFA</span>
            <span class="text-[11px] text-slate-600">90 / 30 kV &middot; 2 &times; 10 MVA &middot; 8 Départs</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- VUE 2 : SCHÉMA UNIFILAIRE MT AVEC BOTTOM SHEET ---
function renderUnifilaireView() {
  const currentDepart = networkData.departs[state.selectedDepartId] || networkData.departs['127H1C3'] || networkData.departs['125H3C20'];
  if (!currentDepart) return '<div class="p-8 text-center text-slate-500">Départ MT introuvable</div>';

  const nodes = currentDepart.nodes;
  const rawEdges = currentDepart.edges;

  let renderNodes = nodes;
  let renderEdges = rawEdges;
  if (!state.showJunctions) {
    const essentialSet = new Set(nodes.filter(n => n.type !== 'JONCTION').map(n => n.id));
    renderNodes = nodes.filter(n => essentialSet.has(n.id));
    renderEdges = rawEdges.filter(e => essentialSet.has(e.from) && essentialSet.has(e.to));
  }

  // Racine du départ
  let rootNode = nodes.find(n => n.type === 'POSTE_SOURCE' || n.type === 'CELLULE');
  if (!rootNode) {
    const prefixMatch = currentDepart.id.match(/^(\d+[A-Z]\d+)/);
    if (prefixMatch) rootNode = nodes.find(n => n.id.startsWith(prefixMatch[1]));
  }
  if (!rootNode) rootNode = nodes[0];
  const rootId = rootNode ? rootNode.id : nodes[0]?.id;

  // Calcul du graphe topologique
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
  const xSpacing = 160;
  const ySpacing = 68;

  for (let d = 0; d <= maxDepth; d++) {
    const group = depthGroups[d] || [];
    const totalH = group.length * ySpacing;
    const startY = 260 - totalH / 2;
    group.forEach((n, idx) => {
      calculatedNodes.push({
        ...n,
        x: 80 + d * xSpacing,
        y: startY + idx * ySpacing,
        depth: d,
        inPath: inPathSet.has(n.id)
      });
    });
  }

  const nodePosMap = new Map();
  for (const n of calculatedNodes) nodePosMap.set(n.id, n);

  return `
    <div class="flex flex-col h-[calc(100vh-105px)] bg-slate-50 text-slate-800 relative overflow-hidden">
      <!-- Toolbar GPARC-Mobile pour Schéma -->
      <div class="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 shrink-0 z-20 shadow-xs">
        <div class="flex items-center gap-1.5 min-w-0">
          <select
            onchange="window.app.selectDepart(this.value)"
            class="bg-slate-50 text-slate-900 text-xs font-mono font-bold rounded-lg px-2 py-1.5 border border-slate-300 max-w-[180px] truncate"
          >
            ${departsSummary.map(d => `
              <option value="${d.id}" ${d.id === state.selectedDepartId ? 'selected' : ''}>
                ${d.id} (${d.posteCount}P)
              </option>
            `).join('')}
          </select>
          <span class="text-[10px] text-slate-500 font-medium hidden sm:inline">
            ${currentDepart.totalLengthKm} km
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            onclick="window.app.toggleJunctions()"
            class="px-2 py-1 text-[11px] font-semibold rounded-lg border ${
              state.showJunctions ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-300 text-slate-600'
            }"
          >
            Jonct. ${state.showJunctions ? 'ON' : 'OFF'}
          </button>
          <button
            onclick="window.app.fitView()"
            class="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 border border-slate-300 text-slate-700"
          >
            Centrer
          </button>
        </div>
      </div>

      <!-- Canvas SVG Interactif -->
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
          <!-- Arcs MT -->
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

              return `
                <g class="cursor-pointer" onclick="window.app.selectEdge('${edge.id}')">
                  <line
                    x1="${u.x}" y1="${u.y}" x2="${v.x}" y2="${v.y}"
                    stroke="${strokeColor}"
                    stroke-width="${strokeWidth}"
                    stroke-dasharray="${edge.struct === 'SOUTERRAIN' ? '4 3' : 'none'}"
                    opacity="${isInPath || isEdgeSelected ? '1' : '0.85'}"
                  />
                  ${state.zoom >= 0.8 && edge.longueur > 0 ? `
                    <text x="${(u.x + v.x) / 2}" y="${(u.y + v.y) / 2 - 4}" fill="#64748b" font-size="9" font-family="monospace" text-anchor="middle">
                      ${edge.longueur}m
                    </text>
                  ` : ''}
                </g>
              `;
            }).join('')}
          </g>

          <!-- Nœuds MT -->
          <g class="nodes">
            ${calculatedNodes.map(node => {
              const isSelected = state.selectedNode?.id === node.id;
              const isRoot = node.id === rootId;
              let r = node.type === 'POSTE_SOURCE' ? 15 : (node.type === 'POSTE_HTA_BT' ? 12 : (node.type === 'ETOILEMENT' ? 9 : 5));

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
                    <text x="0" y="${r + 12}" fill="${isSelected ? '#1d4ed8' : '#0f172a'}" font-size="9.5" font-family="monospace" font-weight="${node.type === 'POSTE_HTA_BT' || isSelected ? 'bold' : 'normal'}" text-anchor="middle">
                      ${escapeHtml(node.meta?.nom ? `${node.meta.nom} (${node.id})` : node.id)}
                    </text>
                  ` : ''}

                  ${node.type === 'POSTE_HTA_BT' && node.meta?.p_instal ? `
                    <text x="0" y="${-r - 4}" fill="#b45309" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">
                      ${node.meta.p_instal}k
                    </text>
                  ` : ''}
                </g>
              `;
            }).join('')}
          </g>
        </svg>

        <!-- Contrôles Flottants Zoom Tactile -->
        <div class="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
          <button onclick="window.app.zoomCanvas(0.2)" class="w-9 h-9 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-base cursor-pointer">+</button>
          <button onclick="window.app.zoomCanvas(-0.2)" class="w-9 h-9 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-base cursor-pointer">&minus;</button>
        </div>
      </div>

      <!-- Bottom Sheet Tactile GPARC-Mobile (Fiche Ouvrage & Action Visite) -->
      ${state.showBottomSheet && (state.selectedNode || state.selectedEdge) ? `
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl p-4 z-30 max-h-[55vh] overflow-y-auto space-y-3">
          <div class="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span class="text-[10px] text-slate-400 font-mono uppercase block">Fiche Ouvrage GPARC</span>
              <strong class="font-mono text-base text-slate-900">${state.selectedNode?.id || state.selectedEdge?.id}</strong>
              ${state.selectedNode?.meta?.nom ? `
                <div class="text-xs font-bold text-amber-700">${escapeHtml(state.selectedNode.meta.nom)}</div>
              ` : ''}
            </div>
            <button onclick="window.app.closeBottomSheet()" class="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-slate-100 font-bold cursor-pointer">Fermer</button>
          </div>

          ${state.selectedNode ? `
            <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div><span class="text-slate-400 block text-[9px]">Tension Nominale</span><span class="text-slate-900 font-bold">30 kV / 400 V</span></div>
              <div><span class="text-slate-400 block text-[9px]">Puissance Transfo</span><span class="text-amber-700 font-bold">${state.selectedNode.meta?.p_instal || 160} kVA</span></div>
              <div><span class="text-slate-400 block text-[9px]">Structure</span><span class="text-slate-900">${state.selectedNode.meta?.t_poste === 'MS' ? 'Cabine Maçonnée (MS)' : 'Haut de Poteau (AC)'}</span></div>
              <div><span class="text-slate-400 block text-[9px]">Commune</span><span class="text-slate-900 truncate block">${escapeHtml(state.selectedNode.meta?.localite || 'Wilaya de Guelma')}</span></div>
            </div>

            <div class="pt-1 flex gap-2">
              <button
                onclick="window.app.createInterventionForPoste('${state.selectedNode.id}', '${escapeHtml(state.selectedNode.meta?.nom || state.selectedNode.id)}')"
                class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs text-center cursor-pointer"
              >
                📝 Créer Fiche de Visite de Terrain
              </button>
            </div>
          ` : ''}

          ${state.selectedEdge ? `
            <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div><span class="text-slate-400 block text-[9px]">Longueur</span><span class="text-emerald-700 font-bold">${state.selectedEdge.longueur} m</span></div>
              <div><span class="text-slate-400 block text-[9px]">Conducteur</span><span class="text-slate-900 font-bold">${state.selectedEdge.nat_cond} ${state.selectedEdge.section} mm²</span></div>
              <div><span class="text-slate-400 block text-[9px]">Pose</span><span class="text-slate-900">${state.selectedEdge.struct}</span></div>
              <div><span class="text-slate-400 block text-[9px]">Supports</span><span class="text-slate-900">Béton: ${state.selectedEdge.supports.beton} &middot; Métal: ${state.selectedEdge.supports.metal}</span></div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// --- VUE 3 : OUVRAGES (CATALOGUE PARC GPARC) ---
function renderOuvragesView() {
  const currentDepart = networkData.departs[state.selectedDepartId] || networkData.departs['127H1C3'] || networkData.departs['125H3C20'];
  const allNodes = currentDepart.nodes;

  let filtered = allNodes;
  if (state.ouvragesFilterType === 'P') {
    filtered = allNodes.filter(n => n.type === 'POSTE_HTA_BT');
  } else if (state.ouvragesFilterType === 'E') {
    filtered = allNodes.filter(n => n.type === 'ETOILEMENT');
  } else if (state.ouvragesFilterType === 'H_O') {
    filtered = allNodes.filter(n => n.type === 'POSTE_SOURCE' || n.type === 'POSTE_COUPURE');
  }

  if (state.ouvragesSearch.trim()) {
    const q = state.ouvragesSearch.toLowerCase();
    filtered = filtered.filter(n =>
      n.id.toLowerCase().includes(q) ||
      (n.meta?.nom && n.meta.nom.toLowerCase().includes(q)) ||
      (n.meta?.localite && n.meta.localite.toLowerCase().includes(q))
    );
  }

  return `
    <div class="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 class="text-base font-bold text-slate-900">Catalogue des Ouvrages MT</h1>
        <p class="text-xs text-slate-500">Parc des équipements du départ ${state.selectedDepartId}</p>
      </div>

      <!-- Segmented Control Type d'Ouvrage -->
      <div class="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs">
        <button
          onclick="window.app.setOuvragesFilter('P')"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.ouvragesFilterType === 'P' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Postes HTA/BT
        </button>
        <button
          onclick="window.app.setOuvragesFilter('E')"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.ouvragesFilterType === 'E' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Piquages (Étoil.)
        </button>
        <button
          onclick="window.app.setOuvragesFilter('H_O')"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.ouvragesFilterType === 'H_O' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Sources &amp; PC
        </button>
      </div>

      <!-- Barre de recherche -->
      <input
        type="text"
        placeholder="Rechercher par code, nom, commune..."
        value="${escapeHtml(state.ouvragesSearch)}"
        oninput="window.app.setOuvragesSearch(this.value)"
        class="w-full bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-300 shadow-2xs"
      />

      <!-- Liste des Ouvrages Mobile -->
      <div class="space-y-2">
        <span class="text-[11px] font-bold text-slate-500 block px-1">${filtered.length} équipements répertoriés :</span>

        ${filtered.map(n => `
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div class="truncate pr-2">
              <div class="flex items-center gap-1.5">
                <span class="font-mono font-bold text-xs text-slate-900">${n.id}</span>
                ${n.type === 'POSTE_HTA_BT' ? `
                  <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                    ${n.meta?.p_instal || 160} kVA
                  </span>
                ` : ''}
              </div>
              <span class="text-xs font-semibold text-slate-700 block truncate">${n.meta?.nom || n.type}</span>
              <span class="text-[10px] text-slate-400 block">${n.meta?.localite || 'Wilaya de Guelma (24)'}</span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button
                onclick="window.app.showOuvrageOnMap('${n.id}')"
                class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer"
              >
                ⚡ Schéma
              </button>
              <button
                onclick="window.app.createInterventionForPoste('${n.id}', '${escapeHtml(n.meta?.nom || n.id)}')"
                class="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer"
              >
                📝 Visite
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- VUE 4 : TERRAIN & VISITES (CARNET DE TERRAIN GPARC-MOBILE) ---
function renderTerrainView() {
  const currentDepart = networkData.departs[state.selectedDepartId] || networkData.departs['127H1C3'];
  const posteOptions = currentDepart.nodes.filter(n => n.type === 'POSTE_HTA_BT');

  return `
    <div class="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 class="text-base font-bold text-slate-900">Carnet de Terrain &amp; Visites Techniques</h1>
        <p class="text-xs text-slate-500">Relevés d'anomalies, fiches d'inspection et contrôle des postes MT</p>
      </div>

      ${state.visitSuccessNotice ? `
        <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>&check; Visite enregistrée avec succès dans le stockage local !</span>
          <button onclick="state.visitSuccessNotice = false; renderApp();" class="text-emerald-900 font-bold">&times;</button>
        </div>
      ` : ''}

      <!-- Formulaire Tactile d'Inspection sur Site -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span>📝 Nouvelle Fiche de Visite de Poste</span>
        </h2>

        <form onsubmit="window.app.saveIntervention(event)" class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 font-semibold text-[11px] mb-1">Poste MT à inspecter</label>
            <select
              id="fieldVisitPoste"
              class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono text-xs font-semibold"
            >
              ${posteOptions.map(p => `
                <option value="${p.id}" ${p.id === state.newVisitPosteId ? 'selected' : ''}>
                  ${p.id} &middot; ${p.meta?.nom || 'Poste'} (${p.meta?.p_instal || 160} kVA)
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Type de Contrôle</label>
              <select id="fieldVisitType" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs">
                <option value="Inspection Visuelle Générale">Inspection Visuelle Générale</option>
                <option value="Contrôle Huile Transfo">Contrôle Huile &amp; Étanchéité</option>
                <option value="Vérification Fusibles MT / BT">Vérification Fusibles &amp; Disjoncteur</option>
                <option value="Mesure Tension BT &amp; Équilibrage">Mesure Tension BT &amp; Équilibrage</option>
                <option value="Contrôle Terre &amp; Parafoudres">Prise de Terre &amp; Parafoudres</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Constat Technique</label>
              <select id="fieldVisitStatut" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs font-semibold">
                <option value="RAS" class="text-emerald-700">Bon état (RAS)</option>
                <option value="Anomalie Mineure" class="text-amber-700">Anomalie Mineure</option>
                <option value="Anomalie Critique" class="text-red-700">Anomalie Critique (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-600 font-semibold text-[11px] mb-1">Observations &amp; Relevés de Terrain</label>
            <textarea
              id="fieldVisitNotes"
              rows="3"
              placeholder="Ex : Niveau d'huile OK, tension 232V/402V, serrage des cosses BT effectué..."
              class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs text-slate-900"
            ></textarea>
          </div>

          <button
            type="submit"
            class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
          >
            &check; Enregistrer la Visite dans GPARC Mobile
          </button>
        </form>
      </div>

      <!-- Historique des Visites Enregistrées -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold text-slate-700">Historique des Visites (${state.interventions.length})</span>
          <button
            onclick="window.app.exportInterventions()"
            class="text-xs text-blue-600 font-bold cursor-pointer"
          >
            Export JSON
          </button>
        </div>

        ${state.interventions.length === 0 ? `
          <div class="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Aucune visite enregistrée pour le moment.
          </div>
        ` : state.interventions.map(int => `
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="font-mono font-bold text-slate-900">${int.posteId}</span>
                <span class="text-[10px] text-slate-500 font-semibold">${escapeHtml(int.posteNom || '')}</span>
              </div>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${
                int.statut === 'RAS' ? 'bg-emerald-100 text-emerald-800' :
                int.statut === 'Anomalie Mineure' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }">
                ${int.statut}
              </span>
            </div>
            <div class="text-[11px] text-slate-600">${int.type}</div>
            <div class="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">${escapeHtml(int.note)}</div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>${int.date}</span>
              <button onclick="window.app.deleteIntervention('${int.id}')" class="text-red-500 hover:text-red-700 font-semibold cursor-pointer">Supprimer</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- VUE 5 : PARAMÈTRES & DONNÉES DBASE (GESTION RÉFÉRENTIELS) ---
function renderSettingsView() {
  const { transfos, conducteurs, seuils } = state.settings;

  return `
    <div class="p-4 space-y-4 max-w-2xl mx-auto">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-base font-bold text-slate-900">Paramètres &amp; Référentiel MT</h1>
          <p class="text-xs text-slate-500">Calibres transformateurs, câbles, seuils &amp; tables DBase</p>
        </div>
        <button
          onclick="window.app.resetDefaultSettings()"
          class="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg shadow-2xs cursor-pointer"
        >
          Reset Normes
        </button>
      </div>

      <!-- Segmented Control Sous-Onglets -->
      <div class="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs">
        <button
          onclick="window.app.setSettingsSubTab('transfos')"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.settingsSubTab === 'transfos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Transfos
        </button>
        <button
          onclick="window.app.setSettingsSubTab('conducteurs')"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.settingsSubTab === 'conducteurs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Lignes
        </button>
        <button
          onclick="window.app.setSettingsSubTab('seuils')"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.settingsSubTab === 'seuils' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Seuils MT
        </button>
        <button
          onclick="window.app.setSettingsSubTab('tables')"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.settingsSubTab === 'tables' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          12 Tables
        </button>
      </div>

      <!-- 1. Sous-Onglet Transformateurs -->
      ${state.settingsSubTab === 'transfos' ? `
        <div class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-bold text-slate-700">Calibres Normalisés Sonelgaz (${transfos.length})</span>
            <button onclick="window.app.toggleNewTransfoModal(true)" class="text-xs text-blue-600 font-bold cursor-pointer">+ Ajouter</button>
          </div>

          ${transfos.map((t, index) => `
            <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
              <div>
                <span class="font-mono font-bold text-amber-800 text-sm block">${t.kva} kVA</span>
                <span class="text-slate-500 text-[11px]">Ucc: ${t.ucc}% &middot; In: ${t.in30}A &middot; P0: ${t.p0}W &middot; Pk: ${t.pk}W</span>
                <span class="text-[10px] text-slate-400 block">${t.desc || ''}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">${t.type}</span>
                <button onclick="window.app.deleteTransfo(${index})" class="text-slate-400 hover:text-red-500 text-sm px-1 font-bold cursor-pointer">&times;</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- 2. Sous-Onglet Conducteurs -->
      ${state.settingsSubTab === 'conducteurs' ? `
        <div class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-bold text-slate-700">Sections de Lignes &amp; Câbles (${conducteurs.length})</span>
            <button onclick="window.app.toggleNewConducteurModal(true)" class="text-xs text-blue-600 font-bold cursor-pointer">+ Ajouter</button>
          </div>

          ${conducteurs.map((c, index) => `
            <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
              <div>
                <span class="font-mono font-bold text-slate-900 text-sm block">${c.nom}</span>
                <span class="text-slate-500 text-[11px]">R': ${c.r}&Omega;/km &middot; X': ${c.x}&Omega;/km &middot; Imax: ${c.iMax}A</span>
                <span class="text-[10px] text-slate-400 block">Pose: ${c.pose}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold">${c.section} mm²</span>
                <button onclick="window.app.deleteConducteur(${index})" class="text-slate-400 hover:text-red-500 text-sm px-1 font-bold cursor-pointer">&times;</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- 3. Sous-Onglet Seuils MT -->
      ${state.settingsSubTab === 'seuils' ? `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 text-xs">
          <h2 class="font-bold text-slate-800 text-xs uppercase tracking-wide">Seuils Électriques HTA (30 kV)</h2>
          <form onsubmit="window.app.saveSeuils(event)" class="space-y-3">
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Tension Nominale MT (kV)</label>
              <input id="inputTensionNominale" type="number" step="0.5" value="${seuils.tensionNominale}" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono" />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Chute de Tension Max Urbaine (%)</label>
              <input id="inputChuteTensionMax" type="number" step="0.1" value="${seuils.chuteTensionMax}" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono" />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Facteur de Puissance (cos &phi;)</label>
              <input id="inputCosPhi" type="number" step="0.01" value="${seuils.cosPhi}" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono" />
            </div>

            <button type="submit" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer">
              Enregistrer les Seuils
            </button>
          </form>
        </div>
      ` : ''}

      <!-- 4. Sous-Onglet Tables DBase Historiques -->
      ${state.settingsSubTab === 'tables' ? renderTablesView() : ''}
    </div>
  `;
}

// --- VUE TABLES DBASE (12 TABLES EXTRAITES D'ORIGINE) ---
function renderTablesView() {
  const currentTable = fullTablesData[state.tableSelected] || fullTablesData['Poste_htabt_lig'];
  const rawRows = currentTable.rows || [];

  const filteredRows = state.tableSearch.trim()
    ? rawRows.filter(r => Object.values(r).some(val => String(val ?? '').toLowerCase().includes(state.tableSearch.toLowerCase())))
    : rawRows;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / state.tablePageSize));
  const start = (state.tablePage - 1) * state.tablePageSize;
  const paginatedRows = filteredRows.slice(start, start + state.tablePageSize);
  const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  return `
    <div class="space-y-3 pt-1">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span class="text-xs font-bold text-slate-700">12 Fichiers Extraits DBase</span>
        <div class="flex items-center gap-1.5">
          <button onclick="window.app.exportCurrentCsv()" class="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs cursor-pointer">
            Export CSV
          </button>
          <button onclick="window.app.exportCurrentJson()" class="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs cursor-pointer">
            Export JSON
          </button>
        </div>
      </div>

      <div class="flex gap-2">
        <select
          onchange="window.app.selectTable(this.value)"
          class="flex-1 bg-white text-slate-900 text-xs font-mono font-bold rounded-xl p-2 border border-slate-300"
        >
          ${Object.keys(fullTablesData).map(tName => `
            <option value="${tName}" ${tName === state.tableSelected ? 'selected' : ''}>
              ${fullTablesData[tName].fileName} (${fullTablesData[tName].totalRows} lig.)
            </option>
          `).join('')}
        </select>

        <input
          type="text"
          placeholder="Filtrer..."
          value="${escapeHtml(state.tableSearch)}"
          oninput="window.app.setTableSearch(this.value)"
          class="w-32 bg-white text-slate-900 text-xs rounded-xl px-2 py-1.5 border border-slate-300"
        />
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        <div class="overflow-x-auto min-h-[280px]">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th class="py-2 px-2.5 font-semibold w-8 text-center">#</th>
                ${columns.slice(0, 6).map(c => `<th class="py-2 px-2.5 font-semibold font-mono whitespace-nowrap">${c}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${paginatedRows.map((row, idx) => `
                <tr class="hover:bg-slate-50/80">
                  <td class="py-2 px-2.5 text-center text-[10px] text-slate-400 font-mono">${start + idx + 1}</td>
                  ${columns.slice(0, 6).map(c => `
                    <td class="py-2 px-2.5 font-mono text-[11px] whitespace-nowrap text-slate-800">
                      ${escapeHtml(row[c] ?? '-')}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-2.5 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50">
          <span class="text-[11px] text-slate-500 font-mono">Page ${state.tablePage} / ${totalPages} (${filteredRows.length} lignes)</span>
          <div class="flex gap-1">
            <button
              onclick="window.app.setTablePage(${state.tablePage - 1})"
              ${state.tablePage <= 1 ? 'disabled' : ''}
              class="px-2 py-1 rounded bg-white border border-slate-300 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >&larr;</button>
            <button
              onclick="window.app.setTablePage(${state.tablePage + 1})"
              ${state.tablePage >= totalPages ? 'disabled' : ''}
              class="px-2 py-1 rounded bg-white border border-slate-300 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >&rarr;</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- MODAL RECHERCHE RAPIDE GLOBALE ---
function renderQuickSearchModal() {
  if (!state.showQuickSearchModal) return '';

  const q = state.quickSearchQuery.trim().toLowerCase();
  let results = [];

  if (q.length >= 2) {
    // Recherche dans tous les départs
    for (const dep of departsSummary) {
      if (dep.id.toLowerCase().includes(q)) {
        results.push({ type: 'DEPART', id: dep.id, label: `Départ ${dep.id} (${dep.posteCount}P)` });
      }
      for (const p of dep.samplePostes) {
        if (p.id.toLowerCase().includes(q) || (p.nom && p.nom.toLowerCase().includes(q))) {
          results.push({ type: 'POSTE', id: p.id, depId: dep.id, label: `${p.id} &middot; ${p.nom || 'Poste'}`, extra: `${dep.id}` });
        }
      }
      if (results.length > 20) break;
    }
  }

  return `
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center p-4 pt-16">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col space-y-2 p-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <span class="text-xs font-bold text-slate-800">🔍 Recherche Rapide d'Ouvrage MT</span>
          <button onclick="window.app.closeQuickSearch()" class="text-slate-400 hover:text-slate-800 font-bold text-base px-1 cursor-pointer">&times;</button>
        </div>

        <input
          id="quickSearchInput"
          type="text"
          autofocus
          placeholder="Ex : 121P8002, Bentabouche, 127H1C3..."
          value="${escapeHtml(state.quickSearchQuery)}"
          oninput="window.app.handleQuickSearch(this.value)"
          class="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-300 focus:bg-white focus:outline-blue-500"
        />

        <div class="max-h-[300px] overflow-y-auto space-y-1 pt-1">
          ${q.length < 2 ? `
            <div class="p-4 text-center text-xs text-slate-400">Tapez au moins 2 caractères...</div>
          ` : results.length === 0 ? `
            <div class="p-4 text-center text-xs text-slate-400">Aucun résultat trouvé pour "${escapeHtml(q)}"</div>
          ` : results.map(r => `
            <div
              onclick="window.app.selectSearchResult('${r.type}', '${r.id}', '${r.depId || r.id}')"
              class="p-2 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer text-xs"
            >
              <div>
                <span class="font-mono font-bold text-slate-900">${r.id}</span>
                <span class="text-slate-600 block text-[11px]">${r.label}</span>
              </div>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${r.type === 'DEPART' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}">
                ${r.type}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// --- MODAL AJOUT TRANSFORMATEUR ---
function renderNewTransfoModal() {
  if (!state.showNewTransfoModal) return '';

  return `
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-4 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <strong class="text-xs font-bold text-slate-900">Ajouter un Calibre Transfo MT</strong>
          <button onclick="window.app.toggleNewTransfoModal(false)" class="text-slate-400 hover:text-slate-800 font-bold">&times;</button>
        </div>

        <form onsubmit="window.app.addNewTransfo(event)" class="space-y-2 text-xs">
          <div>
            <label class="block text-slate-600 font-semibold text-[11px] mb-1">Puissance (kVA)</label>
            <input id="newTransfoKva" type="number" required placeholder="Ex : 800" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Pertes à vide P0 (W)</label>
              <input id="newTransfoP0" type="number" placeholder="1300" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono" />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Pertes en charge Pk (W)</label>
              <input id="newTransfoPk" type="number" placeholder="8500" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono" />
            </div>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold text-[11px] mb-1">Type de structure</label>
            <select id="newTransfoType" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300">
              <option value="MS">Cabine Maçonnée (MS)</option>
              <option value="AC">Haut de Poteau (AC)</option>
              <option value="MA">Poste Urbain Mobile (MA)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold text-[11px] mb-1">Description / Usage</label>
            <input id="newTransfoDesc" type="text" placeholder="Ex : Zone industrielle" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300" />
          </div>

          <div class="pt-2 flex gap-2">
            <button type="button" onclick="window.app.toggleNewTransfoModal(false)" class="flex-1 py-2 bg-slate-100 font-semibold text-slate-700 rounded-xl">Annuler</button>
            <button type="submit" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// --- MODAL AJOUT CONDUCTEUR ---
function renderNewConducteurModal() {
  if (!state.showNewConducteurModal) return '';

  return `
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-4 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <strong class="text-xs font-bold text-slate-900">Ajouter une Section de Ligne</strong>
          <button onclick="window.app.toggleNewConducteurModal(false)" class="text-slate-400 hover:text-slate-800 font-bold">&times;</button>
        </div>

        <form onsubmit="window.app.addNewConducteur(event)" class="space-y-2 text-xs">
          <div>
            <label class="block text-slate-600 font-semibold text-[11px] mb-1">Nom usuel</label>
            <input id="newCondNom" type="text" required placeholder="Ex : Almélec 93 mm²" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Section (mm²)</label>
              <input id="newCondSection" type="number" required placeholder="93" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono" />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Nature</label>
              <select id="newCondNat" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono">
                <option value="AM">AM (Almélec)</option>
                <option value="AL">AL (Aluminium)</option>
                <option value="CU">CU (Cuivre)</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-1.5">
            <div>
              <label class="block text-slate-600 font-semibold text-[10px] mb-1">R' (&Omega;/km)</label>
              <input id="newCondR" type="number" step="0.01" placeholder="0.35" class="w-full bg-slate-50 rounded-lg p-1.5 border border-slate-300 font-mono text-[11px]" />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold text-[10px] mb-1">X' (&Omega;/km)</label>
              <input id="newCondX" type="number" step="0.01" placeholder="0.36" class="w-full bg-slate-50 rounded-lg p-1.5 border border-slate-300 font-mono text-[11px]" />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold text-[10px] mb-1">Imax (A)</label>
              <input id="newCondImax" type="number" placeholder="280" class="w-full bg-slate-50 rounded-lg p-1.5 border border-slate-300 font-mono text-[11px]" />
            </div>
          </div>

          <div class="pt-2 flex gap-2">
            <button type="button" onclick="window.app.toggleNewConducteurModal(false)" class="flex-1 py-2 bg-slate-100 font-semibold text-slate-700 rounded-xl">Annuler</button>
            <button type="submit" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// --- RENDU GLOBAL SPA ---
export function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  let viewHtml = '';
  if (state.activeTab === 'home') viewHtml = renderHomeView();
  else if (state.activeTab === 'unifilaire') viewHtml = renderUnifilaireView();
  else if (state.activeTab === 'ouvrages') viewHtml = renderOuvragesView();
  else if (state.activeTab === 'terrain') viewHtml = renderTerrainView();
  else if (state.activeTab === 'settings') viewHtml = renderSettingsView();

  root.innerHTML = `
    <div class="min-h-screen bg-slate-50 text-slate-900 pb-20 flex flex-col antialiased">
      ${renderMobileTopBar()}
      <main class="flex-1">
        ${viewHtml}
      </main>
      ${renderMobileBottomBar()}

      <!-- Modals Flottantes -->
      ${renderQuickSearchModal()}
      ${renderNewTransfoModal()}
      ${renderNewConducteurModal()}
    </div>
  `;
}

// --- MÉTHODES GLOBALES ACCESSIBLES ---
window.app = {
  setTab: (tabId) => {
    state.activeTab = tabId;
    renderApp();
  },
  setAgency: (agency) => {
    state.selectedAgency = agency;
    renderApp();
  },
  openDepart: (depId) => {
    state.selectedDepartId = depId;
    state.activeTab = 'unifilaire';
    state.selectedNode = null;
    state.selectedEdge = null;
    state.showBottomSheet = false;
    renderApp();
  },
  selectDepart: (depId) => {
    state.selectedDepartId = depId;
    state.selectedNode = null;
    state.selectedEdge = null;
    state.showBottomSheet = false;
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
    state.pan = { x: 30, y: 70 };
    renderApp();
  },
  selectNode: (nodeId) => {
    const dep = networkData.departs[state.selectedDepartId];
    const n = dep?.nodes.find(item => item.id === nodeId);
    if (n) {
      state.selectedNode = n;
      state.selectedEdge = null;
      state.showBottomSheet = true;
      renderApp();
    }
  },
  selectEdge: (edgeId) => {
    const dep = networkData.departs[state.selectedDepartId];
    const e = dep?.edges.find(item => item.id === edgeId);
    if (e) {
      state.selectedEdge = e;
      state.selectedNode = null;
      state.showBottomSheet = true;
      renderApp();
    }
  },
  closeBottomSheet: () => {
    state.showBottomSheet = false;
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

  // Ouvrages
  setOuvragesFilter: (type) => {
    state.ouvragesFilterType = type;
    renderApp();
  },
  setOuvragesSearch: (q) => {
    state.ouvragesSearch = q;
    renderApp();
  },
  showOuvrageOnMap: (nodeId) => {
    state.activeTab = 'unifilaire';
    state.selectedNode = null;
    const dep = networkData.departs[state.selectedDepartId];
    const n = dep?.nodes.find(item => item.id === nodeId);
    if (n) {
      state.selectedNode = n;
      state.showBottomSheet = true;
    }
    renderApp();
  },

  // Terrain & Visites (GPARC-Mobile)
  createInterventionForPoste: (nodeId, nodeNom) => {
    state.newVisitPosteId = nodeId;
    state.activeTab = 'terrain';
    state.showBottomSheet = false;
    renderApp();
  },
  saveIntervention: (e) => {
    e.preventDefault();
    const posteId = document.getElementById('fieldVisitPoste')?.value || state.newVisitPosteId;
    const type = document.getElementById('fieldVisitType')?.value || 'Inspection Visuelle';
    const statut = document.getElementById('fieldVisitStatut')?.value || 'RAS';
    const note = document.getElementById('fieldVisitNotes')?.value || 'Contrôle effectué sans anomalie.';

    const newInt = {
      id: `INT-${Date.now().toString().slice(-4)}`,
      posteId,
      posteNom: posteId,
      date: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type,
      statut,
      note
    };

    state.interventions.unshift(newInt);
    try {
      localStorage.setItem('gdo_mt_interventions', JSON.stringify(state.interventions));
    } catch (err) {}

    state.visitSuccessNotice = true;
    renderApp();
    setTimeout(() => {
      state.visitSuccessNotice = false;
      renderApp();
    }, 3000);
  },
  deleteIntervention: (id) => {
    state.interventions = state.interventions.filter(item => item.id !== id);
    try {
      localStorage.setItem('gdo_mt_interventions', JSON.stringify(state.interventions));
    } catch (err) {}
    renderApp();
  },
  exportInterventions: () => {
    const blob = new Blob([JSON.stringify(state.interventions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Visites_GPARC_Mobile_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Paramètres
  setSettingsSubTab: (subTab) => {
    state.settingsSubTab = subTab;
    renderApp();
  },
  resetDefaultSettings: () => {
    state.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    try { localStorage.removeItem('gdo_mt_settings'); } catch (err) {}
    renderApp();
  },
  toggleNewTransfoModal: (show) => {
    state.showNewTransfoModal = show;
    renderApp();
  },
  addNewTransfo: (e) => {
    e.preventDefault();
    const kva = Number(document.getElementById('newTransfoKva').value);
    const p0 = Number(document.getElementById('newTransfoP0').value) || 1000;
    const pk = Number(document.getElementById('newTransfoPk').value) || 6000;
    const type = document.getElementById('newTransfoType').value;
    const desc = document.getElementById('newTransfoDesc').value || 'Calibre normalisé';
    const in30 = Number((kva / (30 * Math.sqrt(3))).toFixed(2));

    state.settings.transfos.push({ kva, ucc: 4.0, p0, pk, in30, type, desc });
    state.settings.transfos.sort((a, b) => a.kva - b.kva);
    state.showNewTransfoModal = false;
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
  },
  deleteTransfo: (index) => {
    state.settings.transfos.splice(index, 1);
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
  },
  toggleNewConducteurModal: (show) => {
    state.showNewConducteurModal = show;
    renderApp();
  },
  addNewConducteur: (e) => {
    e.preventDefault();
    const nom = document.getElementById('newCondNom').value;
    const section = Number(document.getElementById('newCondSection').value);
    const nat = document.getElementById('newCondNat').value;
    const r = Number(document.getElementById('newCondR').value) || 0.35;
    const x = Number(document.getElementById('newCondX').value) || 0.36;
    const iMax = Number(document.getElementById('newCondImax').value) || 280;
    const code = `${nat}_${section}`;
    const pose = nat === 'AL' && section >= 150 ? 'SOUTERRAIN' : 'AÉRIEN NU';

    state.settings.conducteurs.push({ code, nom, section, nat, r, x, iMax, pose });
    state.settings.conducteurs.sort((a, b) => a.section - b.section);
    state.showNewConducteurModal = false;
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
  },
  deleteConducteur: (index) => {
    state.settings.conducteurs.splice(index, 1);
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
  },
  saveSeuils: (e) => {
    e.preventDefault();
    state.settings.seuils.tensionNominale = Number(document.getElementById('inputTensionNominale').value) || 30.0;
    state.settings.seuils.chuteTensionMax = Number(document.getElementById('inputChuteTensionMax').value) || 5.0;
    state.settings.seuils.cosPhi = Number(document.getElementById('inputCosPhi').value) || 0.90;
    try { localStorage.setItem('gdo_mt_settings', JSON.stringify(state.settings)); } catch (err) {}
    renderApp();
  },

  // Tables DBase
  selectTable: (tName) => {
    state.tableSelected = tName;
    state.tablePage = 1;
    state.tableSearch = '';
    renderApp();
  },
  setTableSearch: (q) => {
    state.tableSearch = q;
    state.tablePage = 1;
    renderApp();
  },
  setTablePage: (p) => {
    state.tablePage = Math.max(1, p);
    renderApp();
  },
  exportCurrentCsv: () => {
    const currentTable = fullTablesData[state.tableSelected];
    const rows = currentTable.rows;
    if (!rows || rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.tableSelected}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
  exportCurrentJson: () => {
    const currentTable = fullTablesData[state.tableSelected];
    const rows = currentTable.rows;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.tableSelected}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Recherche rapide globale
  openQuickSearch: () => {
    state.showQuickSearchModal = true;
    state.quickSearchQuery = '';
    renderApp();
    setTimeout(() => {
      document.getElementById('quickSearchInput')?.focus();
    }, 100);
  },
  closeQuickSearch: () => {
    state.showQuickSearchModal = false;
    renderApp();
  },
  handleQuickSearch: (q) => {
    state.quickSearchQuery = q;
    renderApp();
    const input = document.getElementById('quickSearchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(q.length, q.length);
    }
  },
  selectSearchResult: (type, id, depId) => {
    state.showQuickSearchModal = false;
    if (type === 'DEPART') {
      window.app.openDepart(id);
    } else {
      state.selectedDepartId = depId;
      state.activeTab = 'unifilaire';
      renderApp();
      window.app.selectNode(id);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  renderApp();
}
