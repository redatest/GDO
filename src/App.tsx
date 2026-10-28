import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { GparcMobileSimulator } from './components/GparcMobileSimulator';
import { StructuralAnalysisView } from './components/StructuralAnalysisView';
import { ModernArchitectureView } from './components/ModernArchitectureView';
import { DataExplorerView } from './components/DataExplorerView';
import { Download, FileText, Check, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedDepartId, setSelectedDepartId] = useState<string>('125H3C20');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const reportText = `# RAPPORT DE SYNTHÈSE TECHNIQUE — GDO-MT (RÉSEAU MOYENNE TENSION)
Date d'analyse : 28 Octobre 2026
Source de données : Extraction de l'application legacy DBase / FoxPro (12 fichiers XLS)
Périmètre Réseau : Wilaya de Guelma (Districts 121, 123, 125, 127)
Contrainte Technique Clé : Architecture 100% SANS NODE.JS (Modèle GPARC-Mobile)

1. VOLUMÉTRIE & INVENTAIRE DES ÉLÉMENTS DU RÉSEAU
- Départs Moyenne Tension (HTA 30 kV) : 51 départs alimentés
- Linéaire Total de Réseau : 1 240,8 km de lignes
- Arcs de Lignes & Tronçons : 7 678 branches physiques
- Postes de Distribution HTA / BT : 504 transformateurs de distribution
- Puissance Totale Installée : ~38 450 kVA
- Nœuds de Bifurcation (Étoilements) : 378 piquages
- Postes Sources (HTB / HTA) : 2 sous-stations (125H3 NADOR 60/30kV, 125H2 MEDJEZ SFA 90/30kV)
- Postes de Coupure & Répartition : 1 PC Fendjel (121O1), 1 PC Ain Amara (121R2)

2. ANALYSE DU MODÈLE RELATIONNEL LEGACY (DBASE III / FOXPRO)
- Codification normalisée : [Agence 3 ch.][Type Ouvrage 1 car.][N° Ouvrage][Cellule]
  * H = Poste Source HTB/HTA
  * C = Cellule MT
  * B = Jeu de barres
  * O = Poste de Coupure (PC)
  * E = Étoilement de ligne (Piquage)
  * P = Poste HTA/BT (Transfo 30kV/400V)
  * J = Jonction de passage / Support
- 12 Tables relationnelles : Poste_source, Jeubarre, Cellule, Depart, Poste_coupure, 
  Poste_repartition, Poste_htabt_lig, Poste_htabt_pst, Etoilement_lig, Segment, Arc, Alimentation.

3. AUDIT DE QUALITÉ & ANOMALIES DÉTECTÉES
- Tensions nulles (0.0 V) : 7 664 arcs présentent une tension à 0 dans Arc.xls (à forcer à 30 kV).
- Identifiants de départs nuls : 6 départs dans Depart.xls ont 'num_depart' vide (à réconcilier via 'num_depart_cellule').
- Arcs orphelins : 14 arcs sans segment physique associé.

4. RECOMMANDATIONS SANS NODE.JS (TYPE GPARC-MOBILE)
- Option Mobile Terrain (Recommandée) : Flutter (Dart) ou Kotlin Android + Base locale SQLite embarquée.
  * Poids de la base locale pour 7 678 arcs et 504 postes : ~1,8 Mo.
  * Fonctionnement 100% hors-ligne sur le terrain (recherche poste < 2ms).
  * Synchronisation asynchrone lors de la reconnexion.
- Option Serveur Central : Python FastAPI / Django Rest Framework + NetworkX + PostgreSQL/PostGIS.
  * Zéro runtime Node.js.
  * Calculs topologiques et transits de puissance natifs en Python.
- Option Alternative : PHP 8.3 / Laravel + PostgreSQL (standard historique des SI d'entreprise).`;

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Rapport_Synthese_GDO_MT_Sans_NodeJS.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportReport={() => setShowExportModal(true)}
      />

      {/* Main Views Router */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardView
            onSelectDepart={(departId) => {
              setSelectedDepartId(departId);
            }}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'topology' && (
          <NetworkVisualizer
            selectedDepartId={selectedDepartId}
            onSelectDepart={(id) => setSelectedDepartId(id)}
          />
        )}

        {activeTab === 'mobile' && <GparcMobileSimulator />}

        {activeTab === 'structural' && <StructuralAnalysisView />}

        {activeTab === 'architecture' && <ModernArchitectureView />}

        {activeTab === 'explorer' && <DataExplorerView />}
      </main>

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Rapport de Synthèse d'Audit &amp; d'Architecture (Sans Node.js)
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {reportText}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                {copiedReport ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
                <span>{copiedReport ? 'Copié dans le presse-papier' : 'Copier le texte'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger (.md)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
