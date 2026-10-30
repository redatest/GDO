/**
 * GDO-MT — Dépôt de données côté navigateur.
 * Charge à la demande les référentiels topologiques et les tables réseau.
 * Aucun accès réseau externe ni dépendance supplémentaire.
 */
import { departsSummary } from './departsSummary.js';

export let networkData = {
  sources: {},
  departs: {},
  stats: {
    totalDeparts: 49,
    totalPostes: 2660,
    totalTransformers: 2800,
    totalIacms: 1638,
    openIacms: 39,
    totalArcs: 7501,
    totalTroncons: 1372,
    lastUpdate: '31/12/2025'
  }
};

export let fullTablesData = {};
let networkDataLoadPromise = null;
let fullTablesLoadPromise = null;
let nodeDepartIndex = null;

function normalizeNetworkData(data) {
  const cellId = /^[0-9]{3}[HO][0-9]+[BC][0-9]+$/;
  let correctedCellTypes = 0;
  let addedVirtualSources = 0;

  for (const [departId, depart] of Object.entries(data.departs || {})) {
    for (const node of depart.nodes || []) {
      if (node.id !== departId && cellId.test(node.id) && node.type === 'POSTE_SOURCE') {
        node.type = 'CELLULE';
        node.prefix = node.id.match(/[BC][0-9]+$/)?.[0]?.[0] || 'C';
        node.meta = null;
        correctedCellTypes += 1;
      }
    }

    if (!(depart.nodes || []).some(node => node.type === 'POSTE_SOURCE')) {
      const sourcePrefix = departId.substring(0, 5);
      const virtualSourceId = `${sourcePrefix}_SOURCE`;
      const firstNodeId = depart.nodes?.[0]?.id;
      if (firstNodeId) {
        const source = data.sources?.[sourcePrefix];
        depart.nodes.unshift({
          id: virtualSourceId,
          type: 'POSTE_SOURCE',
          isVirtual: true,
          prefix: 'H',
          meta: { nom: source?.nom || `Source ${sourcePrefix}`, u_prim: source?.u_prim || 60, u_second: 30 }
        });
        depart.edges.unshift({
          id: `${virtualSourceId}-${firstNodeId}:1`,
          from: virtualSourceId,
          to: firstNodeId,
          cPar: '1',
          longueur: 0,
          nat_cond: '-',
          section: 0,
          struct: 'VIRTUEL',
          structRaw: 'VIRTUEL',
          structLabel: 'Racine virtuelle — raccordement physique non renseigné',
          poseLabel: 'Ancrage graphique',
          isSouterrain: false,
          isVirtual: true,
          tension: 30,
          an_mes: ''
        });
        addedVirtualSources += 1;
      }
    }

    depart.arcCount = depart.edges.filter(edge => !edge.isVirtual).length;
    depart.nodeCount = depart.nodes.filter(node => !node.isVirtual).length;
  }

  data.stats.totalDeparts = Object.keys(data.departs || {}).length;
  data.stats.totalArcs = Object.values(data.departs || {}).reduce((sum, depart) => sum + depart.edges.filter(edge => !edge.isVirtual).length, 0);

  const summaryById = new Map(departsSummary.map(item => [item.id, item]));
  for (const [departId, depart] of Object.entries(data.departs || {})) {
    const summary = summaryById.get(departId);
    if (!summary) continue;
    summary.arcCount = depart.arcCount;
    summary.nodeCount = depart.nodeCount;
    summary.totalLengthKm = depart.totalLengthKm;
    summary.posteCount = depart.posteCount;
    summary.iacmCount = depart.iacmCount;
    summary.openIacmCount = depart.openIacmCount;
    summary.etoilCount = depart.etoilCount;
    summary.totalPowerKva = depart.totalPowerKva;
  }
  departsSummary.sort((a, b) => String(a.id || '').localeCompare(String(b.id || ''), 'fr', { numeric: true, sensitivity: 'base' }));

  if (correctedCellTypes || addedVirtualSources) {
    console.info('Normalisation topologique de compatibilité:', {
      correctedCellTypes,
      addedVirtualSources,
      totalArcs: data.stats.totalArcs
    });
  }
  return data;
}

export function getNodeDepartIndex() {
  if (nodeDepartIndex) return nodeDepartIndex;
  nodeDepartIndex = new Map();
  for (const [departId, depart] of Object.entries(networkData.departs || {})) {
    for (const node of depart.nodes || []) {
      const nodeId = String(node.id || '');
      if (nodeId && !nodeDepartIndex.has(nodeId)) nodeDepartIndex.set(nodeId, departId);
    }
  }
  return nodeDepartIndex;
}

export async function ensureNetworkData(state, renderApp) {
  if (Object.keys(networkData.departs).length) return true;
  if (!networkDataLoadPromise) {
    networkDataLoadPromise = import('./networkData.js')
      .then((module) => {
        networkData = normalizeNetworkData(module.networkData || { sources: {}, departs: {}, stats: {} });
        nodeDepartIndex = null;
        state.networkDataError = Object.keys(networkData.departs).length
          ? ''
          : 'Le référentiel topologique est vide.';
        return Object.keys(networkData.departs).length > 0;
      })
      .catch((error) => {
        console.error('Échec du chargement du réseau MT:', error);
        state.networkDataError = 'Impossible de charger le réseau MT. Vérifiez la connexion puis réessayez.';
        return false;
      })
      .finally(() => {
        networkDataLoadPromise = null;
        renderApp();
      });
  }
  return networkDataLoadPromise;
}

export async function ensureFullTablesData(state, renderApp) {
  if (Object.keys(fullTablesData).length) return true;
  if (!fullTablesLoadPromise) {
    fullTablesLoadPromise = import('./fullTablesData.js')
      .then((module) => {
        fullTablesData = module.fullTablesData || {};
        state.dataLoadError = Object.keys(fullTablesData).length ? '' : 'Le référentiel des tables est vide.';
        return Object.keys(fullTablesData).length > 0;
      })
      .catch((error) => {
        console.error('Échec du chargement des tables réseau:', error);
        state.dataLoadError = 'Impossible de charger les tables réseau. Vérifiez la connexion puis réessayez.';
        return false;
      })
      .finally(() => {
        fullTablesLoadPromise = null;
        renderApp();
      });
  }
  return fullTablesLoadPromise;
}
