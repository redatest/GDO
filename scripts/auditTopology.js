import { readFileSync } from 'node:fs';
import { networkData } from '../src/data/networkData.js';
import { departsSummary } from '../src/data/departsSummary.js';

const legacyTopology = JSON.parse(
  readFileSync(new URL('../src/data/networkTopology.json', import.meta.url), 'utf8')
);
const errors = [];
const warnings = [];
const currentDeparts = networkData.departs ?? {};
const summaryById = new Map((departsSummary ?? []).map((item) => [item.id, item]));
const currentIds = Object.keys(currentDeparts);
const legacyIds = Object.keys(legacyTopology.departs ?? {});
let totalNodes = 0;
let totalEdges = 0;
let totalLengthKm = 0;
let disconnectedDepartCount = 0;

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function countComponents(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    if (!adjacency.has(edge.from) || !adjacency.has(edge.to)) continue;
    adjacency.get(edge.from).push(edge.to);
    adjacency.get(edge.to).push(edge.from);
  }

  const visited = new Set();
  let components = 0;
  for (const nodeId of adjacency.keys()) {
    if (visited.has(nodeId)) continue;
    components += 1;
    const stack = [nodeId];
    visited.add(nodeId);
    while (stack.length) {
      const current = stack.pop();
      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
  }
  return components;
}

for (const [departId, depart] of Object.entries(currentDeparts)) {
  const nodes = Array.isArray(depart.nodes) ? depart.nodes : [];
  const edges = Array.isArray(depart.edges) ? depart.edges : [];
  const nodeIds = new Set();
  const edgeIds = new Set();

  totalNodes += nodes.length;
  totalEdges += edges.length;
  totalLengthKm += Number(depart.totalLengthKm) || 0;

  for (const node of nodes) {
    if (!node?.id) {
      addError(`Départ ${departId}: nœud sans identifiant.`);
      continue;
    }
    if (nodeIds.has(node.id)) addError(`Départ ${departId}: identifiant de nœud dupliqué ${node.id}.`);
    nodeIds.add(node.id);
  }

  for (const edge of edges) {
    if (!edge?.id) {
      addError(`Départ ${departId}: tronçon sans identifiant.`);
    } else if (edgeIds.has(edge.id)) {
      addError(`Départ ${departId}: identifiant de tronçon dupliqué ${edge.id}.`);
    } else {
      edgeIds.add(edge.id);
    }

    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      addError(`Départ ${departId}: extrémité absente du référentiel de nœuds pour ${edge.id ?? '(sans ID)'} (${edge.from} → ${edge.to}).`);
    }
    const length = Number(edge.longueur);
    if (!Number.isFinite(length) || length < 0) {
      addError(`Départ ${departId}: longueur invalide pour ${edge.id ?? '(sans ID)'}.`);
    }
  }

  if (depart.arcCount !== edges.length) {
    addError(`Départ ${departId}: arcCount=${depart.arcCount}, mais ${edges.length} tronçons présents.`);
  }
  if (depart.nodeCount !== nodes.length) {
    addError(`Départ ${departId}: nodeCount=${depart.nodeCount}, mais ${nodes.length} nœuds présents.`);
  }

  const summary = summaryById.get(departId);
  if (!summary) {
    addError(`Départ ${departId}: absent de departsSummary.`);
  } else if (summary.arcCount !== edges.length || summary.nodeCount !== nodes.length) {
    addError(`Départ ${departId}: incohérence entre networkData et departsSummary.`);
  }

  const components = countComponents(nodes, edges);
  if (components > 1) {
    disconnectedDepartCount += 1;
    addWarning(`Départ ${departId}: ${components} composantes topologiques disjointes.`);
  }
}

if (networkData.stats?.totalDeparts !== currentIds.length) {
  addError(`totalDeparts=${networkData.stats?.totalDeparts}, mais ${currentIds.length} départs sont chargés.`);
}
if (networkData.stats?.totalArcs !== totalEdges) {
  addError(`totalArcs=${networkData.stats?.totalArcs}, mais ${totalEdges} tronçons sont chargés.`);
}
if ((departsSummary ?? []).length !== currentIds.length) {
  addError(`departsSummary contient ${departsSummary?.length ?? 0} départs au lieu de ${currentIds.length}.`);
}
const summaryEdgeCount = (departsSummary ?? []).reduce((sum, item) => sum + (Number(item.arcCount) || 0), 0);
const summaryNodeCount = (departsSummary ?? []).reduce((sum, item) => sum + (Number(item.nodeCount) || 0), 0);
const summaryLengthKm = (departsSummary ?? []).reduce((sum, item) => sum + (Number(item.totalLengthKm) || 0), 0);
if (summaryEdgeCount !== totalEdges || summaryNodeCount !== totalNodes) {
  addError('Les totaux de departsSummary ne correspondent pas aux données réseau.');
}
if (Math.abs(summaryLengthKm - totalLengthKm) > 0.02) {
  addError(`Longueur totale incohérente: résumé=${summaryLengthKm.toFixed(2)} km, réseau=${totalLengthKm.toFixed(2)} km.`);
}

const missingFromCurrent = legacyIds.filter((id) => !currentDeparts[id]);
const missingFromLegacy = currentIds.filter((id) => !legacyTopology.departs?.[id]);
const legacyEdgeCount = Object.values(legacyTopology.departs ?? {}).reduce(
  (sum, depart) => sum + (depart.edges?.length ?? 0), 0
);
const legacyLengthKm = Object.values(legacyTopology.departs ?? {}).reduce(
  (sum, depart) => sum + (Number(depart.totalLengthKm) || 0), 0
);

if (missingFromCurrent.length || missingFromLegacy.length) {
  addWarning(
    `Divergence entre networkData et networkTopology: ${legacyIds.length} départs historiques contre ${currentIds.length} actuels; absents des données actuelles=[${missingFromCurrent.join(', ')}]; absents de l'historique=[${missingFromLegacy.join(', ')}].`
  );
}
if (legacyEdgeCount !== totalEdges || Math.abs(legacyLengthKm - totalLengthKm) > 0.02) {
  addWarning(
    `Instantanés réseau différents: historique=${legacyEdgeCount} tronçons / ${legacyLengthKm.toFixed(2)} km; actuel=${totalEdges} tronçons / ${totalLengthKm.toFixed(2)} km. Ne pas fusionner automatiquement sans valider la source métier.`
  );
}

console.log('=== Audit topologique GDO-MT ===');
console.log(`Données actuelles: ${currentIds.length} départs, ${totalNodes} nœuds, ${totalEdges} tronçons, ${totalLengthKm.toFixed(2)} km.`);
console.log(`Référence historique: ${legacyIds.length} départs, ${legacyEdgeCount} tronçons, ${legacyLengthKm.toFixed(2)} km.`);
console.log(`Départs avec plusieurs composantes: ${disconnectedDepartCount}.`);
for (const warning of warnings) console.warn(`AVERTISSEMENT: ${warning}`);
for (const error of errors) console.error(`ERREUR: ${error}`);
console.log(`Résultat: ${errors.length} erreur(s) bloquante(s), ${warnings.length} avertissement(s).`);

if (errors.length) process.exitCode = 1;
