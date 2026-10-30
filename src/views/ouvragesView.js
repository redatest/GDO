/**
 * GDO-MT — Vue du catalogue des ouvrages.
 * Les dépendances applicatives sont injectées par app.js.
 */

export function renderOuvragesView({ state, networkData, fullTablesData, getNodeDepartIndex, escapeHtml, escapeJsString, formatNumber }) {
  if (!Object.keys(networkData.departs).length) {
    return '<div class="p-8 text-center text-sm font-semibold text-blue-800">' + escapeHtml(state.networkDataError || 'Chargement du référentiel des ouvrages…') + '</div>';
  }
  const currentDepart = networkData.departs[state.selectedDepartId] || networkData.departs['127H1C3'] || networkData.departs['125H3C20'];
  const isGlobalScope = state.ouvragesScope === 'ALL';
  const departByNodeId = getNodeDepartIndex();
  const posteIdByShortCode = new Map((fullTablesData['POSTE_2025']?.rows || []).map(poste => [String(poste.id || '').slice(3), String(poste.id || '')]).filter(([shortCode, fullId]) => shortCode && fullId));

  let rawList = [];
  const fType = state.ouvragesFilterType;

  if (fType === 'P') {
    if (isGlobalScope) {
      // Le catalogue 2025 embarqué peut être partiel : compléter sans écraser ses fiches
      // avec les postes présents dans le référentiel topologique complet.
      const postesById = new Map();
      for (const item of (fullTablesData['POSTE_2025']?.rows || [])) {
        const id = String(item.id || item.code || '');
        if (id) postesById.set(id, { ...item, id });
      }
      for (const [depId, depart] of Object.entries(networkData.departs || {})) {
        for (const node of depart.nodes || []) {
          if (node.type !== 'POSTE_HTA_BT' || postesById.has(node.id)) continue;
          postesById.set(node.id, {
            id: node.id,
            nom: node.meta?.nom || node.id,
            localite: node.meta?.localite || '',
            pi: node.meta?.p_instal || 0,
            typePosteLabel: node.meta?.typePosteLabel || 'Poste HTA/BT',
            depart: depId
          });
        }
      }
      rawList = [...postesById.values()];
    } else {
      rawList = (currentDepart.nodes || []).filter(n => n.type === 'POSTE_HTA_BT').map(n => ({
        id: n.id,
        nom: n.meta?.nom || n.id,
        localite: n.meta?.localite || '',
        pi: n.meta?.p_instal || 0,
        typePosteLabel: n.meta?.typePosteLabel || 'Poste HTA/BT',
        depart: state.selectedDepartId
      }));
    }
  } else if (fType === 'J') {
    if (isGlobalScope) {
      rawList = fullTablesData['IACM_2025']?.rows || [];
    } else {
      rawList = (currentDepart.nodes || []).filter(n => n.type === 'INTERRUPTEUR_AERIEN').map(n => ({
        code: n.id,
        num: n.meta?.num || n.id,
        district: currentDepart.agency,
        positionLabel: n.meta?.positionLabel || (n.meta?.isOpen ? 'OUVERT (Coupure)' : 'FERMÉ (Passage)'),
        isOpen: n.meta?.isOpen || false,
        mode: n.meta?.mode || 'Manuel (M)',
        intensiteNominale: n.meta?.intensiteNominale || 200,
        depart: state.selectedDepartId
      }));
    }
  } else if (fType === 'T') {
    if (isGlobalScope) {
      rawList = fullTablesData['TRANSFO_MTBT_2025']?.rows || [];
    } else {
      // En vue Départ, utiliser les transformateurs réellement rattachés aux postes
      // de la topologie courante, plutôt que le catalogue global partiel.
      rawList = (currentDepart.nodes || [])
        .filter(node => node.type === 'POSTE_HTA_BT')
        .flatMap(node => (node.meta?.transformers || []).map(transformer => ({
          ...transformer,
          codePoste: node.id,
          posteNom: node.meta?.nom || node.id,
          depart: state.selectedDepartId
        })));
    }
  } else if (fType === 'L') {
    if (isGlobalScope) {
      rawList = fullTablesData['TRONCON_2025']?.rows || [];
    } else {
      // La table globale ne couvre pas tous les tronçons du référentiel topologique.
      // Reconstituer la vue du départ à partir de ses arcs, sans modifier les données sources.
      const tronconsById = new Map();
      for (const edge of currentDepart.edges || []) {
        const troncon = String(edge.troncon || '');
        if (!troncon) continue;
        const item = tronconsById.get(troncon) || {
          agence: currentDepart.agency || state.selectedDepartId.slice(0, 3),
          troncon,
          aerienM: 0,
          souterrainM: 0,
          totalM: 0
        };
        const longueur = Math.max(0, Number(edge.longueur) || 0);
        item.totalM += longueur;
        if (edge.isSouterrain) item.souterrainM += longueur;
        else item.aerienM += longueur;
        tronconsById.set(troncon, item);
      }
      rawList = [...tronconsById.values()];
    }
  } else if (fType === 'E') {
    rawList = (currentDepart.nodes || []).filter(n => n.type === 'ETOILEMENT').map(n => ({
      id: n.id,
      nom: `Étoilement ${n.id}`,
      localite: 'Piquage MT',
      depart: state.selectedDepartId
    }));
  }

  // Filtrage par texte de recherche
  let filtered = rawList;
  if (state.ouvragesSearch.trim()) {
    const q = state.ouvragesSearch.toLowerCase();
    filtered = rawList.filter(item => {
      return Object.values(item).some(v => String(v ?? '').toLowerCase().includes(q));
    });
  }

  const displayList = filtered.slice(0, 60);
  const isLoadingGlobalData = isGlobalScope && Object.keys(fullTablesData).length === 0;

  return `
    <div class="p-4 md:p-6 xl:p-8 space-y-3.5 md:space-y-5 max-w-screen-2xl mx-auto">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-base font-bold text-slate-900">Catalogue des Ouvrages MT</h1>
          <p class="text-xs text-slate-500">${isGlobalScope ? 'Ensemble du parc SDO Guelma (2025)' : `Départ ${state.selectedDepartId}`}</p>
        </div>

        <!-- Scope Switch (Départ vs Tout le parc) -->
        <div class="flex items-center bg-slate-200 p-0.5 rounded-lg text-[11px] font-semibold">
          <button
            onclick="window.app.setOuvragesScope('DEPART')"
            class="px-2 py-1 rounded-md transition-all cursor-pointer ${!isGlobalScope ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'}"
          >
            Départ
          </button>
          <button
            onclick="window.app.setOuvragesScope('ALL')"
            class="px-2 py-1 rounded-md transition-all cursor-pointer ${isGlobalScope ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'}"
          >
            Tout le Parc
          </button>
        </div>
      </div>

      <!-- Segmented Control Type d'Ouvrage -->
      <div class="flex items-center p-1 bg-slate-200/90 rounded-xl text-xs gap-1 overflow-x-auto">
        <button
          onclick="window.app.setOuvragesFilter('P')"
          class="flex-1 min-w-[70px] py-1.5 rounded-lg font-semibold transition-colors cursor-pointer text-center whitespace-nowrap ${fType === 'P' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Postes
        </button>
        <button
          onclick="window.app.setOuvragesFilter('J')"
          class="flex-1 min-w-[70px] py-1.5 rounded-lg font-semibold transition-colors cursor-pointer text-center whitespace-nowrap ${fType === 'J' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          IACM
        </button>
        <button
          onclick="window.app.setOuvragesFilter('T')"
          class="flex-1 min-w-[70px] py-1.5 rounded-lg font-semibold transition-colors cursor-pointer text-center whitespace-nowrap ${fType === 'T' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Transfos
        </button>
        <button
          onclick="window.app.setOuvragesFilter('L')"
          class="flex-1 min-w-[70px] py-1.5 rounded-lg font-semibold transition-colors cursor-pointer text-center whitespace-nowrap ${fType === 'L' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Tronçons
        </button>
        <button
          onclick="window.app.setOuvragesFilter('E')"
          class="flex-1 min-w-[70px] py-1.5 rounded-lg font-semibold transition-colors cursor-pointer text-center whitespace-nowrap ${fType === 'E' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Étoil.
        </button>
      </div>

      <!-- Barre de recherche -->
      <input
        type="text"
        id="ouvragesSearchInput"
        placeholder="Filtrer (ex: BEA, 8002, ENEL, 400, Maouna)..."
        value="${escapeHtml(state.ouvragesSearch)}"
        oninput="window.app.setOuvragesSearch(this.value)"
        class="w-full bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-300 shadow-2xs focus:outline-blue-500"
      />

      <!-- Liste des Ouvrages Mobile -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-[11px] font-bold text-slate-500">
            ${filtered.length} élément(s) ${filtered.length > 60 ? `(affichage des 60 premiers)` : ''} :
          </span>
          ${fType === 'J' ? `
            <span class="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              ${filtered.filter(x => x.position === 'O' || x.isOpen || (x.positionLabel && x.positionLabel.includes('OUVERT'))).length} IACM Ouverts
            </span>
          ` : ''}
        </div>

        ${isLoadingGlobalData ? '<div class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-xs font-semibold text-blue-800">' + escapeHtml(state.dataLoadError || 'Chargement du référentiel complet des ouvrages…') + '</div>' : displayList.map(item => {
          if (fType === 'P') {
            const id = item.id || item.code;
            const nom = item.nom || id;
            const pi = item.pi || item.p_instal || 0;
            const dep = departByNodeId.get(String(id)) || '';
            const hasMapNode = Boolean(dep);
            return `
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div class="truncate pr-2">
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-bold text-xs text-slate-900">${escapeHtml(id)}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                      ${escapeHtml(pi)} kVA
                    </span>
                    ${dep ? `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">${escapeHtml(dep)}</span>` : ''}
                  </div>
                  <span class="text-xs font-semibold text-slate-800 block truncate">${escapeHtml(nom)}</span>
                  <span class="text-[10px] text-slate-400 block">${escapeHtml(item.localite || item.district || 'SDO Guelma')} &middot; ${escapeHtml(item.typePosteLabel || 'Poste HTA/BT')}</span>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    ${hasMapNode ? '' : 'disabled'}
                    style="pointer-events:${hasMapNode ? 'auto' : 'none'};opacity:${hasMapNode ? 1 : 0.4}" onclick="window.app.showOuvrageOnMap('${escapeJsString(id)}', '${escapeJsString(dep)}')"
                    class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer"
                  >
                    ⚡ Schéma
                  </button>
                  <button
                    onclick="window.app.createInterventionForPoste('${escapeJsString(id)}', '${escapeJsString(nom)}')"
                    class="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer"
                  >
                    📝 Visite
                  </button>
                </div>
              </div>
            `;
          } else if (fType === 'J') {
            const code = item.code || `J${item.num}`;
            const isOpen = item.position === 'O' || item.isOpen || (item.positionLabel && item.positionLabel.includes('OUVERT'));
            const dep = departByNodeId.get(String(code)) || '';
            const hasMapNode = Boolean(dep);
            return `
              <div class="p-3 bg-white rounded-xl border ${isOpen ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'} shadow-2xs flex items-center justify-between">
                <div class="truncate pr-2">
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-bold text-xs text-slate-900">${escapeHtml(code)}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded ${isOpen ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800'}">
                      ${isOpen ? 'OUVERT (Coupure)' : 'FERMÉ (Passage)'}
                    </span>
                    ${dep ? `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">${escapeHtml(dep)}</span>` : ''}
                  </div>
                  <span class="text-xs font-semibold text-slate-700 block">${escapeHtml(item.mode || 'Manuel (M)')} &middot; Inom ${formatNumber(item.intensiteNominale || 200)} A</span>
                  <span class="text-[10px] text-slate-400 block">Agence ${escapeHtml(item.agence || item.district || '121')} &middot; MES: ${escapeHtml(item.dateMES || '31-12-2025')}</span>
                </div>

                <div class="shrink-0">
                  <button
                    ${hasMapNode ? '' : 'disabled'}
                    style="pointer-events:${hasMapNode ? 'auto' : 'none'};opacity:${hasMapNode ? 1 : 0.4}" onclick="window.app.showOuvrageOnMap('${escapeJsString(code)}', '${escapeJsString(dep)}')"
                    class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer"
                  >
                    ⚡ Schéma
                  </button>
                </div>
              </div>
            `;
          } else if (fType === 'T') {
            const rawPosteCode = String(item.codePoste || item.code || '');
            const pCode = /^\d{3}P/.test(rawPosteCode) ? rawPosteCode : (posteIdByShortCode.get(rawPosteCode) || '');
            const dep = pCode ? (departByNodeId.get(pCode) || '') : '';
            const hasMapNode = Boolean(pCode && dep);
            const pwr = item.puissanceKva || 0;
            return `
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div class="truncate pr-2">
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-bold text-xs text-slate-900">${escapeHtml(pCode)} &middot; Trf ${escapeHtml(item.numTransfo || 1)}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900">
                      ${escapeHtml(pwr)} kVA
                    </span>
                  </div>
                  <span class="text-xs font-semibold text-slate-700 block">${escapeHtml(item.marque || 'Fabricant normalisé')} ${item.numSerie ? '&middot; S/N: ' + escapeHtml(item.numSerie) : ''}</span>
                  <span class="text-[10px] text-slate-400 block">${item.anneeFab ? 'Fab: ' + escapeHtml(item.anneeFab) + ' &middot; ' : ''}${item.iNomMT ? escapeHtml(item.iNomMT) + 'A MT' : '30 kV / 400 V'}</span>
                </div>
                <div class="shrink-0">
                  <button
                    ${hasMapNode ? '' : 'disabled'}
                    style="pointer-events:${hasMapNode ? 'auto' : 'none'};opacity:${hasMapNode ? 1 : 0.4}" onclick="window.app.showOuvrageOnMap('${escapeJsString(pCode)}', '${escapeJsString(dep)}')"
                    class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer"
                  >
                    ⚡ Schéma
                  </button>
                </div>
              </div>
            `;
          } else if (fType === 'L') {
            return `
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div class="truncate pr-2">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-mono font-bold text-xs text-slate-900">Tronçon ${escapeHtml(item.troncon)}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      Total: ${formatNumber(item.totalM)} m
                    </span>
                    ${item.souterrainM > 0 ? `
                      <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                        🚇 Sout: ${formatNumber(item.souterrainM)} m
                      </span>
                    ` : ''}
                    ${item.aerienM > 0 ? `
                      <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        ⚡ Aér: ${formatNumber(item.aerienM)} m
                      </span>
                    ` : ''}
                    <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-50 text-slate-500">Agence ${escapeHtml(item.agence)}</span>
                  </div>
                  <span class="text-xs text-slate-600 block mt-1">
                    Répartition : ${item.souterrainM > 0 && item.aerienM > 0 ? 'Mixte (Aérien + Câble Souterrain)' : (item.souterrainM > 0 ? 'Câble 100% Souterrain' : 'Ligne 100% Aérienne')}
                  </span>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span class="font-mono font-bold text-xs text-slate-900">${escapeHtml(item.id)}</span>
                  <span class="text-xs text-slate-500 block">${escapeHtml(item.nom)}</span>
                </div>
                <button
                  onclick="window.app.showOuvrageOnMap('${escapeJsString(item.id)}', '${escapeJsString(item.depart)}')"
                  class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer"
                >
                  ⚡ Schéma
                </button>
              </div>
            `;
          }
        }).join('')}
      </div>
    </div>
  `;
}
