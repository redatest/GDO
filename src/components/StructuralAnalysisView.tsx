import React, { useState } from 'react';
import { 
  Layers, 
  Database, 
  Key, 
  HelpCircle, 
  Code2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  GitFork,
  Cpu,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import tableSchemasData from '../data/tableSchemas.json';

export const StructuralAnalysisView: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('Arc');
  const [expandedSection, setExpandedSection] = useState<string>('nomenclature');

  const currentSchema = tableSchemasData.find(t => t.tableName === selectedTable) || tableSchemasData[0];

  const tableDictionary: Record<string, { role: string; primaryKey: string; foreignKeys: string[]; description: string }> = {
    'Poste_source': {
      role: 'Injection Principale HTB / HTA (Sous-station)',
      primaryKey: 'code (ex: 125H3, 125H2)',
      foreignKeys: ['commune -> Code Commune INSEE/ONS', 'agence -> Agence de distribution'],
      description: 'Représente le poste électrique source recevant la très haute / haute tension (60 kV ou 90 kV) du réseau de transport et la transformant en moyenne tension (30 kV) via 2 transformateurs de puissance.'
    },
    'Depart': {
      role: 'Départ Feeder MT',
      primaryKey: 'code (ex: 121H5C3)',
      foreignKeys: ['id_cellule -> Cellule', 'id_district -> District/Agence'],
      description: 'Ligne ou artère moyenne tension issue d’une cellule disjoncteur du poste source alimentant une zone géographique rurale ou urbaine.'
    },
    'Cellule': {
      role: 'Appareillage MT (Disjoncteur, Interrupteur)',
      primaryKey: 'code (ex: 121H5C1)',
      foreignKeys: ['n_poste -> Poste Source/Coupure', 'n_depart -> Départ MT'],
      description: 'Armoire métallique sous enveloppe (switchgear) logeant les organes de coupure, de protection et de mesure au poste source ou poste de coupure.'
    },
    'Jeubarre': {
      role: 'Jeu de Barres MT',
      primaryKey: 'code (ex: 121H5B1)',
      foreignKeys: ['n_poste -> Poste', 'n_depart -> Départ'],
      description: 'Conducteurs rigides en cuivre (CU) ou alu servant de nœud collecteur d’énergie pour distribuer le courant vers l’ensemble des cellules de départs.'
    },
    'Poste_coupure': {
      role: 'Organe de Sectionnement en Réseau (PC)',
      primaryKey: 'code (ex: 121O1)',
      foreignKeys: ['commune', 'agence'],
      description: 'Poste intermédiaire équipé d’interrupteurs permettant de fractionner le réseau, de secourir un départ par un autre (bouclage ouvert) et d’isoler des tronçons en défaut.'
    },
    'Poste_repartition': {
      role: 'Poste de Répartition MT',
      primaryKey: 'code (ex: 121R2)',
      foreignKeys: ['commune', 'agence'],
      description: 'Sous-station de distribution sans transformation de tension (nœud de dégroupage ou réexpédition de départs MT).'
    },
    'Poste_htabt_lig': {
      role: 'Poste de Transformation HTA / BT (Distribution finale)',
      primaryKey: 'code (ex: 121P8002)',
      foreignKeys: ['n_depart -> Départ', 'commune -> Commune'],
      description: 'Poste abaisseur 30 kV / 400 V destiné à l’alimentation des consommateurs. Comprend les postes maçonnés au sol (MS) et les transformateurs haut de poteau (AC).'
    },
    'Poste_htabt_pst': {
      role: 'Poste HTA / BT Intégré en Cabine',
      primaryKey: 'code (ex: 121O1P85)',
      foreignKeys: ['n_depart -> Départ', 'n_postepc -> Poste Coupure'],
      description: 'Postes HTA/BT physiquement intégrés ou accolés à un poste de coupure ou une infrastructure spécifique.'
    },
    'Etoilement_lig': {
      role: 'Nœud de Bifurcation / Piquage de Ligne',
      primaryKey: 'code (ex: 121E1)',
      foreignKeys: ['n_depart -> Départ', 'commune -> Commune'],
      description: 'Support aérien (poteau de dérivation) où la ligne principale se divise en une ou plusieurs dérivations (antennes).'
    },
    'Segment': {
      role: 'Tronçon Topologique Physique de Ligne',
      primaryKey: 'code (ex: 121E1-121J1011)',
      foreignKeys: ['noeud1 -> Nœud amont', 'noeud2 -> Nœud aval', 'n_depart -> Départ'],
      description: 'Représente le tronçon continu reliant deux nœuds consécutifs du réseau, avec son ordre (rang) et son identifiant de tronçon.'
    },
    'Arc': {
      role: 'Branche Électrique & Armements Matériels',
      primaryKey: 'code (ex: 121E1-121J1011:11)',
      foreignKeys: ['noeud1', 'noeud2', 'n_depart'],
      description: 'Table centrale de modélisation électrique et mécanique : longueur, conducteur (Almélec/Cuivre), section (mm²), type de pose, et inventaire exhaustif des supports (poteaux béton, bois, métallique).'
    },
    'Alimentation': {
      role: 'Schéma d’Alimentation et de Secours',
      primaryKey: 'code (ex: 112J342)',
      foreignKeys: ['num_depart -> Départ', 'id_dd -> District'],
      description: 'Définit les points d’alimentation normaux et de secours pour chaque portion de réseau lors des manœuvres d’exploitation.'
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <span>Rétro-Ingénierie &middot; Analyse Système Legacy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Structure &amp; Modèle de Données DBase (GDO MT)
        </h1>
        <p className="text-sm text-slate-600 max-w-4xl leading-relaxed">
          Décryptage architectural du modèle de données extrait des tables DBase III / FoxPro. Découvrez la logique de codification normalisée, les 12 entités physiques et leurs relations topologiques.
        </p>
      </div>

      {/* Nomenclature Breakdown Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Nomenclature des Codes &amp; Clés Primaires DBase
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          L'ancien logiciel utilisait une règle de codage alphanumérique compacte très rigoureuse permettant d’identifier immédiatement la localisation, le type d’ouvrage et son numéro d'ordre :
        </p>

        {/* Visual Code Decomposition */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="text-xs font-semibold text-slate-700">
            Exemple 1 : Code Départ MT <code className="text-sm font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">125H3C20</code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="font-mono font-bold text-base text-blue-600">125</span>
              <strong className="block text-slate-900 font-semibold">Agence / District</strong>
              <p className="text-slate-500 text-[11px]">District de distribution (ex: 121 Guelma, 123 Oued Zenati, 125 Bouchegouf / Sedrata).</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="font-mono font-bold text-base text-purple-600">H</span>
              <strong className="block text-slate-900 font-semibold">Type Ouvrage Source</strong>
              <p className="text-slate-500 text-[11px]"><code className="font-bold">H</code> = Poste Source Haute Tension (HTB / HTA).</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="font-mono font-bold text-base text-purple-600">3</span>
              <strong className="block text-slate-900 font-semibold">N° du Poste Source</strong>
              <p className="text-slate-500 text-[11px]">Poste n°3 de l'agence (ex: Poste Source de NADOR 60/30 kV).</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="font-mono font-bold text-base text-emerald-600">C20</span>
              <strong className="block text-slate-900 font-semibold">Cellule de Départ</strong>
              <p className="text-slate-500 text-[11px]">Disjoncteur / Cellule MT n°20 alimentant le départ sur le jeu de barres.</p>
            </div>
          </div>
        </div>

        {/* Prefix Directory Grid */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700">
            Dictionnaire des Préfixes d'Ouvrages :
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-mono font-bold text-purple-700 text-sm">H</div>
              <strong className="text-slate-800 block text-[11px]">Poste Source</strong>
              <span className="text-slate-500 text-[10px]">60/30kV ou 90/30kV</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-mono font-bold text-blue-700 text-sm">C</div>
              <strong className="text-slate-800 block text-[11px]">Cellule MT</strong>
              <span className="text-slate-500 text-[10px]">Départ / Arrivée</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-mono font-bold text-indigo-700 text-sm">B</div>
              <strong className="text-slate-800 block text-[11px]">Jeu de Barres</strong>
              <span className="text-slate-500 text-[10px]">Collecteur 30 kV</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-mono font-bold text-emerald-700 text-sm">O</div>
              <strong className="text-slate-800 block text-[11px]">Poste Coupure</strong>
              <span className="text-slate-500 text-[10px]">PC en réseau</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-mono font-bold text-teal-700 text-sm">E</div>
              <strong className="text-slate-800 block text-[11px]">Étoilement</strong>
              <span className="text-slate-500 text-[10px]">Piquage de ligne</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-mono font-bold text-amber-700 text-sm">P</div>
              <strong className="text-slate-800 block text-[11px]">Poste HTA/BT</strong>
              <span className="text-slate-500 text-[10px]">Transfo 30kV/400V</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-mono font-bold text-slate-700 text-sm">J</div>
              <strong className="text-slate-800 block text-[11px]">Jonction</strong>
              <span className="text-slate-500 text-[10px]">Support / Poteau</span>
            </div>
          </div>
        </div>
      </div>

      {/* Relational Entity-Relationship Diagram (MCD) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Modèle Conceptuel de Données (MCD / MLD Réseau)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">12 Tables Relationnelles</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Schéma des relations topologiques et fonctionnelles entre les tables du système GDO MT :
        </p>

        {/* Visual Relationship Flow */}
        <div className="p-5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <div className="text-center md:text-left">
              <span className="text-violet-400 font-bold">Poste_source</span>
              <span className="text-slate-400 block text-[10px]">code (ex: 125H3)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />
            <div className="text-center md:text-left">
              <span className="text-indigo-400 font-bold">Jeubarre</span>
              <span className="text-slate-400 block text-[10px]">code (ex: 125H3B1)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />
            <div className="text-center md:text-left">
              <span className="text-blue-400 font-bold">Cellule</span>
              <span className="text-slate-400 block text-[10px]">code (ex: 125H3C20)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />
            <div className="text-center md:text-left">
              <span className="text-emerald-400 font-bold">Depart</span>
              <span className="text-slate-400 block text-[10px]">code (ex: 125H3C20)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
              <span className="text-teal-400 font-bold">Arc &amp; Segment</span>
              <p className="text-slate-400 text-[10px] font-sans">
                Liaisons physiques entre nœuds (noeud1 &rarr; noeud2). Modélise la longueur (m), le conducteur (AM/CU), la section (mm²) et l'armement des supports.
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
              <span className="text-amber-400 font-bold">Poste_htabt_lig / pst</span>
              <p className="text-slate-400 text-[10px] font-sans">
                Postes abaisseurs 30 kV / 400 V rattachés à chaque départ. Puissance installée (kVA), type maçonné (MS) ou poteau (AC).
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
              <span className="text-purple-400 font-bold">Poste_coupure &amp; rep</span>
              <p className="text-slate-400 text-[10px] font-sans">
                Postes de coupure réseau (PC) et de répartition pour manœuvrer et secourir les charges en cas d'avarie.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Table Dictionary & Columns Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Selector (Left) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Tables Analysées (12)
          </h3>
          <div className="space-y-1">
            {tableSchemasData.map((t) => (
              <button
                key={t.tableName}
                onClick={() => setSelectedTable(t.tableName)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                  selectedTable === t.tableName
                    ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="truncate">
                  <span>{t.fileName}</span>
                </div>
                <span className="text-[11px] font-sans text-slate-500 tabular-nums">
                  {t.rowCount} lig.
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Table Details (Right 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {currentSchema.fileName}
              </h2>
              <p className="text-xs text-indigo-700 font-medium">
                {tableDictionary[currentSchema.tableName]?.role || 'Table Réseau MT'}
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-slate-900 font-mono tabular-nums">{currentSchema.rowCount}</span> lignes
              <span className="text-slate-400 block text-[11px]">{currentSchema.fields.length} colonnes</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {tableDictionary[currentSchema.tableName]?.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">Clé Primaire Logique</span>
              <strong className="font-mono text-slate-900">
                {tableDictionary[currentSchema.tableName]?.primaryKey || 'code'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Clés Étrangères / Références</span>
              <span className="font-mono text-slate-700 text-[11px]">
                {tableDictionary[currentSchema.tableName]?.foreignKeys?.join(', ') || 'n_depart, agence, commune'}
              </span>
            </div>
          </div>

          {/* Columns Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">
              Dictionnaire des Colonnes DBase :
            </h4>
            <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Nom Colonne DBase</th>
                    <th className="py-2 px-3 font-semibold">Type Détecté</th>
                    <th className="py-2 px-3 font-semibold">Exemple de Valeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentSchema.fields.map((f) => (
                    <tr key={f.name} className="hover:bg-slate-50/70">
                      <td className="py-1.5 px-3 font-mono font-medium text-slate-900">
                        {f.name}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500">
                        {f.type}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-[11px] text-slate-700 truncate max-w-xs">
                        {String(f.sample ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
