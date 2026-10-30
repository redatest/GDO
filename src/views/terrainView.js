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

        <div class="border-t border-slate-200 pt-3 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">Volet 2 — Inspection thermographique</h3>
              <p class="text-[10px] text-slate-500 mt-1">Enregistrement indépendant de la visite technique. Aucune image n’est stockée.</p>
            </div>
            <span class="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">THERMOVISION</span>
          </div>
          ${state.thermovisionSuccessNotice ? `
            <div class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex justify-between">
              <span>Inspection thermographique enregistrée.</span>
              <button type="button" onclick="window.app.closeThermovisionNotice()" aria-label="Fermer">&times;</button>
            </div>
          ` : ''}
          ${state.thermovisionError ? `<div role="alert" class="p-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold">${escapeHtml(state.thermovisionError)}</div>` : ''}
          <form onsubmit="window.app.saveThermovision(event)" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-slate-600 font-semibold text-[11px] mb-1">Date d’inspection</label>
                <input id="fieldThermoDate" type="date" value="${escapeHtml(state.thermovisionDraft?.date || new Date().toISOString().slice(0, 10))}" required class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs" />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold text-[11px] mb-1">Inspecteur</label>
                <input id="fieldThermoInspector" type="text" value="${escapeHtml(state.thermovisionDraft?.inspecteur || '')}" placeholder="Nom et prénom" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs" />
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-slate-700 font-bold text-[11px]">Équipements et points de mesure</label>
                <button type="button" onclick="window.app.addThermovisionRow()" class="text-[11px] text-blue-700 font-bold">+ Ajouter un point</button>
              </div>
              ${(state.thermovisionRows || []).map((measure, index) => `
                <div class="thermo-measure-row rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-slate-600">Point de mesure ${index + 1}</span>
                    ${state.thermovisionRows.length > 1 ? `<button type="button" onclick="window.app.removeThermovisionRow(${index})" class="text-[10px] text-red-600 font-semibold">Supprimer</button>` : ''}
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <input data-thermo-field="equipement" value="${escapeHtml(measure.equipement)}" placeholder="Équipement (cellule, transfo…)" required class="w-full min-w-0 bg-white rounded-lg p-2 border border-slate-300 text-[11px]" />
                    <select data-thermo-field="phase" class="w-full min-w-0 bg-white rounded-lg p-2 border border-slate-300 text-[11px]">
                      ${['A','B','C','N','Autre'].map(phase => `<option value="${phase}" ${measure.phase === phase ? 'selected' : ''}>${phase === 'Autre' ? 'Autre' : 'Phase ' + phase}</option>`).join('')}
                    </select>
                  </div>
                  <input data-thermo-field="point" value="${escapeHtml(measure.point)}" placeholder="Point précis (borne, cosse, connexion…)" class="w-full bg-white rounded-lg p-2 border border-slate-300 text-[11px]" />
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-slate-500 mb-1">Température mesurée (°C)</label>
                      <input data-thermo-field="temperature" type="number" step="0.1" required value="${escapeHtml(measure.temperature)}" placeholder="Ex. 68.5" class="w-full bg-white rounded-lg p-2 border border-slate-300 text-xs" />
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-500 mb-1">Température référence (°C)</label>
                      <input data-thermo-field="reference" type="number" step="0.1" value="${escapeHtml(measure.reference)}" placeholder="Facultatif" class="w-full bg-white rounded-lg p-2 border border-slate-300 text-xs" />
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-slate-600 font-semibold text-[11px] mb-1">Niveau de criticité</label>
                <select id="fieldThermoSeverity" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs">
                  <option value="Normal" ${state.thermovisionDraft?.criticite === 'Normal' ? 'selected' : ''}>Normal</option><option value="Surveillance" ${(state.thermovisionDraft?.criticite || 'Surveillance') === 'Surveillance' ? 'selected' : ''}>Surveillance</option><option value="Anomalie" ${state.thermovisionDraft?.criticite === 'Anomalie' ? 'selected' : ''}>Anomalie</option><option value="Critique" ${state.thermovisionDraft?.criticite === 'Critique' ? 'selected' : ''}>Critique</option>
                </select>
              </div>
              <div class="text-[10px] text-slate-500 self-end pb-2">ΔT calculé automatiquement si une température de référence est saisie.</div>
            </div>
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Observations / diagnostic</label>
              <textarea id="fieldThermoNotes" rows="2" placeholder="Description de l’échauffement constaté…" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs">${escapeHtml(state.thermovisionDraft?.observations || '')}</textarea>
            </div>
            <div>
              <label class="block text-slate-600 font-semibold text-[11px] mb-1">Recommandations / actions à entreprendre</label>
              <textarea id="fieldThermoRecommendations" rows="2" placeholder="Contrôle, resserrage, remplacement, nouvelle mesure…" class="w-full bg-slate-50 rounded-lg p-2 border border-slate-300 text-xs">${escapeHtml(state.thermovisionDraft?.recommandations || '')}</textarea>
            </div>
            <button type="submit" class="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-xs">Enregistrer l’inspection thermographique</button>
          </form>
        </div>
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
