import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  X,
  ExternalLink
} from 'lucide-react';
import fullTablesData from '../data/fullTablesData.json';

export const DataExplorerView: React.FC = () => {
  const tableNames = Object.keys(fullTablesData);
  const [selectedTable, setSelectedTable] = useState<string>('Poste_htabt_lig');
  const [activeSheet, setActiveSheet] = useState<'anomalie' | 'corrigé'>('anomalie');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const currentTable = (fullTablesData as Record<string, any>)[selectedTable];

  // Rows depending on active sheet
  const rawRows = useMemo(() => {
    if (!currentTable) return [];
    if (activeSheet === 'corrigé' && currentTable.rowsCorrige) {
      return currentTable.rowsCorrige;
    }
    return currentTable.rows || [];
  }, [currentTable, activeSheet]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rawRows;
    const q = searchQuery.toLowerCase().trim();
    return rawRows.filter((row: any) => {
      return Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      );
    });
  }, [rawRows, searchQuery]);

  // Paginated rows
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  // Headers
  const columns = useMemo(() => {
    if (rawRows.length === 0) return [];
    return Object.keys(rawRows[0] || {});
  }, [rawRows]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredRows.length === 0) return;
    const cols = columns;
    const csvContent = [
      cols.join(','),
      ...filteredRows.map((r: any) =>
        cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_${activeSheet}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filteredRows, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_${activeSheet}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Explorateur de Données &middot; 12 Fichiers Excel DBase</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Parcours &amp; Contrôle des Données d'Origine
          </h1>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Tables + Table Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table List (Left 1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block px-1">
            Tables Extraites
          </span>

          <div className="space-y-1">
            {tableNames.map((tName) => {
              const t = (fullTablesData as Record<string, any>)[tName];
              const isSelected = selectedTable === tName;
              return (
                <button
                  key={tName}
                  onClick={() => {
                    setSelectedTable(tName);
                    setActiveSheet('anomalie');
                    setPage(1);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className="truncate">{t.fileName}</span>
                  <span className="text-[11px] font-sans text-slate-500 tabular-nums">
                    {t.totalRows}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content (Right 3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Table Top Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-slate-900">
                {currentTable?.fileName}
              </span>

              {/* Sheet tabs if multiple exist */}
              {currentTable?.sheets?.length > 1 && (
                <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg">
                  <button
                    onClick={() => {
                      setActiveSheet('anomalie');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      activeSheet === 'anomalie'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    anomalie ({currentTable.totalRows})
                  </button>
                  <button
                    onClick={() => {
                      setActiveSheet('corrigé');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      activeSheet === 'corrigé'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    corrigé ({currentTable.totalRowsCorrige})
                  </button>
                </div>
              )}
            </div>

            {/* Search filter input */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer dans la table..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white text-slate-900 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 shadow-2xs"
              />
            </div>
          </div>

          {/* Table View */}
          <div className="flex-1 overflow-x-auto min-h-[420px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-500 w-12 text-center">#</th>
                  {columns.map((c) => (
                    <th key={c} className="py-2.5 px-3 font-semibold font-mono whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-12 text-center text-slate-500 text-xs">
                      Aucun enregistrement ne correspond aux critères de recherche.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row: any, idx: number) => {
                    const rowNumber = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedRow(row)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400 select-none">
                          {rowNumber}
                        </td>
                        {columns.map((col) => {
                          const val = row[col];
                          const isCode = col === 'code' || col === 'n_depart' || col === 'noeud1' || col === 'noeud2';
                          const isAnomaly = col === 'anomalie' && val;

                          return (
                            <td
                              key={col}
                              className={`py-2 px-3 whitespace-nowrap max-w-xs truncate ${
                                isCode
                                  ? 'font-mono font-medium text-slate-900'
                                  : isAnomaly
                                  ? 'text-amber-800 bg-amber-50/50 font-mono text-[11px]'
                                  : 'text-slate-700'
                              }`}
                            >
                              {val !== undefined && val !== null ? String(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div>
              Affichage de <strong className="font-mono">{paginatedRows.length}</strong> sur <strong className="font-mono">{filteredRows.length}</strong> lignes
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs">
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row Details Modal */}
      {selectedRow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">
                  Enregistrement Détail &middot; {selectedTable}
                </span>
                <div className="text-base font-mono font-bold text-slate-900">
                  {selectedRow.code || selectedRow.nom_depart || selectedRow.nom_pst || 'Fiche Ouvrage'}
                </div>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedRow).map(([key, val]) => (
                  <div key={key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 block text-[10px] font-mono">{key}</span>
                    <strong className="text-slate-900 font-mono text-xs break-all">
                      {val !== undefined && val !== null ? String(val) : '—'}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
