/**
 * GDO-MT — Historique des inspections thermographiques.
 * Les données sont conservées séparément des visites techniques.
 * Aucun fichier image ou thermogramme n'est stocké.
 */
export function renderThermovisionView({ state, escapeHtml, escapeJsString }) {
  const inspections = state.thermovisions || [];
  const severityClass = (severity) => ({
    Normal: 'bg-emerald-100 text-emerald-800',
    Surveillance: 'bg-amber-100 text-amber-800',
    Anomalie: 'bg-orange-100 text-orange-800',
    Critique: 'bg-red-100 text-red-800'
  }[severity] || 'bg-slate-100 text-slate-700');

  return `
    <div class="p-4 space-y-4 max-w-3xl mx-auto">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h1 class="text-base font-bold text-slate-900">Thermovision</h1>
          <p class="text-xs text-slate-500">Historique indépendant des inspections thermographiques des postes MT</p>
        </div>
        <button onclick="window.app.setTab('terrain')" class="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white">Nouvelle inspection</button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <div class="text-[10px] uppercase font-bold text-slate-500">Inspections</div>
          <div class="text-xl font-bold text-slate-900">${inspections.length}</div>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <div class="text-[10px] uppercase font-bold text-slate-500">Points mesurés</div>
          <div class="text-xl font-bold text-slate-900">${inspections.reduce((sum, item) => sum + (item.mesures?.length || 0), 0)}</div>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold text-slate-700">Historique des inspections (${inspections.length})</h2>
        <button onclick="window.app.exportThermovisions()" class="text-xs font-bold text-blue-700">Export JSON</button>
      </div>
      ${inspections.length === 0 ? `
        <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          Aucune inspection thermographique enregistrée.
          <div class="mt-2"><button onclick="window.app.setTab('terrain')" class="font-bold text-blue-700">Accéder au formulaire de visite et à son volet thermovision</button></div>
        </div>
      ` : inspections.map(item => `
        <article class="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-mono text-xs font-bold text-slate-900">${escapeHtml(item.posteId || '')} <span class="font-sans font-medium text-slate-500">${escapeHtml(item.posteNom || '')}</span></div>
              <div class="text-[10px] text-slate-500 mt-0.5">${escapeHtml(item.date || '')} ${item.inspecteur ? '· ' + escapeHtml(item.inspecteur) : ''}</div>
              ${item.temperatureAmbiante !== null && item.temperatureAmbiante !== undefined ? `<div class="text-[10px] text-slate-500">Température ambiante : ${escapeHtml(item.temperatureAmbiante)} °C</div>` : ''}
            </div>
            <span class="rounded-lg px-2 py-1 text-[9px] font-bold ${severityClass(item.criticite)}">${escapeHtml(item.criticite || 'Non classée')}</span>
          </div>
          <div class="space-y-1">
            ${(item.mesures || []).map(measure => `
              <div class="rounded-lg bg-slate-50 border border-slate-100 p-2 text-[10px]">
                <div class="font-bold text-slate-800">${escapeHtml(measure.equipement || 'Équipement')} · ${escapeHtml(measure.phase || '')} ${measure.point ? '· ' + escapeHtml(measure.point) : ''}</div>
                <div class="text-slate-600 mt-0.5">Mesurée : <strong>${measure.temperature ?? '—'} °C</strong> ${measure.reference !== null && measure.reference !== undefined ? '· Référence : ' + escapeHtml(measure.reference) + ' °C · ΔT : ' + escapeHtml(measure.deltaT) + ' °C' : ''}</div>
              </div>
            `).join('')}
          </div>
          ${item.observations ? `<p class="text-[11px] text-slate-700">${escapeHtml(item.observations)}</p>` : ''}
          ${item.recommandations ? `<p class="text-[11px] text-blue-800 bg-blue-50 rounded-lg p-2"><strong>Recommandations :</strong> ${escapeHtml(item.recommandations)}</p>` : ''}
          <div class="flex justify-end border-t border-slate-100 pt-2">
            <button onclick="window.app.deleteThermovision('${escapeJsString(item.id)}')" class="text-[10px] font-semibold text-red-600">Supprimer cette inspection</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}
