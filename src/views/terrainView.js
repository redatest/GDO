/**
 * GDO-MT — Carnet de terrain et visites techniques.
 * Les dépendances applicatives sont injectées par app.js.
 */

export function renderTerrainView({ state, networkData, escapeHtml, escapeJsString }) {
  if (!Object.keys(networkData.departs).length) {
    return '<div class="p-8 text-center text-sm font-semibold text-blue-800">' + escapeHtml(state.networkDataError || 'Chargement du réseau moyenne tension…') + '</div>';
  }
  const currentDepart = networkData.departs[state.selectedDepartId] || networkData.departs['127H1C3'];
  const posteOptions = currentDepart.nodes.filter(n => n.type === 'POSTE_HTA_BT');

  return `
    <div class="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 class="text-base font-bold text-slate-900">Carnet de Terrain &amp; Visites Techniques</h1>
        <p class="text-xs text-slate-500">Relevés d'anomalies, fiches d'inspection et contrôle des postes MT</p>
      </div>

      ${state.visitSuccessNotice ? `
        <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>&check; Visite enregistrée avec succès dans le stockage local !</span>
          <button onclick="window.app.closeVisitSuccessNotice()" class="text-emerald-900 font-bold" aria-label="Fermer le message de confirmation">&times;</button>
        </div>
      ` : ''}

      <!-- Formulaire Tactile d'Inspection sur Site -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span>📝 Nouvelle Fiche de Visite de Poste</span>
        </h2>

        <form onsubmit="window.app.saveIntervention(event)" class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 font-semibold text-[11px] mb-1">Poste MT à inspecter</label>
            <select
              id="fieldVisitPoste"
              class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 font-mono text-xs font-semibold"
            >
              ${!posteOptions.some(p => String(p.id) === String(state.newVisitPosteId)) && state.newVisitPosteId ? `
                <option value="${escapeHtml(state.newVisitPosteId)}" selected>
                  ${escapeHtml(state.newVisitPosteId)} · ${escapeHtml(state.newVisitPosteNom || 'Poste sélectionné')}
                </option>
              ` : ''}
              ${posteOptions.map(p => `
                <option value="${escapeHtml(p.id)}" ${String(p.id) === String(state.newVisitPosteId) ? 'selected' : ''}>
                  ${escapeHtml(p.id)} · ${escapeHtml(p.meta?.nom || 'Poste')} (${escapeHtml(p.meta?.p_instal || 160)} kVA)
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Type de Contrôle</label>
              <select id="fieldVisitType" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs">
                <option value="Inspection Visuelle Générale">Inspection Visuelle Générale</option>
                <option value="Contrôle Huile Transfo">Contrôle Huile &amp; Étanchéité</option>
                <option value="Vérification Fusibles MT / BT">Vérification Fusibles &amp; Disjoncteur</option>
                <option value="Mesure Tension BT &amp; Équilibrage">Mesure Tension BT &amp; Équilibrage</option>
                <option value="Contrôle Terre &amp; Parafoudres">Prise de Terre &amp; Parafoudres</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Constat Technique</label>
              <select id="fieldVisitStatut" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs font-semibold">
                <option value="RAS" class="text-emerald-700">Bon état (RAS)</option>
                <option value="Anomalie Mineure" class="text-amber-700">Anomalie Mineure</option>
                <option value="Anomalie Critique" class="text-red-700">Anomalie Critique (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-600 font-semibold text-[11px] mb-1">Observations &amp; Relevés de Terrain</label>
            <textarea
              id="fieldVisitNotes"
              rows="3"
              placeholder="Ex : Niveau d'huile OK, tension 232V/402V, serrage des cosses BT effectué..."
              class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs text-slate-900"
            ></textarea>
          </div>

          <button
            type="submit"
            class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
          >
            &check; Enregistrer la visite dans GDO-MT
          </button>
        </form>
      </div>

      <!-- Historique des Visites Enregistrées -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold text-slate-700">Historique des Visites (${state.interventions.length})</span>
          <button
            onclick="window.app.exportInterventions()"
            class="text-xs text-blue-600 font-bold cursor-pointer"
          >
            Export JSON
          </button>
        </div>

        ${state.interventions.length === 0 ? `
          <div class="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Aucune visite enregistrée pour le moment.
          </div>
        ` : state.interventions.map(int => `
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="font-mono font-bold text-slate-900">${escapeHtml(int.posteId)}</span>
                <span class="text-[10px] text-slate-500 font-semibold">${escapeHtml(int.posteNom || '')}</span>
              </div>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${
                int.statut === 'RAS' ? 'bg-emerald-100 text-emerald-800' :
                int.statut === 'Anomalie Mineure' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }">
                ${escapeHtml(int.statut)}
              </span>
            </div>
            <div class="text-[11px] text-slate-600">${escapeHtml(int.type)}</div>
            <div class="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">${escapeHtml(int.note)}</div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>${escapeHtml(int.date)}</span>
              <button onclick="window.app.deleteIntervention('${escapeJsString(int.id)}')" class="text-red-500 hover:text-red-700 font-semibold cursor-pointer">Supprimer</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
