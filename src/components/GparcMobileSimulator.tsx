import React, { useState, useMemo } from 'react';
import { 
  Smartphone, 
  WifiOff, 
  MapPin, 
  Search, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Layers, 
  Share2, 
  Radio, 
  ChevronRight,
  RotateCcw,
  Compass
} from 'lucide-react';
import topologyData from '../data/networkTopology.json';
import departsSummaryData from '../data/departsSummary.json';
import { NetworkNode } from '../types/network';

export const GparcMobileSimulator: React.FC = () => {
  const [selectedDepartId, setSelectedDepartId] = useState<string>('125H3C20');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPosteId, setSelectedPosteId] = useState<string>('125P8002');
  const [interventionNote, setInterventionNote] = useState<string>('');
  const [anomalieType, setAnomalieType] = useState<string>('RAS');
  const [savedLocally, setSavedLocally] = useState<boolean>(false);
  const [localInterventions, setLocalInterventions] = useState<Array<{ id: string; posteId: string; date: string; type: string; note: string }>>([
    {
      id: 'INT-001',
      posteId: '121P8002',
      date: '28/10/2026 09:30',
      type: 'Contrôle Huile Transfo',
      note: 'Niveau d\'huile normal, disjoncteur BT OK.'
    }
  ]);

  const depart = (topologyData.departs as Record<string, any>)[selectedDepartId];
  const allPostes = useMemo(() => {
    if (!depart) return [];
    return depart.nodes.filter((n: NetworkNode) => n.type === 'POSTE_HTA_BT');
  }, [depart]);

  const filteredPostes = useMemo(() => {
    if (!searchQuery.trim()) return allPostes.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return allPostes.filter(
      (p: NetworkNode) =>
        p.id.toLowerCase().includes(q) ||
        (p.meta?.nom && p.meta.nom.toLowerCase().includes(q)) ||
        (p.meta?.localite && p.meta.localite.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [allPostes, searchQuery]);

  const currentPoste = useMemo(() => {
    return allPostes.find((p: NetworkNode) => p.id === selectedPosteId) || allPostes[0];
  }, [allPostes, selectedPosteId]);

  const handleSaveIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPoste) return;
    const newInt = {
      id: `INT-${String(localInterventions.length + 1).padStart(3, '0')}`,
      posteId: currentPoste.id,
      date: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: anomalieType,
      note: interventionNote || 'Visite d\'inspection périodique effectuée.'
    };
    setLocalInterventions([newInt, ...localInterventions]);
    setSavedLocally(true);
    setInterventionNote('');
    setTimeout(() => setSavedLocally(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Simulateur d'Application Mobile &middot; Architecture Type GPARC-Mobile</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interface Mobile de Terrain Déconnectée (SQLite Embarqué)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Découvrez comment les techniciens MT exploitent le réseau en zone rurale sur tablette / smartphone sans aucune connexion Internet ni serveur Node.js.
          </p>
        </div>

        {/* Offline Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shrink-0">
          <WifiOff className="w-3.5 h-3.5 text-amber-700" />
          <span>Mode Hors-Ligne Actif (SQLite 1,8 Mo)</span>
        </div>
      </div>

      {/* Simulator Device & Dashboard Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Smartphone / Rugged Tablet Frame (7 cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-slate-950 rounded-[38px] p-4 shadow-2xl border-4 border-slate-800 relative">
            {/* Speaker & Camera Notch */}
            <div className="w-32 h-4 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-800"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
            </div>

            {/* Mobile Screen Inside */}
            <div className="bg-slate-900 text-slate-100 rounded-[28px] overflow-hidden flex flex-col h-[650px] border border-slate-800 text-xs">
              {/* Mobile Top Bar */}
              <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
                <span className="font-bold text-slate-200">GPARC-MT Mobile</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-[10px]">&bull; GPS Actif</span>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>100%</span>
                </div>
              </div>

              {/* Mobile Department Selector */}
              <div className="p-3 bg-slate-850 border-b border-slate-800 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Départ Actif :</span>
                  <select
                    value={selectedDepartId}
                    onChange={(e) => {
                      setSelectedDepartId(e.target.value);
                      setSelectedPosteId('');
                    }}
                    className="bg-slate-800 text-slate-100 text-xs font-mono rounded px-2 py-1 border border-slate-700"
                  >
                    {departsSummaryData.slice(0, 15).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} ({d.posteCount} Postes)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Chercher poste (code ou nom)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 text-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs border border-slate-700 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Scrollable Content inside Mobile */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Selected Poste Card */}
                {currentPoste && (
                  <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-2.5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-400 block">
                          {currentPoste.id}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {currentPoste.meta?.nom || 'Poste HTA / BT'}
                        </span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                          <span>{currentPoste.meta?.localite || 'Wilaya Guelma (24)'}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {currentPoste.meta?.p_instal || 160} kVA
                      </span>
                    </div>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-900/80 rounded-lg font-mono">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Tension HTA</span>
                        <span className="text-slate-200">30 kV</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Type de Poste</span>
                        <span className="text-slate-200">{currentPoste.meta?.t_poste === 'MS' ? 'Cabine Maçonnée' : 'Poteau (AC)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Mise en service</span>
                        <span className="text-slate-200">{currentPoste.meta?.an_mes || '01/01/1985'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Commune</span>
                        <span className="text-slate-200">{currentPoste.meta?.commune || '2401'}</span>
                      </div>
                    </div>

                    {/* Offline Field Action Form */}
                    <form onSubmit={handleSaveIntervention} className="space-y-2 pt-1 border-t border-slate-700/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-300 uppercase">
                          Saisie d'Intervention Terrain :
                        </span>
                        {savedLocally && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Enregistré en SQLite local</span>
                          </span>
                        )}
                      </div>

                      <select
                        value={anomalieType}
                        onChange={(e) => setAnomalieType(e.target.value)}
                        className="w-full bg-slate-900 text-slate-200 text-xs rounded px-2.5 py-1.5 border border-slate-700"
                      >
                        <option value="RAS">RAS &mdash; Poste en bon état</option>
                        <option value="Huile">Fuite d'huile transformateur</option>
                        <option value="Fusible">Fusible MT à remplacer</option>
                        <option value="Elagage">Élagage nécessaire (branches sur ligne)</option>
                        <option value="Isolateur">Isolateur fissuré</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Commentaire technicien..."
                        value={interventionNote}
                        onChange={(e) => setInterventionNote(e.target.value)}
                        className="w-full bg-slate-900 text-slate-200 text-xs rounded px-2.5 py-1.5 border border-slate-700 placeholder-slate-500"
                      />

                      <button
                        type="submit"
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Valider Relevé Local</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* List of Other Substations in Depart */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase px-1">
                    Postes du départ ({filteredPostes.length}) :
                  </span>

                  <div className="space-y-1">
                    {filteredPostes.map((p: NetworkNode) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPosteId(p.id)}
                        className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between border cursor-pointer ${
                          selectedPosteId === p.id
                            ? 'bg-blue-950/60 border-blue-500/80 text-white'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-mono font-bold text-xs">{p.id}</span>
                          <span className="text-slate-400 block text-[10px] truncate">{p.meta?.nom || p.meta?.localite || 'Poste HTA/BT'}</span>
                        </div>
                        <span className="font-mono text-[10px] text-amber-400 font-semibold shrink-0">
                          {p.meta?.p_instal || 160} kVA
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Explanatory Specifications & Synchronization (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Pourquoi le Modèle GPARC-Mobile est Optimal</span>
            </h2>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-semibold">1. Zéro Dépendance Node.js</strong>
                <p>
                  L'application mobile (Flutter/Kotlin) compile en code machine natif ARM pour Android. Elle s'exécute directement sur l'OS mobile sans aucun serveur intermédiaire Node.js.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-semibold">2. Poids Dérisoire du Réseau MT</strong>
                <p>
                  L'ensemble des 12 fichiers dBase (les 7 678 arcs, 504 postes et 51 départs) pèse moins de <strong>2 mégaoctets</strong> sous SQLite. Une tablette Android d'entrée de gamme peut stocker l'intégralité du réseau de plusieurs wilayas.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-semibold">3. Synchronisation Différée (Offline-First)</strong>
                <p>
                  Les interventions enregistrées sur le terrain sont stockées dans la table locale SQLite avec un indicateur <code>is_synced = 0</code>. Dès que la tablette détecte le Wi-Fi de l'agence ou la 4G, elle transmet en bloc les relevés au serveur central Python ou PHP.
                </p>
              </div>
            </div>
          </div>

          {/* Local Interventions History */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Relevés Locaux en Attente de Synchro ({localInterventions.length})
              </h3>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono font-semibold">
                SQLite Local
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {localInterventions.map((it) => (
                <div key={it.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{it.posteId} &middot; {it.type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{it.date}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{it.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
