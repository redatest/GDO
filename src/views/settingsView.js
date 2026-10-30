/**
 * GDO-MT — Vue des paramètres et référentiels.
 * Les dépendances applicatives sont injectées par app.js.
 */

export function renderSettingsView({ state, fullTablesData, escapeHtml, formatNumber }) {
  const { transfos, conducteurs, seuils } = state.settings;

  return `
    <div class="p-4 space-y-4 max-w-screen-2xl mx-auto">
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
      <div class="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs" role="tablist" aria-label="Sections des paramètres">
        <button
          onclick="window.app.setSettingsSubTab('transfos')" role="tab" aria-selected="${state.settingsSubTab === 'transfos'}"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.settingsSubTab === 'transfos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Transfos
        </button>
        <button
          onclick="window.app.setSettingsSubTab('conducteurs')" role="tab" aria-selected="${state.settingsSubTab === 'conducteurs'}"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.settingsSubTab === 'conducteurs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Lignes
        </button>
        <button
          onclick="window.app.setSettingsSubTab('seuils')" role="tab" aria-selected="${state.settingsSubTab === 'seuils'}"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.settingsSubTab === 'seuils' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Seuils MT
        </button>
        <button
          onclick="window.app.setSettingsSubTab('tables')" role="tab" aria-selected="${state.settingsSubTab === 'tables'}"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${state.settingsSubTab === 'tables' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}"
        >
          Données 2025 / Tables
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
                <span class="text-[10px] text-slate-400 block">${escapeHtml(t.desc || '')}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">${escapeHtml(t.type)}</span>
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
                <span class="font-mono font-bold text-slate-900 text-sm block">${escapeHtml(c.nom)}</span>
                <span class="text-slate-500 text-[11px]">R': ${c.r}&Omega;/km &middot; X': ${c.x}&Omega;/km &middot; Imax: ${c.iMax}A</span>
                <span class="text-[10px] text-slate-400 block">Pose: ${escapeHtml(c.pose)}</span>
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
      ${state.settingsSubTab === 'tables' ? renderTablesView({ state, fullTablesData, escapeHtml, formatNumber }) : ''}
    </div>
  `;
}
