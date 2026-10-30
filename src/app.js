/**
 * GDO-MT — Application Web de Gestion des Ouvrages Moyenne Tension
 * Wilaya de Guelma (24) — Direction de Distribution de l'Électricité (SDO)
 *
 * Interface GDO-MT :
 * - Navigation mobile dock (Accueil, Schéma MT, Parc Ouvrages, Carnet Terrain, Paramètres & Tables)
 * - Thème Clair haute visibilité pour agents de terrain
 * - HTML5 et JavaScript natifs, exécutés directement dans le navigateur (compatible GitHub Pages)
 */

import { departsSummary } from './data/departsSummary.js';
import { networkData, fullTablesData, getNodeDepartIndex, ensureNetworkData as loadNetworkData, ensureFullTablesData as loadFullTablesData } from './data/dataRepository.js';
import { formatNumber, escapeHtml, escapeJsString } from './utils/formatters.js';
import { DEFAULT_SETTINGS } from './config/defaultSettings.js';
import { renderTablesView, renderNewTransfoModal, renderNewConducteurModal } from './views/settingsViews.js';
import { renderQuickSearchModal } from './views/quickSearchView.js';
import { renderOuvragesView } from './views/ouvragesView.js';
import { renderTerrainView } from './views/terrainView.js';
import { renderSettingsView } from './views/settingsView.js';
let initialStorageWarning = '';

// --- RÉFÉRENTIEL DES PARAMÈTRES RÉSEAU MT ---


function loadStoredSettings() {
  try {
    const saved = localStorage.getItem('gdo_mt_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.transfos) && Array.isArray(parsed.conducteurs) && parsed.seuils) return parsed;
      initialStorageWarning = 'Les paramètres enregistrés sont invalides. Les valeurs par défaut sont utilisées.';
    }
  } catch (error) {
    initialStorageWarning = 'Impossible de lire les paramètres locaux. Les valeurs par défaut sont utilisées.';
  }
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function loadStoredInterventions() {
  try {
    const saved = localStorage.getItem('gdo_mt_interventions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
      initialStorageWarning = 'Le carnet de visites enregistré est invalide. Les données de démonstration sont utilisées.';
    }
  } catch (error) {
    initialStorageWarning = 'Impossible de lire le carnet de visites local. Les données de démonstration sont utilisées.';
  }
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
  selectedDepartId: '121H5C1',
  selectedAgency: 'ALL', // 'ALL' | '121' | '123' | '125' | '127'
  schemaAgencyInitialized: false,
  
  // Recherche rapide globale (Header)
  showQuickSearchModal: false,
  quickSearchQuery: '',

  // Schéma Unifilaire
  showJunctions: false,
  poseFilter: 'ALL', // 'ALL' | 'SOUT_HIGHLIGHT' | 'AER_ONLY'
  showPoseLegend: false,
  zoom: 1,
  pan: { x: 30, y: 70 },
  isDragging: false,
  dragMoved: false,
  dragStart: { x: 0, y: 0, startX: 0, startY: 0 },
  touchInitialDist: 0,
  touchInitialZoom: 1,
  touchInitialPan: { x: 30, y: 70 },
  touchCenter: { x: 0, y: 0 },
  selectedNode: null,
  selectedEdge: null,
  showBottomSheet: false,

  // Ouvrages (Parc MT)
  ouvragesFilterType: 'P', // 'P' (Postes HTA/BT) | 'J' (IACM) | 'T' (Transfos) | 'L' (Tronçons) | 'E' (Étoilements)
  ouvragesScope: 'DEPART', // 'DEPART' | 'ALL'
  ouvragesSearch: '',

  // Terrain & Visites (GDO-MT)
  interventions: loadStoredInterventions(),
  newVisitPosteId: '121P8036',
  newVisitPosteNom: 'Pge Bentabouche',
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

  // Tables Réseau & DBase
  tableSelected: 'POSTE_2025',
  tablePage: 1,
  tablePageSize: 15,
  tableSearch: '',
  storageWarning: initialStorageWarning,
  dataLoadError: '',
  networkDataError: ''
};

function persistLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    state.storageWarning = '';
    return true;
  } catch (error) {
    console.error('Échec de sauvegarde locale:', error);
    state.storageWarning = 'Sauvegarde locale impossible : les changements ne survivront pas à la fermeture du navigateur. Exportez vos données et vérifiez l’espace de stockage.';
    return false;
  }
}

function removeStoredValue(key) {
  try {
    localStorage.removeItem(key);
    state.storageWarning = '';
    return true;
  } catch (error) {
    console.error('Échec de suppression locale:', error);
    state.storageWarning = 'Impossible de modifier le stockage local du navigateur.';
    return false;
  }
}

