/**
 * Analyse topologique d'une proposition de bouclage MT à l'échelle des départs.
 * Les liaisons entre départs ne sont reconnues qu'au travers d'un même IACM
 * présent dans plusieurs graphes. Les postes déjà non alimentés avant la panne
 * sont exclus des conséquences simulées.
 */
export function analyzeBouclage(depart, failedNodeId, allDeparts = {}) {
  const selectedDepartId = String(depart?.id || '');
  const failedId = String(failedNodeId);
  const departs = Object.keys(allDeparts).length ? allDeparts : { [selectedDepartId]: depart };

  const selectedNodes = Array.isArray(depart?.nodes) ? depart.nodes : [];
  const failedNode = selectedNodes.find(node => String(node.id) === failedId);
  if (!failedNode || failedNode.type !== 'POSTE_HTA_BT') {
    return { ok: false, reason: 'Sélectionnez un poste HTA/BT valide.' };
  }

  const isOpenValue = value =>
    value === true || value === 1 ||
    ['1', 'true', 'oui', 'ouvert'].includes(String(value ?? '').trim().toLowerCase());
  const isOpenSwitch = node =>
    node?.type === 'INTERRUPTEUR_AERIEN' && isOpenValue(node.meta?.isOpen);

  // Un IACM n'est un point de bouclage inter-départs que si son identifiant
  // apparaît dans au moins deux graphes de départs distincts.
  const switchMembership = new Map();
  const switchStates = new Map();
  for (const [departId, currentDepart] of Object.entries(departs)) {
    for (const node of currentDepart?.nodes || []) {
      if (node.type !== 'INTERRUPTEUR_AERIEN') continue;
      const id = String(node.id);
      if (!switchMembership.has(id)) switchMembership.set(id, new Set());
      switchMembership.get(id).add(String(departId));
      if (!switchStates.has(id)) switchStates.set(id, new Set());
      switchStates.get(id).add(isOpenSwitch(node));
    }
  }
  const sharedSwitchIds = new Set(
    [...switchMembership.entries()]
      .filter(([id, members]) => members.size > 1 && switchStates.get(id)?.size === 1)
      .map(([id]) => id)
  );

  const nodeByKey = new Map();
  const adjacency = new Map();
  const sources = [];
  const localSwitches = selectedNodes.filter(node => node.type === 'INTERRUPTEUR_AERIEN');
  const localOpenSwitches = localSwitches.filter(isOpenSwitch);
  const sharedOpenSwitches = localOpenSwitches.filter(node => sharedSwitchIds.has(String(node.id)));

  function getNodeKey(departId, node) {
    if (node.type === 'INTERRUPTEUR_AERIEN' && sharedSwitchIds.has(String(node.id))) {
      return 'SHARED_IACM|' + String(node.id);
    }
    return String(departId) + '|' + String(node.id);
  }

  // Construire le graphe global sans fusionner les postes homonymes :
  // seule l'identité d'un IACM partagé matérialise une interconnexion connue.
  for (const [departId, currentDepart] of Object.entries(departs)) {
    const nodes = Array.isArray(currentDepart?.nodes) ? currentDepart.nodes : [];
    for (const node of nodes) {
      const key = getNodeKey(departId, node);
      if (!nodeByKey.has(key)) {
        nodeByKey.set(key, {
          ...node,
          key,
          id: String(node.id),
          departIds: [String(departId)]
        });
        adjacency.set(key, []);
      } else {
        const record = nodeByKey.get(key);
        if (!record.departIds.includes(String(departId))) record.departIds.push(String(departId));
      }
    }

    const sourceNode =
      nodes.find(node => node.type === 'POSTE_SOURCE' && !node.isVirtual) ||
      nodes.find(node => node.type === 'POSTE_SOURCE' && node.isVirtual) ||
      nodes.find(node => node.type === 'CELLULE');
    if (sourceNode) {
      sources.push({
        departId: String(departId),
        key: getNodeKey(departId, sourceNode),
        id: String(sourceNode.id),
        name: String(sourceNode.meta?.nom || sourceNode.id),
        virtual: Boolean(sourceNode.isVirtual)
      });
    }
  }

  const edgeByKey = new Map();
  for (const [departId, currentDepart] of Object.entries(departs)) {
    const nodes = Array.isArray(currentDepart?.nodes) ? currentDepart.nodes : [];
    const nodeById = new Map(nodes.map(node => [String(node.id), node]));
    for (const edge of currentDepart?.edges || []) {
      if (edge.isVirtual) continue;
      const fromNode = nodeById.get(String(edge.from));
      const toNode = nodeById.get(String(edge.to));
      if (!fromNode || !toNode) continue;
      const fromKey = getNodeKey(departId, fromNode);
      const toKey = getNodeKey(departId, toNode);
      if (!adjacency.has(fromKey) || !adjacency.has(toKey)) continue;
      const edgeKey = String(departId) + '|' + String(edge.id);
      if (edgeByKey.has(edgeKey)) continue;
      const record = { edge, departId: String(departId) };
      edgeByKey.set(edgeKey, record);
      adjacency.get(fromKey).push({ key: toKey, ...record });
      adjacency.get(toKey).push({ key: fromKey, ...record });
    }
  }

  const physicalSources = sources.filter(source => !source.virtual);
  const allSources = sources;
  if (!allSources.length) {
    return { ok: false, reason: 'Aucune origine topologique exploitable n’est identifiée dans les départs chargés.' };
  }

  const failedKeys = new Set(
    [...nodeByKey.entries()]
      .filter(([, node]) => node.type === 'POSTE_HTA_BT' && node.id === failedId)
      .map(([key]) => key)
  );
  const selectedFailedKey = getNodeKey(selectedDepartId, failedNode);
  failedKeys.add(selectedFailedKey);

  function getReachable(excludeFailed) {
    const reachable = new Set(allSources.map(source => source.key));
    const queue = [...reachable];
    while (queue.length) {
      const currentKey = queue.shift();
      for (const link of adjacency.get(currentKey) || []) {
        const nextNode = nodeByKey.get(link.key);
        if (
          (excludeFailed && failedKeys.has(link.key)) ||
          reachable.has(link.key) ||
          isOpenSwitch(nextNode)
        ) continue;
        reachable.add(link.key);
        queue.push(link.key);
      }
    }
    return reachable;
  }

  const baselineReachable = getReachable(false);
  const afterFailureReachable = getReachable(true);
  const posteNodes = selectedNodes.filter(node =>
    node.type === 'POSTE_HTA_BT' && String(node.id) !== failedId
  );
  const affectedPostes = posteNodes.filter(node => {
    const key = getNodeKey(selectedDepartId, node);
    return baselineReachable.has(key) && !afterFailureReachable.has(key);
  });
  const preExistingUnreachablePostes = posteNodes.filter(node =>
    !baselineReachable.has(getNodeKey(selectedDepartId, node))
  );

  // Chercher un chemin depuis une source d'un autre départ, en traversant
  // exactement un IACM ouvert partagé. Les autres IACM ouverts restent bloquants.
  function findTransferPath(targetKey) {
    let best = null;
    for (const source of physicalSources) {
      if (source.departId === selectedDepartId) continue;
      const queue = [{ key: source.key, openCount: 0 }];
      const previous = new Map();
      const visited = new Set([source.key + '\\u0000' + '0']);
      let found = null;

      while (queue.length) {
        const current = queue.shift();
        if (current.key === targetKey && current.openCount === 1) {
          found = current;
          break;
        }
        for (const link of adjacency.get(current.key) || []) {
          if (failedKeys.has(link.key)) continue;
          const nextNode = nodeByKey.get(link.key);
          const open = isOpenSwitch(nextNode);
          const isSharedTie = open &&
            nextNode.type === 'INTERRUPTEUR_AERIEN' &&
            nextNode.departIds.length > 1 &&
            sharedSwitchIds.has(nextNode.id);
          if (open && !isSharedTie) continue;
          const nextOpenCount = current.openCount + (isSharedTie ? 1 : 0);
          if (nextOpenCount > 1) continue;
          const stateKey = link.key + '\\u0000' + nextOpenCount;
          if (visited.has(stateKey)) continue;
          visited.add(stateKey);
          previous.set(stateKey, {
            previousKey: current.key + '\\u0000' + current.openCount,
            edge: link.edge,
            departId: link.departId
          });
          queue.push({ key: link.key, openCount: nextOpenCount });
        }
      }

      if (!found) continue;
      const pathKeys = [];
      const pathSteps = [];
      let stateKey = found.key + '\\u0000' + found.openCount;
      while (stateKey) {
        pathKeys.push(stateKey.slice(0, stateKey.lastIndexOf('\\u0000')));
        const step = previous.get(stateKey);
        if (!step) break;
        pathSteps.push(step);
        stateKey = step.previousKey;
      }
      pathKeys.reverse();
      pathSteps.reverse();

      const tieKey = pathKeys.find(key => {
        const node = nodeByKey.get(key);
        return isOpenSwitch(node) && node.departIds.length > 1 && sharedSwitchIds.has(node.id);
      });
      if (!tieKey) continue;
      const tieNode = nodeByKey.get(tieKey);
      const localPathNodeIds = pathKeys
        .map(key => nodeByKey.get(key))
        .filter(node => node?.departIds.includes(selectedDepartId))
        .map(node => node.id);
      const localPathEdgeIds = pathSteps
        .filter(step => step.departId === selectedDepartId)
        .map(step => String(step.edge.id));

      const candidate = {
        sourceDepartId: source.departId,
        sourceId: source.id,
        sourceName: source.name,
        posteId: failedId,
        switchId: tieNode.id,
        switchName: String(tieNode.meta?.nom || tieNode.id),
        pathNodeIds: localPathNodeIds,
        pathEdgeIds: localPathEdgeIds,
        edgeCount: pathSteps.length
      };
      if (!best || candidate.edgeCount < best.edgeCount) best = candidate;
    }
    return best;
  }

  const candidates = affectedPostes.map(poste => {
    const path = findTransferPath(getNodeKey(selectedDepartId, poste));
    if (!path) return null;
    return {
      ...path,
      posteId: String(poste.id),
      posteName: String(poste.meta?.nom || poste.id)
    };
  }).filter(Boolean);

  candidates.sort((a, b) =>
    a.edgeCount - b.edgeCount ||
    a.posteId.localeCompare(b.posteId, 'fr', { numeric: true })
  );

  let message = '';
  if (!affectedPostes.length) {
    message = 'Le retrait de ce poste ne prive aucun autre poste actuellement alimenté dans le graphe global des départs.';
  } else if (!sharedOpenSwitches.length) {
    message = localSwitches.length
      ? 'Des postes seraient privés d’alimentation, mais aucun IACM ouvert de ce départ n’est identifié comme liaison commune avec un autre départ. Aucun bouclage inter-départs ne peut être proposé avec les données disponibles.'
      : 'Des postes seraient privés d’alimentation, mais aucun IACM n’est enregistré dans ce départ. Aucun bouclage inter-départs ne peut être calculé avec les données disponibles.';
  } else if (!candidates.length) {
    message = 'Des postes seraient privés d’alimentation, mais aucun chemin depuis une autre source via un IACM ouvert partagé n’a été trouvé.';
  } else {
    message = candidates.length + ' proposition(s) de réalimentation inter-départs trouvée(s).';
  }

  return {
    ok: true,
    departId: selectedDepartId,
    failedNodeId: failedId,
    failedNodeName: String(failedNode.meta?.nom || failedNode.id),
    sourceId: String(sources.find(source => source.departId === selectedDepartId)?.id || ''),
    sourceIsVirtual: Boolean(sources.find(source => source.departId === selectedDepartId)?.virtual),
    switchCount: localSwitches.length,
    openSwitchCount: localOpenSwitches.length,
    sharedOpenSwitchCount: sharedOpenSwitches.length,
    baselinePosteCount: posteNodes.filter(node => baselineReachable.has(getNodeKey(selectedDepartId, node))).length,
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
    note: 'Analyse topologique inter-départs uniquement. Les capacités des départs, intensités, transit de puissance, ampacité, chutes de tension, protections et sélectivité ne sont pas calculés.'
  };
}
