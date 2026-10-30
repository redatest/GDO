/**
 * Vue de recherche rapide des départs et ouvrages MT.
 * Les référentiels et les utilitaires sont injectés par le module applicatif.
 */
export function renderQuickSearchModal({ state, departsSummary, fullTablesData, networkData, getNodeDepartIndex, escapeHtml, escapeJsString }) {
  if (!state.showQuickSearchModal) return '';

  const q = state.quickSearchQuery.trim().toLowerCase();
  let results = [];

  if (q.length >= 2) {
    // 1. Recherche dans les départs
    for (const dep of departsSummary) {
      if (dep.id.toLowerCase().includes(q)) {
        results.push({ type: 'DEPART', id: dep.id, label: `Départ MT ${dep.id} (${dep.posteCount}P, ${dep.totalLengthKm} km)` });
      }
    }
    // 2. Recherche dans les 2 660 Postes du catalogue 2025
    const allPostes = fullTablesData['POSTE_2025']?.rows || [];
    const topologyDepartByPoste = getNodeDepartIndex();
    for (const p of allPostes) {
      const pId = String(p.id || p.code || '');
      const topologyDepartId = topologyDepartByPoste.get(pId);
      const pNom = String(p.nom || '');
      const pLoc = String(p.localite || '');
      if (topologyDepartId && (pId.toLowerCase().includes(q) || pNom.toLowerCase().includes(q) || pLoc.toLowerCase().includes(q))) {
        results.push({
          type: 'POSTE',
          id: pId,
          depId: topologyDepartId,
          label: `${pNom || pId} · ${p.pi || 0} kVA · ${pLoc || p.district || ''}`
        });
      }
      if (results.length >= 25) break;
    }
    // Compléter la recherche avec le réseau topologique si le catalogue 2025 est partiel.
    if (results.length < 25) {
      const seenPosteIds = new Set(results.filter(item => item.type === 'POSTE').map(item => item.id));
      for (const [depId, depart] of Object.entries(networkData.departs || {})) {
        for (const node of depart.nodes || []) {
          if (node.type !== 'POSTE_HTA_BT' || seenPosteIds.has(node.id)) continue;
          const pNom = String(node.meta?.nom || '');
          const pLoc = String(node.meta?.localite || '');
          if (String(node.id).toLowerCase().includes(q) || pNom.toLowerCase().includes(q) || pLoc.toLowerCase().includes(q)) {
            results.push({
              type: 'POSTE',
              id: String(node.id),
              depId,
              label: `${pNom || node.id} · ${node.meta?.p_instal || 0} kVA · ${pLoc}`
            });
            seenPosteIds.add(node.id);
          }
          if (results.length >= 25) break;
        }
        if (results.length >= 25) break;
      }
    }
    // 3. Recherche dans les 1 638 Appareils IACM
    if (results.length < 25) {
      const allIacms = fullTablesData['IACM_2025']?.rows || [];
      for (const iacm of allIacms) {
        const iCode = String(iacm.code || `J${iacm.num}`);
        const departId = getNodeDepartIndex().get(iCode);
        if (departId && (iCode.toLowerCase().includes(q) || String(iacm.agence || '').toLowerCase().includes(q))) {
          results.push({
            type: 'IACM',
            id: iCode,
              depId: departId,
            label: `${iCode} · ${iacm.positionLabel || (iacm.isOpen ? 'OUVERT' : 'FERMÉ')}`
          });
        }
        if (results.length >= 30) break;
      }
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
          ${!Object.keys(networkData.departs).length ? `
            <div class="p-4 text-center text-xs text-blue-700">${escapeHtml(state.networkDataError || 'Chargement du réseau MT…')}</div>
          ` : q.length < 2 ? `
            <div class="p-4 text-center text-xs text-slate-400">Tapez au moins 2 caractères...</div>
          ` : results.length === 0 ? `
            <div class="p-4 text-center text-xs text-slate-400">Aucun résultat trouvé pour "${escapeHtml(q)}"</div>
          ` : results.map(r => `
            <div
              onclick="window.app.selectSearchResult('${escapeJsString(r.type)}', '${escapeJsString(r.id)}', '${escapeJsString(r.depId || r.id)}')"
              class="p-2 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer text-xs"
            >
              <div>
                <span class="font-mono font-bold text-slate-900">${escapeHtml(r.id)}</span>
                <span class="text-slate-600 block text-[11px]">${escapeHtml(r.label)}</span>
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