// --- EN-TÊTE GDO-MT (TOP BAR) ---
function renderMobileTopBar() {
  return `
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2 shadow-xs">
      <div class="max-w-screen-2xl mx-auto flex items-center justify-between gap-3 md:gap-6">
        <!-- Logo & Identité GDO-MT -->
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-xs shadow-xs tracking-wider">
            GDO
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-sm md:text-base font-black tracking-tight text-slate-900 leading-none">GDO-MT</span>
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

// --- DOCK DE NAVIGATION GDO-MT (BOTTOM BAR) ---
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
      <div class="max-w-3xl mx-auto grid grid-cols-5 gap-2 md:gap-4">
        ${navItems.map(item => {
          const isActive = state.activeTab === item.id;
          return `
            <button
              onclick="window.app.setTab('${escapeJsString(item.id)}')"
              class="flex flex-col md:flex-row items-center justify-center gap-0 md:gap-2 py-1.5 md:py-2.5 px-1 md:px-4 rounded-xl transition-all cursor-pointer select-none ${
                isActive
                  ? 'text-blue-600 font-bold bg-blue-50/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }"
            >
              <span class="text-base md:text-lg leading-none mb-0.5 md:mb-0">${item.icon}</span>
              <span class="text-[10px] md:text-sm leading-tight truncate tracking-tight">${item.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    </nav>
  `;
}

// --- VUE 1 : ACCUEIL GDO-MT ---
function renderHomeView() {
  const totalKm = departsSummary.reduce((acc, d) => acc + d.totalLengthKm, 0).toFixed(1);
  const totalPostes = networkData.stats?.totalPostes || 2660;
  const totalPower = departsSummary.reduce((acc, d) => acc + d.totalPowerKva, 0);
  const totalArcs = networkData.stats?.totalArcs || departsSummary.reduce((acc, d) => acc + d.arcCount, 0);
  const totalIacms = networkData.stats?.totalIacms || 1638;
  const openIacms = networkData.stats?.openIacms || 39;
  const totalTransfos = networkData.stats?.totalTransformers || 2800;
  const totalTroncons = networkData.stats?.totalTroncons || 1372;

  const filteredDeparts = state.selectedAgency === 'ALL'
    ? departsSummary
    : departsSummary.filter(d => d.id.startsWith(state.selectedAgency));

  return `
    <div class="p-4 md:p-6 xl:p-8 space-y-4 md:space-y-6 max-w-screen-2xl mx-auto">
      <!-- Bannière principale GDO-MT -->
      <div class="p-4 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-100">
              GDO-MT &middot; Terrain connecté
            </span>
          </div>
          <span class="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-bold">
            ${filteredDeparts.length} Départs MT
          </span>
        </div>

        <div>
          <h1 class="text-lg font-black tracking-tight">Réseau Moyenne Tension HTA (30 kV)</h1>
          <p class="text-xs text-blue-100 leading-relaxed mt-0.5">
            Cartographie unifilaire, caractéristiques physiques du parc 2025 (2 660 postes, 1 638 IACM) et fiches d'inspection terrain.
          </p>
        </div>

        <!-- 3 Boutons d'Action Rapide de Terrain -->
        <div class="pt-1 grid grid-cols-3 gap-2 text-xs">
          <button
            onclick="window.app.openDepart('${escapeJsString(filteredDeparts[0]?.id || '127H1C3')}')"
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
            <span>Ouvrages (${formatNumber(totalPostes)})</span>
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

      <!-- 6 Compteurs Statistiques 2025 -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Linéaire Total</span>
          <div class="text-base font-mono font-bold text-slate-900">${totalKm} <span class="text-xs font-normal text-slate-500">km</span></div>
          <span class="text-[10px] text-slate-500">${formatNumber(totalArcs)} arcs de ligne</span>
        </div>

        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Postes HTA/BT</span>
          <div class="text-base font-mono font-bold text-amber-700">${formatNumber(totalPostes)}</div>
          <span class="text-[10px] text-slate-500">Postes recensés 2025</span>
        </div>

        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Transformateurs</span>
          <div class="text-base font-mono font-bold text-purple-700">${formatNumber(totalTransfos)}</div>
          <span class="text-[10px] text-slate-500">${formatNumber(totalPower)} kVA installés</span>
        </div>

        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Appareils IACM</span>
          <div class="text-base font-mono font-bold text-emerald-700">${formatNumber(totalIacms)}</div>
          <span class="text-[10px] text-rose-600 font-semibold">${openIacms} points de coupure (O)</span>
        </div>

        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Tronçons Réseau</span>
          <div class="text-base font-mono font-bold text-blue-700">${formatNumber(totalTroncons)}</div>
          <span class="text-[10px] text-slate-500">Aérien &amp; Souterrain</span>
        </div>

        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Départs MT 30kV</span>
          <div class="text-base font-mono font-bold text-indigo-700">${departsSummary.length}</div>
          <span class="text-[10px] text-slate-500">Wilaya de Guelma (24)</span>
        </div>
      </div>

      <!-- Liste Rapide des Départs MT -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">Départs MT &middot; Agence ${state.selectedAgency} (${filteredDeparts.length})</h2>
          <span class="text-[10px] text-slate-400">Touchez pour ouvrir le schéma</span>
        </div>

        <div class="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          ${filteredDeparts.map(d => `
            <div
              onclick="window.app.openDepart('${escapeJsString(d.id)}')"
              class="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between cursor-pointer"
            >
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-bold text-xs text-slate-900">${d.id}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">${d.posteCount} Postes</span>
                  ${d.openIacmCount > 0 ? `
                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      ${d.openIacmCount} IACM-O
                    </span>
                  ` : ''}
                </div>
                <span class="text-[11px] text-slate-500 block">${d.totalLengthKm} km &middot; ${d.arcCount} Arcs &middot; ${formatNumber(d.totalPowerKva)} kVA</span>
              </div>
              <span class="text-xs text-blue-600 font-bold px-2 py-1 rounded-lg bg-blue-50">&rarr;</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Postes Sources HTB / HTA (6 Postes Sources SDO) -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">Postes Sources HTB / HTA (SDO Guelma)</h2>
          <span class="text-[10px] text-slate-400">6 Postes Sources</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-purple-900 text-xs">125H3 &middot; NADOR</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-200/60 text-purple-900">60/30 kV</span>
            </div>
            <span class="text-[11px] text-slate-600 block mt-0.5">2 &times; 40 MVA &middot; 17 Départs rattachés</span>
          </div>

          <div class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-purple-900 text-xs">121H5 &middot; GUELMA VILLE</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-200/60 text-purple-900">60/30 kV</span>
            </div>
            <span class="text-[11px] text-slate-600 block mt-0.5">2 &times; 40 MVA &middot; 17 Départs rattachés</span>
          </div>

          <div class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-purple-900 text-xs">123H2 &middot; OUED ZENATI</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-200/60 text-purple-900">60/30 kV</span>
            </div>
            <span class="text-[11px] text-slate-600 block mt-0.5">2 &times; 20 MVA &middot; 8 Départs rattachés</span>
          </div>

          <div class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-purple-900 text-xs">127H1 &middot; BELKHEIR</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-200/60 text-purple-900">60/30 kV</span>
            </div>
            <span class="text-[11px] text-slate-600 block mt-0.5">2 &times; 40 MVA &middot; 5 Départs rattachés</span>
          </div>

          <div class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-purple-900 text-xs">125H2 &middot; MEDJEZ SFA</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-200/60 text-purple-900">90/30 kV</span>
            </div>
            <span class="text-[11px] text-slate-600 block mt-0.5">2 &times; 10 MVA &middot; 4 Départs rattachés</span>
          </div>

          <div class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-purple-900 text-xs">121H6 &middot; GUELMA NOUVEAU</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-200/60 text-purple-900">60/30 kV</span>
            </div>
            <span class="text-[11px] text-slate-600 block mt-0.5">2 &times; 40 MVA &middot; 2 Nouveaux Départs</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- VUE 2 : SCHÉMA UNIFILAIRE MT AVEC BOTTOM SHEET ---
function renderUnifilaireView() {
  if (!Object.keys(networkData.departs).length) {
    return '<div class="p-8 text-center text-sm font-semibold text-blue-800">' + escapeHtml(state.networkDataError || 'Chargement du réseau moyenne tension…') + '</div>';
  }

  // Le sélecteur du schéma doit respecter l'agence choisie dans l'en-tête.
  const availableDeparts = state.selectedAgency === 'ALL'
    ? departsSummary
    : departsSummary.filter(d => String(d.agency || d.id.slice(0, 3)) === state.selectedAgency);
  const selectedDepartIsAvailable = availableDeparts.some(d => d.id === state.selectedDepartId);
  if (!selectedDepartIsAvailable && availableDeparts.length) {
    state.selectedDepartId = availableDeparts[0].id;
  }

  const currentDepart = networkData.departs[state.selectedDepartId] || networkData.departs[availableDeparts[0]?.id] || networkData.departs['127H1C3'] || networkData.departs['125H3C20'];
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
  let rootNode = nodes.find(n => n.type === 'POSTE_SOURCE') || nodes.find(n => n.type === 'CELLULE');
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

  const unreachableNodeCount = nodes.filter(n => !visited.has(n.id)).length;
  const isolatedSeen = new Set();
  let disconnectedComponentCount = 0;
  let nextDisconnectedDepth = Math.max(0, ...Object.values(depthMap)) + 2;

  // Placer chaque composante déconnectée comme un petit graphe cohérent,
  // plutôt que d'attribuer une profondeur différente à chaque nœud isolé.
  for (const node of nodes) {
    if (visited.has(node.id) || isolatedSeen.has(node.id)) continue;
    disconnectedComponentCount += 1;
    const componentQueue = [{ id: node.id, depth: 0 }];
    const componentNodes = [];
    isolatedSeen.add(node.id);
    let componentMaxDepth = 0;

    while (componentQueue.length) {
      const current = componentQueue.shift();
      componentNodes.push(current);
      componentMaxDepth = Math.max(componentMaxDepth, current.depth);
      for (const neighbor of adj[current.id] || []) {
        if (visited.has(neighbor) || isolatedSeen.has(neighbor)) continue;
        isolatedSeen.add(neighbor);
        componentQueue.push({ id: neighbor, depth: current.depth + 1 });
      }
    }

    for (const item of componentNodes) {
      depthMap[item.id] = nextDisconnectedDepth + item.depth;
    }
    nextDisconnectedDepth += componentMaxDepth + 2;
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

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (let d = 0; d <= maxDepth; d++) {
    const group = depthGroups[d] || [];
    const totalH = group.length * ySpacing;
    const startY = 260 - totalH / 2;
    group.forEach((n, idx) => {
      const nx = 80 + d * xSpacing;
      const ny = startY + idx * ySpacing;
      if (nx < minX) minX = nx;
      if (nx > maxX) maxX = nx;
      if (ny < minY) minY = ny;
      if (ny > maxY) maxY = ny;

      calculatedNodes.push({
        ...n,
        x: nx,
        y: ny,
        depth: d,
        inPath: inPathSet.has(n.id)
      });
    });
  }

  if (isFinite(minX)) {
    window._currentCalculatedBounds = { minX, maxX, minY, maxY };
  }

  const nodePosMap = new Map();
  for (const n of calculatedNodes) nodePosMap.set(n.id, n);
  window._currentNodePosMap = nodePosMap;

  // Statistiques Souterrain / Aérien du départ MT sélectionné
  const soutArcs = renderEdges.filter(e => e.isSouterrain && !e.isVirtual);
  const aerArcs = renderEdges.filter(e => !e.isSouterrain && !e.isVirtual);
  const soutKm = (soutArcs.reduce((acc, e) => acc + (e.longueur || 0), 0) / 1000).toFixed(1);
  const aerKm = (aerArcs.reduce((acc, e) => acc + (e.longueur || 0), 0) / 1000).toFixed(1);

  // Détection des Remontées Aéro-Souterraines (RAS) : Nœuds reliant du souterrain et de l'aérien
  const nodeHasSout = new Set();
  const nodeHasAer = new Set();
  for (const e of renderEdges) {
    if (e.isVirtual) continue;
    if (e.isSouterrain) {
      nodeHasSout.add(e.from);
      nodeHasSout.add(e.to);
    } else {
      nodeHasAer.add(e.from);
      nodeHasAer.add(e.to);
    }
  }
  const rasNodeSet = new Set();
  for (const nid of nodeHasSout) {
    if (nodeHasAer.has(nid)) rasNodeSet.add(nid);
  }

  return `
    <div class="flex flex-col h-[calc(100vh-105px)] bg-slate-50 text-slate-800 relative overflow-hidden">
      <!-- Toolbar GDO-MT pour Schéma MT -->
      <div class="bg-white border-b border-slate-200 px-3 py-2 shrink-0 z-20 shadow-xs space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <select
              onchange="window.app.selectDepart(this.value)"
              class="bg-slate-50 text-slate-900 text-xs font-mono font-bold rounded-lg px-2 py-1.5 border border-slate-300 max-w-[170px] truncate"
            >
              ${availableDeparts.map(d => `
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
              onclick="window.app.togglePoseLegend()"
              class="px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                state.showPoseLegend ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-300 text-slate-600'
              }"
              title="Légende Souterrain / Aérien"
            >
              📖 Légende
            </button>
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

        <!-- Filtre rapide Tronçons MT : Tous / Souterrain / Aérien -->
        <div class="flex items-center gap-1.5 overflow-x-auto text-[11px] font-medium no-scrollbar pt-0.5">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">Tronçons :</span>
          <button
            onclick="window.app.setPoseFilter('ALL')"
            class="px-2.5 py-1 rounded-full border text-xs shrink-0 font-semibold transition-all ${
              state.poseFilter === 'ALL'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }"
          >
            Tous (${renderEdges.filter(e => !e.isVirtual).length})
          </button>
          <button
            onclick="window.app.setPoseFilter('SOUT_HIGHLIGHT')"
            class="px-2.5 py-1 rounded-full border text-xs shrink-0 font-semibold flex items-center gap-1 transition-all ${
              state.poseFilter === 'SOUT_HIGHLIGHT'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                : 'bg-indigo-50/80 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }"
          >
            <span>🚇 Souterrain</span>
            <span class="font-mono text-[10px] font-bold ${state.poseFilter === 'SOUT_HIGHLIGHT' ? 'text-indigo-100' : 'text-indigo-600'}">(${soutKm} km)</span>
          </button>
          <button
            onclick="window.app.setPoseFilter('AER_ONLY')"
            class="px-2.5 py-1 rounded-full border text-xs shrink-0 font-semibold flex items-center gap-1 transition-all ${
              state.poseFilter === 'AER_ONLY'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                : 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100'
            }"
          >
            <span>⚡ Aérien</span>
            <span class="font-mono text-[10px] font-bold ${state.poseFilter === 'AER_ONLY' ? 'text-amber-100' : 'text-amber-600'}">(${aerKm} km)</span>
          </button>
        </div>
      </div>

      ${disconnectedComponentCount > 0 ? `
        <div role="alert" class="shrink-0 border-b border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          Avertissement topologique : ${disconnectedComponentCount} composante(s) séparée(s), ${unreachableNodeCount} nœud(s) non raccordé(s) à la racine de ce départ. Le traçage amont peut être incomplet ; vérifiez les données de référence.
        </div>
      ` : ''}
      <!-- Canvas SVG Interactif -->
      <div
        id="svgContainer"
        class="relative flex-1 bg-white overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style="background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 24px 24px; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;"
        onmousedown="window.app.handleMouseDown(event)"
        onmousemove="window.app.handleMouseMove(event)"
        onmouseup="window.app.handleMouseUp(event)"
        onmouseleave="window.app.handleMouseUp(event)"
        ontouchstart="window.app.handleTouchStart(event)"
        ontouchmove="window.app.handleTouchMove(event)"
        ontouchend="window.app.handleTouchEnd(event)"
        ontouchcancel="window.app.handleTouchEnd(event)"
      >
        <!-- Légende Flottante Interactive Souterrain / Aérien -->
        ${state.showPoseLegend ? `
          <div class="absolute top-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3 shadow-xl z-20 max-w-[270px] text-xs space-y-2 pointer-events-auto">
            <div class="flex items-center justify-between font-bold text-slate-800 text-[11px] pb-1 border-b border-slate-100">
              <span class="flex items-center gap-1">🏷️ Conventions Tronçons MT</span>
              <button onclick="window.app.togglePoseLegend()" class="text-slate-400 hover:text-slate-600 font-bold px-1 cursor-pointer">&times;</button>
            </div>
            <div class="space-y-1.5 text-[10px]">
              <div class="flex items-center gap-2">
                <div class="w-7 h-1.5 bg-slate-700 rounded-full shrink-0"></div>
                <div class="text-slate-700">
                  <strong>⚡ Ligne Aérienne</strong> (Trait plein continu &middot; NU/AL)
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-2.5 border-b-2 border-dashed border-indigo-700 bg-indigo-100 rounded-xs shrink-0"></div>
                <div class="text-indigo-900">
                  <strong>🚇 Câble Souterrain</strong> (Fourreau + tirets indigo &middot; URSS/TNSS)
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full border border-purple-500 bg-purple-100 flex items-center justify-center text-[7px] font-bold text-purple-700 shrink-0">RAS</div>
                <div class="text-purple-900">
                  <strong>Remontée Aéro-Souterraine</strong> (Transition support / sol)
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[9px] font-bold shrink-0">SOUT T.128</span>
                <div class="text-slate-600">
                  Numéro de Tronçon & longueur en mètres
                </div>
              </div>
            </div>
            <div class="pt-1 border-t border-slate-100 text-[9px] text-slate-400">
              💡 Touchez n'importe quel segment sur le schéma pour consulter sa fiche détaillée.
            </div>
          </div>
        ` : ''}

        <svg
          id="networkSvg"
          class="w-full h-full select-none block"
          style="width: 100%; height: 100%; touch-action: none; overflow: visible !important;"
        >
          <!-- Conteneur Pan & Zoom Infini (sans clipping Android) -->
          <g
            id="networkViewport"
            transform="translate(${state.pan.x}, ${state.pan.y}) scale(${state.zoom})"
          >
            <!-- Arcs MT (Tronçons Souterrains & Aériens) -->
            <g class="edges">
            ${renderEdges.map(edge => {
              const u = nodePosMap.get(edge.from);
              const v = nodePosMap.get(edge.to);
              if (!u || !v) return '';

              const isEdgeSelected = state.selectedEdge?.id === edge.id;
              const isInPath = u.inPath && v.inPath;
              const isVirtual = !!edge.isVirtual;
              const isSout = !!edge.isSouterrain && !isVirtual;

              let isDimmed = false;
              if (!isVirtual && state.poseFilter === 'SOUT_HIGHLIGHT' && !isSout) {
                isDimmed = true;
              } else if (!isVirtual && state.poseFilter === 'AER_ONLY' && isSout) {
                isDimmed = true;
              }

              const edgeOpacity = isVirtual ? '0.75' : (isDimmed ? '0.12' : (isEdgeSelected || isInPath ? '1' : '0.9'));
              const cx = (u.x + v.x) / 2;
              const cy = (u.y + v.y) / 2;

              let strokeColor = isVirtual ? '#94a3b8' : (isInPath ? '#d97706' : (edge.nat_cond === 'CU' ? '#c2410c' : '#334155'));
              if (isEdgeSelected) strokeColor = '#2563eb';
              const strokeWidth = isVirtual ? 1.5 : (isInPath ? 3.5 : (isEdgeSelected ? 3.2 : (edge.section >= 117 ? 2.5 : 1.6)));

              return `
                <g class="cursor-pointer" onclick="window.app.selectEdge('${escapeJsString(edge.id)}')" opacity="${edgeOpacity}">
                  ${isVirtual ? `
                    <!-- Ancrage graphique virtuel : ce trait n'est pas une liaison électrique réelle. -->
                    <line
                      x1="${u.x}" y1="${u.y}" x2="${v.x}" y2="${v.y}"
                      stroke="#94a3b8"
                      stroke-width="1.5"
                      stroke-dasharray="2 5"
                    />
                  ` : isSout ? `
                    <!-- Fourreau / Tranchée souterraine (halo) -->
                    <line
                      x1="${u.x}" y1="${u.y}" x2="${v.x}" y2="${v.y}"
                      stroke="${isEdgeSelected ? '#3b82f6' : (state.poseFilter === 'SOUT_HIGHLIGHT' ? '#6366f1' : '#818cf8')}"
                      stroke-width="${isEdgeSelected ? '7' : '5'}"
                      stroke-linecap="round"
                      opacity="${isEdgeSelected ? '0.8' : '0.45'}"
                    />
                    <!-- Câble HTA souterrain (tirets d'ingénierie Sonelgaz) -->
                    <line
                      x1="${u.x}" y1="${u.y}" x2="${v.x}" y2="${v.y}"
                      stroke="${isEdgeSelected ? '#1d4ed8' : (isInPath ? '#d97706' : '#4338ca')}"
                      stroke-width="${isEdgeSelected ? '3' : '2.2'}"
                      stroke-dasharray="6 3.5"
                      stroke-linecap="butt"
                    />
                  ` : `
                    <!-- Ligne aérienne MT (trait continu) -->
                    <line
                      x1="${u.x}" y1="${u.y}" x2="${v.x}" y2="${v.y}"
                      stroke="${strokeColor}"
                      stroke-width="${strokeWidth}"
                      stroke-linecap="round"
                    />
                  `}

                  <!-- Badge & Libellé Tronçon / Longueur -->
                  ${state.zoom >= 0.65 ? `
                    <g transform="translate(${cx}, ${cy})">
                      ${isVirtual ? `
                        <rect x="-46" y="-12" width="92" height="15" rx="3.5" fill="#f1f5f9" stroke="#94a3b8" stroke-width="0.8" />
                        <text x="0" y="-1.5" fill="#475569" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">ANCRAGE VIRTUEL</text>
                      ` : isSout ? `
                        <rect
                          x="-35" y="-12" width="70" height="15" rx="3.5"
                          fill="${isEdgeSelected ? '#1e3a8a' : '#e0e7ff'}"
                          stroke="${isEdgeSelected ? '#60a5fa' : '#818cf8'}"
                          stroke-width="0.8"
                        />
                        <text
                          x="0" y="-1.5"
                          fill="${isEdgeSelected ? '#ffffff' : '#3730a3'}"
                          font-size="7.5"
                          font-family="monospace"
                          font-weight="bold"
                          text-anchor="middle"
                        >
                          SOUT ${edge.troncon ? 'T.' + edge.troncon : ''} ${edge.longueur > 0 ? '· ' + edge.longueur + 'm' : ''}
                        </text>
                      ` : `
                        ${(edge.troncon || state.zoom >= 0.8) && edge.longueur > 0 ? `
                          <rect
                            x="-28" y="-11" width="56" height="14" rx="3"
                            fill="${isEdgeSelected ? '#1e293b' : '#f8fafc'}"
                            stroke="${isEdgeSelected ? '#94a3b8' : '#cbd5e1'}"
                            stroke-width="0.7"
                            opacity="0.9"
                          />
                          <text
                            x="0" y="-1"
                            fill="${isEdgeSelected ? '#f8fafc' : '#475569'}"
                            font-size="7.5"
                            font-family="monospace"
                            font-weight="bold"
                            text-anchor="middle"
                          >
                            ${edge.troncon ? 'T.' + edge.troncon + ' ' : ''}${edge.longueur}m
                          </text>
                        ` : ''}
                      `}
                    </g>
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
              let r = node.type === 'POSTE_SOURCE' ? 15 : (node.type === 'POSTE_HTA_BT' ? 12 : (node.type === 'ETOILEMENT' ? 9 : (node.type === 'INTERRUPTEUR_AERIEN' ? 9 : 5)));

              let fillColor = '#64748b';
              let strokeColor = '#334155';
              if (node.type === 'POSTE_SOURCE') {
                fillColor = node.isVirtual ? '#e2e8f0' : '#7c3aed';
                strokeColor = node.isVirtual ? '#64748b' : '#5b21b6';
              } else if (node.type === 'POSTE_HTA_BT') {
                fillColor = node.meta?.typePoste === 'MS' ? '#d97706' : '#ea580c';
                strokeColor = '#78350f';
              } else if (node.type === 'ETOILEMENT') {
                fillColor = '#0d9488';
                strokeColor = '#115e59';
              } else if (node.type === 'INTERRUPTEUR_AERIEN') {
                fillColor = node.meta?.isOpen ? '#fef2f2' : '#059669';
                strokeColor = node.meta?.isOpen ? '#dc2626' : '#047857';
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
                <g transform="translate(${node.x}, ${node.y})" class="cursor-pointer" onclick="window.app.selectNode('${escapeJsString(node.id)}')">
                  ${(isSelected || isRoot) ? `
                    <circle r="${r + 5}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="3 3"/>
                  ` : ''}

                  ${node.type === 'POSTE_SOURCE' ? `
                    <circle r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
                    <circle r="${r - 5}" fill="none" stroke="#ffffff" stroke-width="1.5"/>
                    <text y="3" fill="${node.isVirtual ? '#475569' : '#ffffff'}" font-size="9" font-weight="bold" text-anchor="middle">${node.isVirtual ? 'V' : 'HT'}</text>
                  ` : node.type === 'POSTE_HTA_BT' ? `
                    <rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" rx="3.5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
                    <text y="3.5" fill="#ffffff" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">T</text>
                  ` : node.type === 'ETOILEMENT' ? `
                    <polygon points="0,${-r} ${r},${r} ${-r},${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
                  ` : node.type === 'INTERRUPTEUR_AERIEN' ? `
                    ${node.meta?.isOpen ? `
                      <circle r="${r}" fill="#fee2e2" stroke="#dc2626" stroke-width="2" stroke-dasharray="2 2"/>
                      <line x1="-4" y1="-4" x2="4" y2="4" stroke="#dc2626" stroke-width="2"/>
                      <line x1="-4" y1="4" x2="4" y2="-4" stroke="#dc2626" stroke-width="2"/>
                      <text x="0" y="-12" fill="#dc2626" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">OUVERT</text>
                    ` : `
                      <circle r="${r - 2}" fill="#059669" stroke="#047857" stroke-width="1.5"/>
                      <text y="2.5" fill="#ffffff" font-size="7.5" font-weight="bold" text-anchor="middle">I</text>
                    `}
                  ` : `
                    <circle r="${state.showJunctions ? r : 2}" fill="${state.showJunctions ? fillColor : '#94a3b8'}" stroke="${strokeColor}" stroke-width="${state.showJunctions ? 1 : 0}"/>
                  `}

                  <!-- Indicateur Remontée Aéro-Souterraine (RAS) -->
                  ${rasNodeSet.has(node.id) ? `
                    <g transform="translate(${r + 6}, ${-r})">
                      <rect x="-9" y="-7" width="18" height="11" rx="2.5" fill="#f3e8ff" stroke="#a855f7" stroke-width="0.8"/>
                      <text x="0" y="1" fill="#7e22ce" font-size="6.5" font-weight="bold" font-family="monospace" text-anchor="middle">RAS</text>
                    </g>
                  ` : ''}

                  ${(node.type !== 'JONCTION' || state.showJunctions || state.zoom > 1.2 || isSelected) ? `
                    <text x="0" y="${r + 12}" fill="${isSelected ? '#1d4ed8' : (node.meta?.isOpen ? '#dc2626' : '#0f172a')}" font-size="9.5" font-family="monospace" font-weight="${node.type === 'POSTE_HTA_BT' || isSelected ? 'bold' : 'normal'}" text-anchor="middle">
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
        </g>
      </svg>

        <!-- Contrôles Flottants Zoom Tactile -->
        <div class="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
          <button onclick="window.app.zoomCanvas(0.2)" class="w-9 h-9 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-base cursor-pointer">+</button>
          <button onclick="window.app.zoomCanvas(-0.2)" class="w-9 h-9 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-base cursor-pointer">&minus;</button>
        </div>
      </div>

      <!-- Bottom Sheet tactile GDO-MT (Fiche Ouvrage & Action Visite) -->
      ${state.showBottomSheet && (state.selectedNode || state.selectedEdge) ? `
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl p-4 z-30 max-h-[60vh] overflow-y-auto space-y-3">
          <div class="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span class="text-[10px] text-slate-400 font-mono uppercase block">
                ${state.selectedEdge ? (state.selectedEdge.isSouterrain ? '🚇 Tronçon MT Souterrain' : '⚡ Tronçon MT Aérien') : (state.selectedNode?.type === 'POSTE_HTA_BT' ? 'Poste HTA/BT' : (state.selectedNode?.type === 'INTERRUPTEUR_AERIEN' ? 'Appareil IACM' : 'Fiche Ouvrage'))}
              </span>
              <strong class="font-mono text-base text-slate-900">${state.selectedEdge ? (state.selectedEdge.troncon ? `Tronçon N° ${state.selectedEdge.troncon}` : state.selectedEdge.id) : (state.selectedNode?.id)}</strong>
              ${state.selectedNode?.meta?.nom ? `
                <div class="text-xs font-bold text-amber-700">${escapeHtml(state.selectedNode.meta.nom)}</div>
              ` : ''}
            </div>
            <button onclick="window.app.closeBottomSheet()" class="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-slate-100 font-bold cursor-pointer">Fermer</button>
          </div>

          ${state.selectedNode ? `
            ${rasNodeSet.has(state.selectedNode.id) ? `
              <div class="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-mono text-purple-900 flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">RAS</span>
                <div>
                  <strong class="block">Remontée Aéro-Souterraine (RAS)</strong>
                  <span class="text-[10px] text-purple-700">Point de transition technique entre tronçons souterrains et aériens.</span>
                </div>
              </div>
            ` : ''}

            ${state.selectedNode.type === 'POSTE_HTA_BT' ? `
              <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div><span class="text-slate-400 block text-[9px]">Tension Service</span><span class="text-slate-900 font-bold">30 kV / 400 V</span></div>
                <div><span class="text-slate-400 block text-[9px]">Puissance Installée (PI)</span><span class="text-amber-700 font-bold">${state.selectedNode.meta?.p_instal || 0} kVA</span></div>
                <div><span class="text-slate-400 block text-[9px]">Type de Poste</span><span class="text-slate-900">${state.selectedNode.meta?.typePosteLabel || (state.selectedNode.meta?.typePoste === 'MS' ? 'Cabine Maçonnée (MS)' : 'Aérien sur Poteau (MA)')}</span></div>
                <div><span class="text-slate-400 block text-[9px]">Fonction</span><span class="text-slate-900">${state.selectedNode.meta?.fonctionLabel || 'Abonné (AB)'}</span></div>
                <div><span class="text-slate-400 block text-[9px]">Protection MT</span><span class="text-slate-900">${state.selectedNode.meta?.protection || 'Sectionneur Fusibles'}</span></div>
                <div><span class="text-slate-400 block text-[9px]">Commune / Localité</span><span class="text-slate-900 truncate block">${escapeHtml(state.selectedNode.meta?.localite || 'Wilaya de Guelma')}</span></div>
              </div>

              ${state.selectedNode.meta?.transformers && state.selectedNode.meta.transformers.length > 0 ? `
                <div class="space-y-1.5 pt-1">
                  <span class="text-[11px] font-bold text-slate-700 block">Transformateurs MT/BT (${state.selectedNode.meta.transformers.length}) :</span>
                  <div class="space-y-1">
                    ${state.selectedNode.meta.transformers.map((trf, tIdx) => `
                      <div class="p-2 rounded-lg bg-purple-50/70 border border-purple-200 text-xs font-mono flex items-center justify-between">
                        <div>
                          <strong class="text-purple-950">${trf.puissanceKva || state.selectedNode.meta?.p_instal} kVA</strong>
                          <span class="text-[11px] text-slate-600 block">${trf.marque || 'Constructeur agréé'} ${trf.numSerie ? '&middot; N° ' + trf.numSerie : ''}</span>
                        </div>
                        <div class="text-right text-[10px] text-slate-500">
                          <span>${trf.anneeFab ? 'Année ' + trf.anneeFab : 'Service 30kV'}</span>
                          ${trf.iNomMT ? `<span class="block text-purple-700 font-bold">${trf.iNomMT}A MT / ${trf.iNomBT}A BT</span>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="pt-1 flex gap-2">
                <button
                  onclick="window.app.createInterventionForPoste('${escapeJsString(state.selectedNode.id)}', '${escapeJsString(state.selectedNode.meta?.nom || state.selectedNode.id)}')"
                  class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs text-center cursor-pointer"
                >
                  📝 Créer Fiche de Visite de Terrain
                </button>
              </div>
            ` : state.selectedNode.type === 'INTERRUPTEUR_AERIEN' ? `
              <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div><span class="text-slate-400 block text-[9px]">Position Réseau</span><span class="${state.selectedNode.meta?.isOpen ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}">${state.selectedNode.meta?.positionLabel || (state.selectedNode.meta?.isOpen ? 'OUVERT (Coupure)' : 'FERMÉ (Passage)')}</span></div>
                <div><span class="text-slate-400 block text-[9px]">Mode d'Actionnement</span><span class="text-slate-900 font-bold">${state.selectedNode.meta?.mode || 'Manuel (IACM-M)'}</span></div>
                <div><span class="text-slate-400 block text-[9px]">Intensité Nominale</span><span class="text-slate-900">${state.selectedNode.meta?.intensiteNominale || 200} A</span></div>
                <div><span class="text-slate-400 block text-[9px]">Tension Isolement</span><span class="text-slate-900">36.0 kV (Service 30 kV)</span></div>
                <div><span class="text-slate-400 block text-[9px]">Asservissement</span><span class="text-slate-900">${state.selectedNode.meta?.asserv || 'Non asservi'}</span></div>
                <div><span class="text-slate-400 block text-[9px]">Date de MES</span><span class="text-slate-900">${state.selectedNode.meta?.dateMES || '01-01-1988'}</span></div>
              </div>
            ` : `
              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono">
                <span class="text-slate-500 block text-[10px]">Type d'élément</span>
                <strong class="text-slate-800">${state.selectedNode.type} &middot; ${state.selectedNode.id}</strong>
              </div>
            `}
          ` : ''}

          ${state.selectedEdge ? `
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                  state.selectedEdge.isVirtual
                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                    : state.selectedEdge.isSouterrain
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                }">
                  ${state.selectedEdge.isVirtual ? 'ANCRAGE VIRTUEL — PAS DE LIAISON PHYSIQUE' : state.selectedEdge.isSouterrain ? 'CÂBLE SOUTERRAIN (HTA 30 kV)' : 'LIGNE AÉRIENNE (HTA 30 kV)'}
                </span>
                <span class="text-xs font-mono font-bold ${state.selectedEdge.isVirtual ? 'text-slate-600 bg-slate-100 border-slate-300' : 'text-emerald-700 bg-emerald-50 border-emerald-200'} px-2 py-0.5 rounded border">
                  ${state.selectedEdge.isVirtual ? 'Non physique' : state.selectedEdge.longueur + ' mètres'}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span class="text-slate-400 block text-[9px]">Numéro de Tronçon</span>
                  <span class="text-slate-900 font-bold">${state.selectedEdge.troncon ? 'Tronçon ' + escapeHtml(state.selectedEdge.troncon) : 'Non numéroté'}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px]">Structure Technique</span>
                  <span class="text-slate-900 font-bold">${escapeHtml(state.selectedEdge.structLabel || state.selectedEdge.structRaw || state.selectedEdge.struct)}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px]">Conducteur & Métal</span>
                  <span class="text-slate-900 font-bold">${state.selectedEdge.nat_cond} ${state.selectedEdge.section} mm²</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px]">Tension Nominale</span>
                  <span class="text-slate-900 font-bold">${state.selectedEdge.tension || 30} kV</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px]">Nœud Amont (De)</span>
                  <span class="text-slate-900 font-bold truncate block">${state.selectedEdge.from}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px]">Nœud Aval (Vers)</span>
                  <span class="text-slate-900 font-bold truncate block">${state.selectedEdge.to}</span>
                </div>
                ${state.selectedEdge.an_mes ? `
                  <div>
                    <span class="text-slate-400 block text-[9px]">Date de MES</span>
                    <span class="text-slate-900 font-bold">${state.selectedEdge.an_mes}</span>
                  </div>
                ` : ''}
                <div>
                  <span class="text-slate-400 block text-[9px]">Circuit Parallèle</span>
                  <span class="text-slate-900 font-bold">C.Par ${state.selectedEdge.cPar || 1}</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// --- VUE 3 : OUVRAGES (CATALOGUE DES OUVRAGES GDO-MT) ---
// --- VUE 4 : TERRAIN & VISITES (CARNET DE TERRAIN GDO-MT) ---
// --- VUE 5 : PARAMÈTRES & DONNÉES DBASE (GESTION RÉFÉRENTIELS) ---
// --- VUE TABLES DBASE (12 TABLES EXTRAITES D'ORIGINE) ---
// --- MODAL RECHERCHE RAPIDE GLOBALE ---
// --- MISE À JOUR TRANSFORMATION DU SCHÉMA SVG (PAN & ZOOM) ---
function updateSvgTransform() {
  const g = document.getElementById('networkViewport');
  if (g) {
    g.setAttribute('transform', `translate(${state.pan.x}, ${state.pan.y}) scale(${state.zoom})`);
    g.style.transform = '';
    g.style.transformOrigin = '';
  }
}

// --- ATTACHEMENT DES ÉVÉNEMENTS TACTILES NON-PASSIFS SUR LE SCHÉMA ---
function attachSchemaCanvasListeners() {
  const container = document.getElementById('svgContainer');
  if (!container) return;

  // Enlever d'anciens listeners si existants pour éviter les doublons
  container.removeEventListener('touchstart', window.app.handleTouchStart);
  container.removeEventListener('touchmove', window.app.handleTouchMove);
  container.removeEventListener('touchend', window.app.handleTouchEnd);
  container.removeEventListener('touchcancel', window.app.handleTouchEnd);
  container.removeEventListener('wheel', window.app.handleWheel);

  // Attacher avec { passive: false } pour autoriser e.preventDefault() sur mobile
  container.addEventListener('touchstart', window.app.handleTouchStart, { passive: false });
  container.addEventListener('touchmove', window.app.handleTouchMove, { passive: false });
  container.addEventListener('touchend', window.app.handleTouchEnd, { passive: false });
  container.addEventListener('touchcancel', window.app.handleTouchEnd, { passive: false });
  container.addEventListener('wheel', window.app.handleWheel, { passive: false });
}

// --- RENDU GLOBAL SPA ---
export function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  let viewHtml = '';
  if (state.activeTab === 'home') viewHtml = renderHomeView();
  else if (state.activeTab === 'unifilaire') viewHtml = renderUnifilaireView();
  else if (state.activeTab === 'ouvrages') viewHtml = renderOuvragesView({ state, networkData, fullTablesData, getNodeDepartIndex, escapeHtml, escapeJsString, formatNumber });
  else if (state.activeTab === 'terrain') viewHtml = renderTerrainView({ state, networkData, escapeHtml, escapeJsString });
  else if (state.activeTab === 'settings') viewHtml = renderSettingsView({ state, fullTablesData, escapeHtml, formatNumber });

  root.innerHTML = `
    <div class="min-h-screen bg-slate-50 text-slate-900 pb-20 flex flex-col antialiased">
      ${renderMobileTopBar()}
      ${state.storageWarning ? '<div role="alert" class="mx-3 mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">' + escapeHtml(state.storageWarning) + '</div>' : ''}
      <main class="flex-1">
        ${viewHtml}
      </main>
      ${renderMobileBottomBar()}

      <!-- Modals Flottantes -->
      ${renderQuickSearchModal({ state, departsSummary, fullTablesData, networkData, getNodeDepartIndex, escapeHtml, escapeJsString })}
      ${renderNewTransfoModal(state)}
      ${renderNewConducteurModal(state)}
    </div>
  `;

  // Initialisation des écouteurs tactiles du schéma interactif
  if (state.activeTab === 'unifilaire') {
    attachSchemaCanvasListeners();
  }
}


// --- MÉTHODES GLOBALES ACCESSIBLES ---
window.app = {
  setTab: (tabId) => {
    if (tabId === 'unifilaire' && !state.schemaAgencyInitialized) {
      departsSummary.sort((a, b) => String(a.id || '').localeCompare(String(b.id || ''), 'fr', { numeric: true, sensitivity: 'base' }));
      state.selectedAgency = '121';
      state.selectedDepartId = departsSummary.find(d => String(d.agency || d.id.slice(0, 3)) === '121')?.id || '121H5C1';
      state.selectedNode = null;
      state.selectedEdge = null;
      state.showBottomSheet = false;
      state.schemaAgencyInitialized = true;
    }
    state.activeTab = tabId;
    renderApp();
    if (['unifilaire', 'ouvrages', 'terrain'].includes(tabId)) {
      void loadNetworkData(state, renderApp).then(() => {
        if (tabId === 'unifilaire') setTimeout(() => window.app.fitView(), 60);
      });
    }
    // Le catalogue des ouvrages utilise aussi les tables embarquées (IACM,
    // transformateurs et tronçons), indépendamment de la recherche rapide.
    if (tabId === 'ouvrages') void loadFullTablesData(state, renderApp);
  },
  setAgency: (agency) => {
    state.selectedAgency = agency;
    // Une sélection explicite dans l'en-tête doit prévaloir sur l'agence initiale par défaut.
    state.schemaAgencyInitialized = true;
    if (agency !== 'ALL') {
      const currentSummary = departsSummary.find(d => d.id === state.selectedDepartId);
      const currentAgency = currentSummary ? String(currentSummary.agency || currentSummary.id.slice(0, 3)) : '';
      if (currentAgency !== agency) {
        const firstDepart = departsSummary.find(d => String(d.agency || d.id.slice(0, 3)) === agency);
        if (firstDepart) {
          state.selectedDepartId = firstDepart.id;
          state.selectedNode = null;
          state.selectedEdge = null;
          state.showBottomSheet = false;
        }
      }
    }
    renderApp();
    if (state.activeTab === 'unifilaire') {
      void loadNetworkData(state, renderApp).then(() => setTimeout(() => window.app.fitView(), 60));
    }
  },
  openDepart: (depId) => {
    const targetSummary = departsSummary.find(item => item.id === depId);
    if (!targetSummary) return;
    state.selectedDepartId = depId;
    state.selectedAgency = String(targetSummary.agency || depId.slice(0, 3));
    state.schemaAgencyInitialized = true;
    state.activeTab = 'unifilaire';
    state.selectedNode = null;
    state.selectedEdge = null;
    state.showBottomSheet = false;
    renderApp();
    void loadNetworkData(state, renderApp).then(() => {
      if (state.activeTab === 'unifilaire') setTimeout(() => window.app.fitView(), 60);
    });
  },
  selectDepart: (depId) => {
    state.selectedDepartId = depId;
    state.selectedNode = null;
    state.selectedEdge = null;
    state.showBottomSheet = false;
    renderApp();
    void loadNetworkData(state, renderApp).then(() => {
      if (state.activeTab === 'unifilaire') setTimeout(() => window.app.fitView(), 60);
    });
  },
  toggleJunctions: () => {
    state.showJunctions = !state.showJunctions;
    renderApp();
  },
  zoomCanvas: (delta) => {
    state.zoom = Math.min(Math.max(0.15, state.zoom + delta), 4.0);
    updateSvgTransform();
  },
  fitView: () => {
    const container = document.getElementById('svgContainer');
    const width = container ? container.clientWidth : (window.innerWidth || 390);
    const height = container ? container.clientHeight : 500;

    if (window._currentCalculatedBounds && isFinite(window._currentCalculatedBounds.minX)) {
      const b = window._currentCalculatedBounds;
      const graphW = Math.max(b.maxX - b.minX + 160, 200);
      const graphH = Math.max(b.maxY - b.minY + 160, 200);

      // Pour mobile (ou desktop) : cadrage initial parfait
      const scaleX = (width - 40) / graphW;
      const scaleY = (height - 40) / graphH;
      // On conserve un zoom lisible :
      const autoZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.15), 1.0);

      state.zoom = autoZoom;
      state.pan = {
        x: 30,
        y: Math.max(20, (height - (b.maxY - b.minY) * autoZoom) / 2 - b.minY * autoZoom)
      };
    } else {
      state.zoom = 0.8;
      state.pan = { x: 30, y: 70 };
    }
    updateSvgTransform();
  },
  selectNode: (nodeId) => {
    if (state.dragMoved) return;
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
    if (state.dragMoved) return;
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
  setPoseFilter: (filter) => {
    state.poseFilter = filter;
    renderApp();
  },
  togglePoseLegend: () => {
    state.showPoseLegend = !state.showPoseLegend;
    renderApp();
  },

  // --- GESTION TACTILE MOBILE (PAN ET PINCH-TO-ZOOM À 2 DOIGTS) ---
  handleTouchStart: (e) => {
    if (!e.touches || e.touches.length === 0) return;
    state.dragMoved = false;

    if (e.touches.length === 1) {
      // 1 doigt : déplacement (pan)
      const touch = e.touches[0];
      state.isDragging = true;
      state.dragStart = {
        x: touch.clientX - state.pan.x,
        y: touch.clientY - state.pan.y,
        startX: touch.clientX,
        startY: touch.clientY
      };
    } else if (e.touches.length >= 2) {
      // 2 doigts : zoom par pincement (pinch-to-zoom)
      state.isDragging = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      state.touchInitialDist = dist > 0 ? dist : 1;
      state.touchInitialZoom = state.zoom;
      state.touchInitialPan = { x: state.pan.x, y: state.pan.y };
      state.touchCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    }
  },

  handleTouchMove: (e) => {
    if (!e.touches || e.touches.length === 0) return;
    if (e.cancelable) {
      e.preventDefault(); // Empêche le scroll de page ou le rafraîchissement natif
    }

    if (e.touches.length === 1 && state.isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - state.dragStart.startX;
      const dy = touch.clientY - state.dragStart.startY;
      if (Math.hypot(dx, dy) > 4) {
        state.dragMoved = true;
      }
      state.pan.x = touch.clientX - state.dragStart.x;
      state.pan.y = touch.clientY - state.dragStart.y;
      updateSvgTransform();
    } else if (e.touches.length >= 2) {
      state.dragMoved = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = currentDist / (state.touchInitialDist || 1);
      const targetZoom = Math.min(Math.max(0.2, state.touchInitialZoom * factor), 3.5);

      const currentCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };

      const zoomRatio = targetZoom / state.touchInitialZoom;
      state.pan.x = currentCenter.x - (state.touchCenter.x - state.touchInitialPan.x) * zoomRatio;
      state.pan.y = currentCenter.y - (state.touchCenter.y - state.touchInitialPan.y) * zoomRatio;
      state.zoom = targetZoom;
      updateSvgTransform();
    }
  },

  handleTouchEnd: (e) => {
    if (e.touches && e.touches.length === 1) {
      // Reprise fluide du pan à 1 doigt
      const touch = e.touches[0];
      state.isDragging = true;
      state.dragStart = {
        x: touch.clientX - state.pan.x,
        y: touch.clientY - state.pan.y,
        startX: touch.clientX,
        startY: touch.clientY
      };
    } else if (!e.touches || e.touches.length === 0) {
      state.isDragging = false;
      setTimeout(() => {
        state.dragMoved = false;
      }, 80);
    }
  },

  // --- GESTION SOURIS DESKTOP ---
  handleMouseDown: (e) => {
    if (e.button !== 0) return;
    state.isDragging = true;
    state.dragMoved = false;
    state.dragStart = {
      x: e.clientX - state.pan.x,
      y: e.clientY - state.pan.y,
      startX: e.clientX,
      startY: e.clientY
    };
  },
  handleMouseMove: (e) => {
    if (!state.isDragging) return;
    const dx = e.clientX - state.dragStart.startX;
    const dy = e.clientY - state.dragStart.startY;
    if (Math.hypot(dx, dy) > 4) {
      state.dragMoved = true;
    }
    state.pan.x = e.clientX - state.dragStart.x;
    state.pan.y = e.clientY - state.dragStart.y;
    updateSvgTransform();
  },
  handleMouseUp: () => {
    state.isDragging = false;
    setTimeout(() => {
      state.dragMoved = false;
    }, 80);
  },
  handleWheel: (e) => {
    if (e.cancelable) e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const targetZoom = Math.min(Math.max(0.2, state.zoom * zoomFactor), 3.5);

    const rect = document.getElementById('svgContainer')?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      state.pan.x = mouseX - (mouseX - state.pan.x) * (targetZoom / state.zoom);
      state.pan.y = mouseY - (mouseY - state.pan.y) * (targetZoom / state.zoom);
    }
    state.zoom = targetZoom;
    updateSvgTransform();
  },

  // Ouvrages
  setOuvragesFilter: (type) => {
    state.ouvragesFilterType = type;
    renderApp();
    if (state.ouvragesScope === 'ALL') void loadFullTablesData(state, renderApp);
  },
  setOuvragesScope: (scope) => {
    state.ouvragesScope = scope;
    renderApp();
    if (scope === 'ALL') void loadFullTablesData(state, renderApp);
  },
  setOuvragesSearch: (q) => {
    const active = document.activeElement;
    const hadFocus = active?.id === 'ouvragesSearchInput';
    const selectionStart = hadFocus ? active.selectionStart : null;
    const selectionEnd = hadFocus ? active.selectionEnd : null;
    state.ouvragesSearch = q;
    renderApp();
    if (hadFocus) {
      const input = document.getElementById('ouvragesSearchInput');
      input?.focus();
      if (input && Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)) {
        input.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  },
  showOuvrageOnMap: (nodeId, depId) => {
    // Priorité au départ fourni uniquement s'il contient réellement le nœud.
    // Les lignes du catalogue 2025 ne possèdent pas toutes un départ renseigné.
    const requestedDepart = depId && networkData.departs[depId];
    const requestedContainsNode = requestedDepart
      && (requestedDepart.nodes || []).some(node => String(node.id) === String(nodeId));
    const resolvedDepartId = requestedContainsNode ? depId : getNodeDepartIndex().get(String(nodeId));
    if (!resolvedDepartId) return;
    state.selectedDepartId = resolvedDepartId;
    const targetSummary = departsSummary.find(item => item.id === state.selectedDepartId);
    if (targetSummary) {
      state.selectedAgency = String(targetSummary.agency || state.selectedDepartId.slice(0, 3));
      state.schemaAgencyInitialized = true;
    }
    state.activeTab = 'unifilaire';
    state.selectedNode = null;
    state.selectedEdge = null;
    state.showBottomSheet = false;
    const dep = networkData.departs[state.selectedDepartId];
    const n = dep?.nodes.find(item => item.id === nodeId);
    if (n) {
      state.selectedNode = n;
      state.showBottomSheet = true;
    }
    renderApp();
    setTimeout(() => {
      const nodePos = window._currentNodePosMap?.get(nodeId);
      if (nodePos) {
        const container = document.getElementById('svgContainer');
        const w = container ? container.clientWidth : (window.innerWidth || 390);
        const h = container ? container.clientHeight : 500;
        state.zoom = 1.0;
        state.pan.x = w / 2 - nodePos.x * state.zoom;
        state.pan.y = h / 2 - nodePos.y * state.zoom;
        updateSvgTransform();
      }
    }, 70);
  },

  // Terrain & Visites (GDO-MT)
  createInterventionForPoste: (nodeId, nodeNom) => {
    state.newVisitPosteId = String(nodeId || '');
    state.newVisitPosteNom = String(nodeNom || '');
    // Depuis le catalogue global, aligner le départ sur celui du poste choisi.
    // Sinon le select du formulaire pourrait sélectionner le premier poste du départ courant.
    for (const [depId, depart] of Object.entries(networkData.departs || {})) {
      if ((depart.nodes || []).some(node => String(node.id) === String(nodeId))) {
        state.selectedDepartId = depId;
        const targetSummary = departsSummary.find(item => item.id === depId);
        if (targetSummary) {
          state.selectedAgency = String(targetSummary.agency || depId.slice(0, 3));
          state.schemaAgencyInitialized = true;
        }
        break;
      }
    }
    state.activeTab = 'terrain';
    state.showBottomSheet = false;
    renderApp();
  },
  closeVisitSuccessNotice: () => {
    state.visitSuccessNotice = false;
    renderApp();
  },
  saveIntervention: (e) => {
    e.preventDefault();
    const posteId = document.getElementById('fieldVisitPoste')?.value || state.newVisitPosteId;
    const type = document.getElementById('fieldVisitType')?.value || 'Inspection Visuelle';
    const statut = document.getElementById('fieldVisitStatut')?.value || 'RAS';
    const note = document.getElementById('fieldVisitNotes')?.value || 'Contrôle effectué sans anomalie.';

    const matchingNode = Object.values(networkData.departs || {})
      .flatMap(depart => depart.nodes || [])
      .find(node => String(node.id) === String(posteId));
    const posteNom = matchingNode?.meta?.nom
      || (String(posteId) === String(state.newVisitPosteId) ? state.newVisitPosteNom : '')
      || posteId;
    const now = new Date();
    const newInt = {
      // Timestamp complet : évite les collisions entre visites rapprochées.
      id: `INT-${now.getTime()}`,
      posteId,
      posteNom,
      date: now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type,
      statut,
      note
    };

    state.interventions.unshift(newInt);
    const saved = persistLocalStorage('gdo_mt_interventions', state.interventions);

    state.visitSuccessNotice = saved;
    renderApp();
    setTimeout(() => {
      state.visitSuccessNotice = false;
      renderApp();
    }, 3000);
  },
  deleteIntervention: (id) => {
    state.interventions = state.interventions.filter(item => item.id !== id);
    const saved = persistLocalStorage('gdo_mt_interventions', state.interventions);
    renderApp();
  },
  exportInterventions: () => {
    const blob = new Blob([JSON.stringify(state.interventions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Visites_GDO_MT_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // Paramètres
  setSettingsSubTab: (subTab) => {
    state.settingsSubTab = subTab;
    renderApp();
    if (subTab === 'tables') void loadFullTablesData(state, renderApp);
  },
  resetDefaultSettings: () => {
    state.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    removeStoredValue('gdo_mt_settings');
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
    persistLocalStorage('gdo_mt_settings', state.settings);
    renderApp();
  },
  deleteTransfo: (index) => {
    state.settings.transfos.splice(index, 1);
    persistLocalStorage('gdo_mt_settings', state.settings);
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
    persistLocalStorage('gdo_mt_settings', state.settings);
    renderApp();
  },
  deleteConducteur: (index) => {
    state.settings.conducteurs.splice(index, 1);
    persistLocalStorage('gdo_mt_settings', state.settings);
    renderApp();
  },
  saveSeuils: (e) => {
    e.preventDefault();
    state.settings.seuils.tensionNominale = Number(document.getElementById('inputTensionNominale').value) || 30.0;
    state.settings.seuils.chuteTensionMax = Number(document.getElementById('inputChuteTensionMax').value) || 5.0;
    state.settings.seuils.cosPhi = Number(document.getElementById('inputCosPhi').value) || 0.90;
    persistLocalStorage('gdo_mt_settings', state.settings);
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
    const active = document.activeElement;
    const hadFocus = active?.id === 'tableSearchInput';
    const selectionStart = hadFocus ? active.selectionStart : null;
    const selectionEnd = hadFocus ? active.selectionEnd : null;
    state.tableSearch = q;
    state.tablePage = 1;
    renderApp();
    if (hadFocus) {
      const input = document.getElementById('tableSearchInput');
      input?.focus();
      if (input && Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)) {
        input.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  },
  setTablePage: (p) => {
    state.tablePage = Math.max(1, p);
    renderApp();
  },
  exportCurrentCsv: () => {
    const currentTable = fullTablesData[state.tableSelected];
    const rows = currentTable?.rows;
    if (!Array.isArray(rows) || rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const csvCell = (value) => {
      let text = String(value ?? '');
      if (/^\s*[=+@-]/.test(text)) text = "'" + text;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [cols.map(csvCell).join(','), ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.tableSelected}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  exportCurrentJson: () => {
    const currentTable = fullTablesData[state.tableSelected];
    const rows = currentTable?.rows;
    if (!Array.isArray(rows)) return;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.tableSelected}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // Recherche rapide globale
  openQuickSearch: () => {
    state.showQuickSearchModal = true;
    state.quickSearchQuery = '';
    renderApp();
    void loadNetworkData(state, renderApp);
    void loadFullTablesData(state, renderApp);
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
      window.app.showOuvrageOnMap(id, depId);
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp, { once: true });
} else {
  renderApp();
}
