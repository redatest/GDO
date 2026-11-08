/**
 * Analyse topologique d'une proposition de bouclage sur un départ MT.
 * Simulation non destructive ; ne remplace pas les études électriques.
 */
export function analyzeBouclage(depart, failedNodeId) {
  const nodes = Array.isArray(depart?.nodes) ? depart.nodes : [];
  const edges = Array.isArray(depart?.edges) ? depart.edges : [];
  const nodeById = new Map(nodes.map(node => [String(node.id), node]));
  const failedNode = nodeById.get(String(failedNodeId));
  if (!failedNode || failedNode.type !== 'POSTE_HTA_BT') {
    return { ok: false, reason: 'Sélectionnez un poste HTA/BT valide.' };
  }

  const physicalEdges = edges.filter(edge =>
    !edge.isVirtual && nodeById.has(String(edge.from)) && nodeById.has(String(edge.to))
  );
  const adjacency = new Map(nodes.map(node => [String(node.id), []]));
  for (const edge of physicalEdges) {
    adjacency.get(String(edge.from)).push({ nodeId: String(edge.to), edge });
    adjacency.get(String(edge.to)).push({ nodeId: String(edge.from), edge });
  }

  const physicalSource = nodes.find(node => node.type === 'POSTE_SOURCE' && !node.isVirtual);
  const virtualSource = nodes.find(node => node.type === 'POSTE_SOURCE' && node.isVirtual);
  let source = physicalSource || nodes.find(node => node.type === 'CELLULE');
  if (!source && virtualSource) {
    const anchor = edges.find(edge => edge.isVirtual && edge.from === virtualSource.id);
    source = anchor ? nodeById.get(String(anchor.to)) : null;
  }
  if (!source) {
    return { ok: false, reason: 'Aucune origine topologique exploitable n’est identifiée dans ce départ.' };
  }

  const isOpenSwitch = node => {
    if (node?.type !== 'INTERRUPTEUR_AERIEN') return false;
    const value = node.meta?.isOpen;
    return value === true || value === 1 || ['1', 'true', 'oui', 'ouvert'].includes(String(value ?? '').trim().toLowerCase());
  };

  function findPath(targetId) {
    const startId = String(source.id);
    const queue = [{ nodeId: startId, openCount: 0 }];
    const previous = new Map();
    const visited = new Set([startId + '|0']);
    let found = null;

    while (queue.length) {
      const current = queue.shift();
      if (current.nodeId === String(targetId)) { found = current; break; }
      for (const link of adjacency.get(current.nodeId) || []) {
        if (link.nodeId === String(failedNodeId)) continue;
        const nextNode = nodeById.get(link.nodeId);
        const nextOpenCount = current.openCount + (isOpenSwitch(nextNode) ? 1 : 0);
        if (nextOpenCount > 1) continue;
        const key = link.nodeId + '|' + nextOpenCount;
        if (visited.has(key)) continue;
        visited.add(key);
        previous.set(key, { previousKey: current.nodeId + '|' + current.openCount, edge: link.edge });
        queue.push({ nodeId: link.nodeId, openCount: nextOpenCount });
      }
    }

    if (!found) return null;
    const nodeIds = [];
    const edgeIds = [];
    let key = found.nodeId + '|' + found.openCount;
    while (key) {
      const nodeId = key.split('|')[0];
      nodeIds.push(nodeId);
      const step = previous.get(key);
      if (!step) break;
      edgeIds.push(String(step.edge.id));
      key = step.previousKey;
    }
    nodeIds.reverse();
    edgeIds.reverse();
    const switches = nodeIds.map(id => nodeById.get(id)).filter(isOpenSwitch);
    return { nodeIds, edgeIds, switches, openSwitchCount: found.openCount };
  }

  // État actuel : les IACM ouverts sont des coupures.
  const currentlyReachable = new Set([String(source.id)]);
  const queue = [String(source.id)];
  while (queue.length) {
    const currentId = queue.shift();
    for (const link of adjacency.get(currentId) || []) {
      const nextId = link.nodeId;
      const nextNode = nodeById.get(nextId);
      if (nextId === String(failedNodeId) || isOpenSwitch(nextNode) || currentlyReachable.has(nextId)) continue;
      currentlyReachable.add(nextId);
      queue.push(nextId);
    }
  }

  const affectedPostes = nodes.filter(node =>
    node.type === 'POSTE_HTA_BT' &&
    String(node.id) !== String(failedNodeId) &&
    !currentlyReachable.has(String(node.id))
  );

  const candidates = [];
  for (const poste of affectedPostes) {
    const path = findPath(poste.id);
    if (!path || path.openSwitchCount !== 1 || path.switches.length !== 1) continue;
    candidates.push({
      posteId: String(poste.id),
      posteName: String(poste.meta?.nom || poste.id),
      pathNodeIds: path.nodeIds,
      pathEdgeIds: path.edgeIds,
      switchId: String(path.switches[0].id),
      switchName: String(path.switches[0].meta?.nom || path.switches[0].id),
      edgeCount: path.edgeIds.length
    });
  }
  candidates.sort((a, b) => a.edgeCount - b.edgeCount || a.posteId.localeCompare(b.posteId, 'fr', { numeric: true }));

  return {
    ok: true,
    departId: String(depart.id || ''),
    failedNodeId: String(failedNodeId),
    failedNodeName: String(failedNode.meta?.nom || failedNode.id),
    sourceId: String(source.id),
    sourceIsVirtual: !physicalSource,
    affectedPostes: affectedPostes.map(node => ({ id: String(node.id), name: String(node.meta?.nom || node.id) })),
    candidates,
    note: 'Analyse topologique uniquement : intensités, transit de puissance, chutes de tension, protections et sélectivité ne sont pas calculés.'
  };
}
