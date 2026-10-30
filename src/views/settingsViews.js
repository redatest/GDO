/**
 * Vues secondaires des paramètres et tables réseau.
 * Le contexte et l'état sont injectés par le module applicatif.
 */
export function renderTablesView({ state, fullTablesData, escapeHtml, formatNumber })
  if (!Object.keys(fullTablesData).length) {
    return '<div class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-xs font-semibold text-blue-800">' + escapeHtml(state.dataLoadError || 'Chargement des tables réseau…') + '</div>';
  }
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
        <span class="text-xs font-bold text-slate-700">Tables historiques &amp; référentiels 2025</span>
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
            <option value="${escapeHtml(tName)}" ${tName === state.tableSelected ? 'selected' : ''}>
              ${escapeHtml(fullTablesData[tName].fileName || fullTablesData[tName].title || tName)} (${formatNumber(fullTablesData[tName].totalRows ?? fullTablesData[tName].rows?.length ?? 0)} lig.)
            </option>
          `).join('')}
        </select>

        <input
          type="text"
          id="tableSearchInput"
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

// --- MODAL AJOUT TRANSFORMATEUR ---
export function renderNewTransfoModal(state)
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
export function renderNewConducteurModal(state)
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
