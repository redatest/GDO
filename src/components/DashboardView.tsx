import React from 'react';
import { 
  Zap, 
  Layers, 
  MapPin, 
  AlertTriangle, 
  ArrowRight, 
  Cpu, 
  Activity, 
  Share2, 
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import departsSummaryData from '../data/departsSummary.json';
import tableSchemasData from '../data/tableSchemas.json';

interface DashboardViewProps {
  onSelectDepart: (departId: string) => void;
  onNavigateTab: (tab: 'topology' | 'structural' | 'architecture' | 'explorer') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectDepart, onNavigateTab }) => {
  const topDeparts = departsSummaryData.slice(0, 8);
  const totalKm = departsSummaryData.reduce((acc, d) => acc + d.totalLengthKm, 0).toFixed(1);
  const totalPostes = departsSummaryData.reduce((acc, d) => acc + d.posteCount, 0);
  const totalPower = departsSummaryData.reduce((acc, d) => acc + d.totalPowerKva, 0);
  const totalArcs = departsSummaryData.reduce((acc, d) => acc + d.arcCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Hero Executive Brief */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 tracking-wide uppercase">
              <span>Diagnostic de Modernisation &middot; Données Legacy DBase / FoxPro</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Gestion des Ouvrages Moyenne Tension (GDO MT)
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Analyse complète et rétro-ingénierie des 12 fichiers Excel extraits du système historique de gestion du réseau de distribution électrique HTA (30 kV). Ce portail reconstitue l’architecture physique complète du réseau, cartographie les 51 départs, et structure la trajectoire vers une application web moderne (PostgreSQL/PostGIS + API REST).
            </p>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('topology')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Explorer la Topologie</span>
            </button>
            <button
              onClick={() => onNavigateTab('structural')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Modèle Relationnel DBase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Network Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Départs Moyenne Tension</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            51
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Alimentés via Postes Sources
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Linéaire Total MT</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalKm} <span className="text-sm font-normal text-slate-500">km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalArcs.toLocaleString('fr-FR')} arcs de lignes aériennes/souterraines
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Postes HTA / BT</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalPostes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Transformateurs 30 kV / 400 V
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Puissance Installée</span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalPower.toLocaleString('fr-FR')} <span className="text-sm font-normal text-slate-500">kVA</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Puissance de transformation cumulée
          </div>
        </div>
      </div>

      {/* 2-Column Section: Physical Infrastructure & Top Feeders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Top Départs MT */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Principaux Départs MT &amp; Ramifications
              </h2>
              <p className="text-xs text-slate-500">
                Sélectionnez un départ pour visualiser son schéma unifilaire et sa topologie physique
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('topology')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Voir les 51 départs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Code Départ</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Longueur (km)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Arcs</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Postes HTA/BT</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Puissance (kVA)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topDeparts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>{d.id}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {d.totalLengthKm}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {d.arcCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                        {d.posteCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {d.totalPowerKva > 0 ? d.totalPowerKva.toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          onSelectDepart(d.id);
                          onNavigateTab('topology');
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                      >
                        Visualiser
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Physical Hierarchy & Substation Nodes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Postes Sources &amp; Organes de Coupure
          </h2>
          <p className="text-xs text-slate-500">
            Nœuds primaires d'injection et de coupure du réseau MT
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">125H3 &middot; NADOR</span>
                <span className="text-[10px] uppercase font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Poste Source HTB/HTA
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>Tension Primaire : <strong className="text-slate-800">60 kV</strong> &rarr; Secondaire : <strong className="text-slate-800">30 kV</strong></div>
                <div>Transformateurs : 2 &times; 40 MVA</div>
                <div>Commune : 2416 &middot; Agence : 125</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">125H2 &middot; MEDJEZ SFA</span>
                <span className="text-[10px] uppercase font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Poste Source HTB/HTA
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>Tension Primaire : <strong className="text-slate-800">90 kV</strong> &rarr; Secondaire : <strong className="text-slate-800">30 kV</strong></div>
                <div>Transformateurs : 2 &times; 10 MVA</div>
                <div>Commune : 2430 &middot; Agence : 125</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">121O1 &middot; PC FENDJEL</span>
                <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Poste de Coupure MT
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>Organe de sectionnement réseau (30 kV)</div>
                <div>Type : Maçonné Standard (MS) &middot; Agence : 121</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">121R2 &middot; PC AIN AMARA</span>
                <span className="text-[10px] uppercase font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Poste de Répartition
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>Sous-station de répartition MT</div>
                <div>Agence : 121 &middot; Commune : 2401</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Data Quality Audit & Physical Representation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Quality & Anomaly Report */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              Audit de Qualité des Fichiers Legacy (DBase)
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            L’export Excel d'origine présente des anomalies typiques de l'ancien moteur DBase III (colonnes tronquées, valeurs par défaut à 0.0, clés étrangères manquantes). Voici l’analyse des incohérences détectées dans les tables :
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
              <span className="font-mono font-bold text-amber-900 shrink-0">7 664</span>
              <div className="space-y-0.5">
                <strong className="text-amber-900 font-semibold">Tensions nulles ou erronées (0.0 V)</strong>
                <p className="text-amber-800">Dans <code className="font-mono text-[11px]">Arc.xls</code> et <code className="font-mono text-[11px]">Poste_htabt_lig.xls</code>, la tension de service n’a pas été renseignée dans DBase. Elle doit être normalisée à <strong>30 kV</strong> (ou 10 kV selon le secteur).</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="font-mono font-bold text-slate-800 shrink-0">6</span>
              <div className="space-y-0.5">
                <strong className="text-slate-800 font-semibold">Départs sans identifiant explicite (<code className="font-mono text-[11px]">num_depart null</code>)</strong>
                <p className="text-slate-600">Dans <code className="font-mono text-[11px]">Depart.xls</code>, l'ID logique est vide mais le code cellule (<code className="font-mono text-[11px]">num_depart_cellule</code>) permet de reconstituer l’arborescence exacte.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="font-mono font-bold text-slate-800 shrink-0">14</span>
              <div className="space-y-0.5">
                <strong className="text-slate-800 font-semibold">Arcs orphelins sans segment</strong>
                <p className="text-slate-600">Quelques dérivations n'ont pas de liaison 1-à-1 avec la table des segments physiques, indiquant des modifications non répercutées sur la saisie graphique dBase.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Topology Hierarchy Schema */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Modèle Physique de Distribution Moyenne Tension
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Le réseau électrique géré est une structure arborescente à plusieurs échelons de transformation et de sectionnement :
          </p>

          <div className="relative pl-6 space-y-4 border-l-2 border-indigo-200 ml-2 text-xs">
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
              <strong className="text-slate-900">1. Échelon Source (HTB / HTA)</strong>
              <p className="text-slate-500 mt-0.5">Poste Source (ex: NADOR 60/30kV) &rarr; Jeux de barres 30 kV &rarr; Cellules départ disjoncteur.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <strong className="text-slate-900">2. Artère Principale MT (Trunk Feeder)</strong>
              <p className="text-slate-500 mt-0.5">Lignes aériennes AM (Almélec 148 / 117 / 75 mm²) ou câbles souterrains reliant les postes de coupure.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
              <strong className="text-slate-900">3. Nœuds de Dérivation (Étoilements &amp; Jonctions)</strong>
              <p className="text-slate-500 mt-0.5">Piquages sur poteaux (codes E) distribuant la moyenne tension vers les antennes rurales et urbaines.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white"></div>
              <strong className="text-slate-900">4. Postes de Distribution HTA / BT (Postes P)</strong>
              <p className="text-slate-500 mt-0.5">Postes cabines (MS) et postes sur poteau (AC) abaissant à 230/400V pour alimenter les abonnés.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Breakdown Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Inventaire des 12 Fichiers Extraits du Système Legacy
            </h2>
            <p className="text-xs text-slate-500">
              Vue synthétique des tables relationnelles analysées
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('explorer')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Ouvrir l'explorateur de tables</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tableSchemasData.map((t) => (
            <div key={t.tableName} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-slate-800 truncate" title={t.fileName}>
                  {t.fileName}
                </span>
                <span className="font-mono text-xs text-slate-600 font-semibold tabular-nums">
                  {t.rowCount}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{t.fields.length} colonnes</span>
                {t.rowCountCorrige > 0 && (
                  <span className="text-emerald-700 font-medium">{t.rowCountCorrige} corrigés</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
