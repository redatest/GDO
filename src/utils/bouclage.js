/**
 * Analyse topologique d'une proposition de bouclage sur un départ MT.
 * Les postes déjà non alimentés avant la panne ne sont pas comptés comme
 * conséquences de la panne simulée. L'analyse reste non destructive.
 */
export function analyzeBouclage(depart, failedNodeId) {
  const nodes = Array.isArray(depart?.nodes) ? depart.nodes : [];
  const edges = Array.isArray(depart?.edges) ? depart.edges : [];
  const nodeById = new Map(nodes.map(node => [String(node.id), node]));
  const failedId = String(failedNodeId);
  const failedNode = nodeById.get(failedId);

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
  let source = physicalSource;
  if (!source && virtualSource) {
    const anchor = edges.find(edge => edge.isVirtual && String(edge.from) === String(virtualSource.id));
    source = anchor ? nodeById.get(String(anchor.to)) : null;
  }
  if (!source) source = nodes.find(node => node.type === 'CELLULE');
  if (!source) {
    return { ok: false, reason: 'Aucune origine topologique exploitable n’est identifiée dans ce départ.' };
  }

  const isOpenSwitch = node => {
    if (node?.type !== 'INTERRUPTEUR_AERIEN') return false;
    const value = node.meta?.isOpen;
    return value === true || value === 1 || ['1', 'true', 'oui', 'ouvert'].includes(String(value ?? '').trim().toLowerCase());
  };
  const switchCount = nodes.filter(node => node.type === 'INTERRUPTEUR_AERIEN').length;
  const openSwitchCount = nodes.filter(isOpenSwitch).length;

  // Recherche les postes alimentés dans l'état de référence, puis après
  // retrait du poste en défaut. Les coupures préexistantes sont exclues.
  function getReachable(excludedNodeId = null) {
    const reachable = new Set([String(source.id)]);
    const queue = [String(source.id)];
    while (queue.length) {
      const currentId = queue.shift();
      for (const link of adjacency.get(currentId) || []) {
        const nextId = link.nodeId;
        if (nextId === excludedNodeId || reachable.has(nextId) || isOpenSwitch(nodeById.get(nextId))) continue;
        reachable.add(nextId);
        queue.push(nextId);
      }
    }
    return reachable;
  }

  const baselineReachable = getReachable();
  const afterFailureReachable = getReachable(failedId);
  const posteNodes = nodes.filter(node => node.type === 'POSTE_HTA_BT' && String(node.id) !== failedId);
  const affectedPostes = posteNodes.filter(node =>
    baselineReachable.has(String(node.id)) && !afterFailureReachable.has(String(node.id))
  );
  const preExistingUnreachablePostes = posteNodes.filter(node => !baselineReachable.has(String(node.id)));

  // Cherche explicitement un état cible atteint après le passage par UN
  // IACM ouvert. Ne pas s'arrêter sur un chemin à zéro IACM : un autre chemin
  // de transfert peut exister dans le même graphe.
  function findTransferPath(targetId) {
    const startId = String(source.id);
    const queue = [{ nodeId: startId, openCount: 0 }];
    const previous = new Map();
    const visited = new Set([startId + '|0']);
    let found = null;

    while (queue.length) {
      const current = queue.shift();
      if (current.nodeId === String(targetId) && current.openCount === 1) {
        found = current;
        break;
      }

      for (const link of adjacency.get(current.nodeId) || []) {
        if (link.nodeId === failedId) continue;
        const nextNode = nodeById.get(link.nodeId);
        const nextOpenCount = current.openCount + (isOpenSwitch(nextNode) ? 1 : 0);
        if (nextOpenCount > 1) continue;

        const key = link.nodeId + '|' + nextOpenCount;
        if (visited.has(key)) continue;
        visited.add(key);
        previous.set(key, {
          previousKey: current.nodeId + '|' + current.openCount,
          edge: link.edge
        });
        queue.push({ nodeId: link.nodeId, openCount: nextOpenCount });
      }
    }

    if (!found) return null;
    const pathNodeIds = [];
    const pathEdgeIds = [];
    let key = found.nodeId + '|' + found.openCount;
    while (key) {
      pathNodeIds.push(key.split('|')[0]);
      const step = previous.get(key);
      if (!step) break;
      pathEdgeIds.push(String(step.edge.id));
      key = step.previousKey;
    }
    pathNodeIds.reverse();
    pathEdgeIds.reverse();
    const switches = pathNodeIds.map(id => nodeById.get(id)).filter(isOpenSwitch);
    return { pathNodeIds, pathEdgeIds, switches };
  }

  const candidates = affectedPostes.map(poste => {
    const path = findTransferPath(poste.id);
    if (!path || path.switches.length !== 1) return null;
    const switchNode = path.switches[0];
    return {
      posteId: String(poste.id),
      posteName: String(poste.meta?.nom || poste.id),
      pathNodeIds: path.pathNodeIds,
      pathEdgeIds: path.pathEdgeIds,
      switchId: String(switchNode.id),
      switchName: String(switchNode.meta?.nom || switchNode.id),
      edgeCount: path.pathEdgeIds.length
    };
  }).filter(Boolean);

  candidates.sort((a, b) =>
    a.edgeCount - b.edgeCount ||
    a.posteId.localeCompare(b.posteId, 'fr', { numeric: true })
  );

  let message = '';
  if (!affectedPostes.length) {
    message = 'Le retrait de ce poste ne prive aucun autre poste actuellement alimenté dans la topologie de ce départ.';
  } else if (!switchCount) {
    message = 'Des postes seraient privés d’alimentation, mais aucun IACM n’est enregistré dans ce départ. Le référentiel ne contient donc aucun organe permettant de proposer un bouclage.';
  } else if (!candidates.length) {
    message = 'Des postes seraient privés d’alimentation, mais aucun chemin alternatif nécessitant une seule fermeture d’IACM ouvert n’a été trouvé dans ce départ.';
  } else {
    message = candidates.length + ' proposition(s) topologique(s) trouvée(s).';
  }

  return {
    ok: true,
    departId: String(depart.id || ''),
    failedNodeId: failedId,
    failedNodeName: String(failedNode.meta?.nom || failedNode.id),
    sourceId: String(source.id),
    sourceIsVirtual: !physicalSource && Boolean(virtualSource),
    switchCount,
    openSwitchCount,
    baselinePosteCount: posteNodes.filter(node => baselineReachable.has(String(node.id))).length,
    affectedPostes: affectedPostes.map(node => ({
      id: String(node.id),
      name: String(node.meta?.nom || node.id)
    })),
    preExistingUnreachablePostes: preExistingUnreachablePostes.map(node => ({
      id: String(node.id),
      name: String(node.meta?.nom || node.id)
    })),
    candidates,
    message,
    note: 'Analyse topologique uniquement : intensités, transit de puissance, chutes de tension, protections et sélectivité ne sont pas calculés.'
  };
}
