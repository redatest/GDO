import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Search, 
  Filter, 
  Info, 
  Zap, 
  Share2, 
  Layers, 
  MapPin, 
  AlertCircle,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import topologyData from '../data/networkTopology.json';
import departsSummaryData from '../data/departsSummary.json';
import { NetworkNode, NetworkEdge, NodeType } from '../types/network';

interface NetworkVisualizerProps {
  selectedDepartId: string;
  onSelectDepart: (id: string) => void;
}

interface LayoutNode extends NetworkNode {
  x: number;
  y: number;
  depth: number;
  inPathToRoot?: boolean;
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({
  selectedDepartId,
  onSelectDepart,
}) => {
  const [currentDepartId, setCurrentDepartId] = useState<string>(selectedDepartId || '125H3C20');
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'radial' | 'simplified'>('hierarchical');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);
  const [showJunctions, setShowJunctions] = useState<boolean>(false);
  const [showLengths, setShowLengths] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<'type' | 'section'>('type');

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync with prop when changed
  useEffect(() => {
    if (selectedDepartId && selectedDepartId !== currentDepartId) {
      setCurrentDepartId(selectedDepartId);
      setSelectedNode(null);
      setSelectedEdge(null);
      setPan({ x: 80, y: 150 });
      setZoom(1);
    }
  }, [selectedDepartId]);

  // Depart data
  const depart = useMemo(() => {
    const d = (topologyData.departs as Record<string, any>)[currentDepartId];
    return d || (topologyData.departs as Record<string, any>)['125H3C20'];
  }, [currentDepartId]);

  // Graph Adjacency & BFS hierarchy calculation
  const { layoutNodes, layoutEdges, rootNodeId } = useMemo(() => {
    if (!depart) return { layoutNodes: [], layoutEdges: [], rootNodeId: null };

    const nodes: NetworkNode[] = depart.nodes;
    const rawEdges: NetworkEdge[] = depart.edges;

    // Filter out intermediate junctions if showJunctions is false
    let edgesToRender = rawEdges;
    let nodesToRender = nodes;

    if (!showJunctions && layoutMode === 'simplified') {
      // Keep only Postes, Etoilements, Sources, Coupures
      const essentialNodeIds = new Set(
        nodes.filter(n => n.type !== 'JONCTION').map(n => n.id)
      );
      nodesToRender = nodes.filter(n => essentialNodeIds.has(n.id));
      edgesToRender = rawEdges.filter(e => essentialNodeIds.has(e.from) && essentialNodeIds.has(e.to));
    }

    // Determine root node (Poste Source or Cellule)
    let root = nodes.find(n => n.type === 'POSTE_SOURCE' || n.type === 'CELLULE');
    if (!root) {
      // Find matching source code in Depart ID (e.g. 125H3 in 125H3C20)
      const prefixMatch = depart.id.match(/^(\d+[A-Z]\d+)/);
      if (prefixMatch) {
        root = nodes.find(n => n.id.startsWith(prefixMatch[1]));
      }
    }
    if (!root) root = nodes[0];
    const rootId = root ? root.id : (nodes[0]?.id || '');

    // Adjacency map
    const adj: Record<string, string[]> = {};
    for (const e of rawEdges) {
      if (!adj[e.from]) adj[e.from] = [];
      if (!adj[e.to]) adj[e.to] = [];
      adj[e.from].push(e.to);
      adj[e.to].push(e.from);
    }

    // BFS for depth and parent tree
    const depthMap: Record<string, number> = {};
    const parentMap: Record<string, string | null> = {};
    const visited = new Set<string>();
    const queue: Array<{ id: string; d: number }> = [{ id: rootId, d: 0 }];
    visited.add(rootId);
    depthMap[rootId] = 0;
    parentMap[rootId] = null;

    while (queue.length > 0) {
      const { id, d } = queue.shift()!;
      const neighbors = adj[id] || [];
      for (const nbr of neighbors) {
        if (!visited.has(nbr)) {
          visited.add(nbr);
          depthMap[nbr] = d + 1;
          parentMap[nbr] = id;
          queue.push({ id: nbr, d: d + 1 });
        }
      }
    }

    // Any unvisited nodes (disconnected components)
    let discDepth = 0;
    for (const n of nodes) {
      if (!visited.has(n.id)) {
        depthMap[n.id] = discDepth + 1;
        discDepth++;
      }
    }

    // Find path to root if a node is selected
    const inPathSet = new Set<string>();
    if (selectedNode) {
      let curr: string | null = selectedNode.id;
      while (curr) {
        inPathSet.add(curr);
        curr = parentMap[curr] || null;
      }
    }

    // Group nodes by depth for layout positioning
    const depthGroups: Record<number, NetworkNode[]> = {};
    for (const n of nodesToRender) {
      const d = depthMap[n.id] ?? 0;
      if (!depthGroups[d]) depthGroups[d] = [];
      depthGroups[d].push(n);
    }

    const calculatedNodes: LayoutNode[] = [];
    const maxDepth = Math.max(...Object.keys(depthGroups).map(Number), 0);

    if (layoutMode === 'radial') {
      // Radial concentric layout
      const centerX = 800;
      const centerY = 500;
      for (let d = 0; d <= maxDepth; d++) {
        const group = depthGroups[d] || [];
        const radius = d === 0 ? 0 : 70 + d * 65;
        const count = group.length;
        group.forEach((n, idx) => {
          const angle = count === 1 ? 0 : (idx / count) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          calculatedNodes.push({
            ...n,
            x,
            y,
            depth: d,
            inPathToRoot: inPathSet.has(n.id),
          });
        });
      }
    } else {
      // Hierarchical orthogonal / tree layout (left-to-right or stepped tree)
      const xSpacing = 160;
      const ySpacing = 65;

      for (let d = 0; d <= maxDepth; d++) {
        const group = depthGroups[d] || [];
        const totalHeight = group.length * ySpacing;
        const startY = 300 - totalHeight / 2;

        group.forEach((n, idx) => {
          const x = 120 + d * xSpacing;
          const y = startY + idx * ySpacing;
          calculatedNodes.push({
            ...n,
            x,
            y,
            depth: d,
            inPathToRoot: inPathSet.has(n.id),
          });
        });
      }
    }

    return {
      layoutNodes: calculatedNodes,
      layoutEdges: edgesToRender,
      rootNodeId: rootId,
    };
  }, [depart, layoutMode, showJunctions, selectedNode]);

  // Lookup map for fast edge rendering
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, LayoutNode>();
    for (const n of layoutNodes) {
      map.set(n.id, n);
    }
    return map;
  }, [layoutNodes]);

  // Handle pan drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(0.2, prev + delta), 3.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 80, y: 150 });
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleFitView = () => {
    if (layoutNodes.length === 0) return;
    const xs = layoutNodes.map(n => n.x);
    const ys = layoutNodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX + 200;
    const height = maxY - minY + 200;

    const scaleX = 900 / width;
    const scaleY = 550 / height;
    const newZoom = Math.min(Math.max(0.25, Math.min(scaleX, scaleY)), 1.5);

    setZoom(newZoom);
    setPan({
      x: 100 - minX * newZoom,
      y: 100 - minY * newZoom,
    });
  };

  // Search node and center
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !depart) return [];
    const q = searchQuery.toLowerCase().trim();
    return depart.nodes.filter(
      (n: NetworkNode) =>
        n.id.toLowerCase().includes(q) ||
        (n.meta?.nom && n.meta.nom.toLowerCase().includes(q)) ||
        (n.meta?.localite && n.meta.localite.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, depart]);

  const handleSelectSearchedNode = (node: NetworkNode) => {
    const layoutN = nodePositionMap.get(node.id);
    if (layoutN) {
      setSelectedNode(layoutN);
      setSelectedEdge(null);
      // Pan to center node
      setPan({
        x: 450 - layoutN.x * zoom,
        y: 280 - layoutN.y * zoom,
      });
      setSearchQuery('');
    }
  };

  // Node styling helper
  const getNodeColor = (type: NodeType, isSelected: boolean, inPath?: boolean) => {
    if (isSelected) return '#f59e0b'; // Amber 500
    if (inPath) return '#fbbf24'; // Golden amber for root path
    switch (type) {
      case 'POSTE_SOURCE':
        return '#8b5cf6'; // Violet
      case 'CELLULE':
        return '#3b82f6'; // Blue
      case 'POSTE_COUPURE':
        return '#10b981'; // Emerald
      case 'POSTE_REPARTITION':
        return '#06b6d4'; // Cyan
      case 'POSTE_HTA_BT':
        return '#f97316'; // Orange / Amber
      case 'ETOILEMENT':
        return '#14b8a6'; // Teal
      case 'JONCTION':
      default:
        return '#94a3b8'; // Slate
    }
  };

  // Conductor color helper
  const getEdgeColor = (edge: NetworkEdge, isSelected: boolean) => {
    if (isSelected) return '#f59e0b';
    if (colorMode === 'section') {
      if (edge.section >= 117) return '#2563eb'; // Blue
      if (edge.section >= 75) return '#059669'; // Emerald
      if (edge.section >= 36) return '#d97706'; // Amber
      return '#64748b';
    }
    // Type mode
    if (edge.nat_cond === 'CU') return '#ea580c'; // Cuivre (orange-red)
    if (edge.struct === 'SOUTERRAIN') return '#6366f1'; // Indigo for cable
    return '#475569'; // Default Almélec AM
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-slate-900/95 border-b border-slate-800 z-10 shrink-0">
        {/* Left: Depart Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Départ MT :
            </span>
          </div>

          <select
            value={currentDepartId}
            onChange={(e) => {
              setCurrentDepartId(e.target.value);
              onSelectDepart(e.target.value);
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
            className="bg-slate-800 text-slate-100 text-xs font-mono font-medium rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {departsSummaryData.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} &mdash; {d.totalLengthKm} km &middot; {d.posteCount} Postes &middot; {d.arcCount} Arcs
              </option>
            ))}
          </select>

          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 border-l border-slate-800 pl-3">
            <span>Longueur : <strong className="text-slate-200 font-mono tabular-nums">{depart?.totalLengthKm} km</strong></span>
            <span>&middot;</span>
            <span>Postes HTA/BT : <strong className="text-amber-400 font-mono tabular-nums">{depart?.posteCount}</strong></span>
            <span>&middot;</span>
            <span>Puissance : <strong className="text-purple-400 font-mono tabular-nums">{depart?.totalPowerKva?.toLocaleString('fr-FR')} kVA</strong></span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="relative w-56 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Chercher poste, piquage, nœud..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-slate-100 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
          />

          {/* Autocomplete dropdown */}
          {filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
              {filteredSuggestions.map((n: NetworkNode) => (
                <button
                  key={n.id}
                  onClick={() => handleSelectSearchedNode(n)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700/80 transition-colors flex items-center justify-between border-b border-slate-700/40 last:border-0"
                >
                  <div className="truncate">
                    <span className="font-mono font-semibold text-slate-200">{n.id}</span>
                    {n.meta?.nom && (
                      <span className="text-slate-400 ml-1.5 font-sans">({n.meta.nom})</span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300 shrink-0">
                    {n.type.replace('POSTE_', '')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Layout Modes & View Options */}
        <div className="flex items-center gap-2">
          {/* Layout Mode Segmented Button */}
          <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
            <button
              onClick={() => setLayoutMode('hierarchical')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                layoutMode === 'hierarchical'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Schéma Unifilaire Arborescent (SLD)"
            >
              Unifilaire
            </button>
            <button
              onClick={() => setLayoutMode('radial')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                layoutMode === 'radial'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Graphe Topologique Radial"
            >
              Radial
            </button>
            <button
              onClick={() => {
                setLayoutMode('simplified');
                setShowJunctions(false);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                layoutMode === 'simplified'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Postes HTA/BT & Piquages Seuls"
            >
              Simplifié
            </button>
          </div>

          {/* Toggle Junctions button */}
          <button
            onClick={() => setShowJunctions(!showJunctions)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showJunctions
                ? 'bg-slate-700 border-slate-600 text-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={showJunctions ? 'Masquer jonctions intermédiaires' : 'Afficher jonctions de passage'}
          >
            {showJunctions ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Toggle Section/Conductor coloration */}
          <button
            onClick={() => setColorMode(colorMode === 'type' ? 'section' : 'type')}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              colorMode === 'section'
                ? 'bg-slate-700 border-slate-600 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={colorMode === 'section' ? 'Coloration par section (mm²)' : 'Coloration par type d\'ouvrage'}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace (Canvas + Inspector Sidebar) */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* SVG Interactive Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative flex-1 bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Subtle Grid Background */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.08s ease-out',
            }}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
              </marker>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Edge Lines */}
            <g className="edges">
              {layoutEdges.map((edge) => {
                const u = nodePositionMap.get(edge.from);
                const v = nodePositionMap.get(edge.to);
                if (!u || !v) return null;

                const isEdgeSelected = selectedEdge?.id === edge.id;
                const isInPath = u.inPathToRoot && v.inPathToRoot;
                const strokeColor = isInPath ? '#fbbf24' : getEdgeColor(edge, isEdgeSelected);
                const strokeWidth = isInPath ? 3.5 : isEdgeSelected ? 3 : edge.section >= 117 ? 2.5 : 1.5;

                const midX = (u.x + v.x) / 2;
                const midY = (u.y + v.y) / 2;

                return (
                  <g key={edge.id} className="cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEdge(edge);
                    setSelectedNode(null);
                  }}>
                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={edge.struct === 'SOUTERRAIN' ? '4 3' : 'none'}
                      opacity={isInPath || isEdgeSelected ? 1 : 0.75}
                      className="hover:stroke-amber-400 transition-colors"
                      filter={isInPath ? 'url(#glow)' : undefined}
                    />

                    {/* Edge Length Label */}
                    {showLengths && zoom >= 0.8 && edge.longueur > 0 && (
                      <text
                        x={midX}
                        y={midY - 4}
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="pointer-events-none select-none opacity-80"
                      >
                        {edge.longueur}m
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {layoutNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isRoot = node.id === rootNodeId;
                const nodeColor = getNodeColor(node.type, isSelected, node.inPathToRoot);

                // Size depending on node type
                let r = 7;
                if (node.type === 'POSTE_SOURCE') r = 16;
                else if (node.type === 'POSTE_HTA_BT') r = 11;
                else if (node.type === 'ETOILEMENT') r = 9;
                else if (node.type === 'POSTE_COUPURE') r = 10;
                else if (node.type === 'JONCTION') r = 4;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                      setSelectedEdge(null);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring for selected node or root */}
                    {(isSelected || isRoot) && (
                      <circle
                        r={r + 6}
                        fill="none"
                        stroke={nodeColor}
                        strokeWidth="1.5"
                        opacity="0.8"
                        className="animate-ping"
                      />
                    )}

                    {/* Node Shape */}
                    {node.type === 'POSTE_SOURCE' ? (
                      // Substation: double circle
                      <g>
                        <circle r={r} fill="#1e1b4b" stroke={nodeColor} strokeWidth="3" />
                        <circle r={r - 5} fill="none" stroke={nodeColor} strokeWidth="1.5" />
                        <text
                          y="3"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          HT
                        </text>
                      </g>
                    ) : node.type === 'POSTE_HTA_BT' ? (
                      // Transformer: double interlocking circles or box
                      <g>
                        <rect
                          x={-r}
                          y={-r}
                          width={r * 2}
                          height={r * 2}
                          rx="3"
                          fill="#451a03"
                          stroke={nodeColor}
                          strokeWidth="2"
                        />
                        <text
                          y="3"
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          T
                        </text>
                      </g>
                    ) : node.type === 'POSTE_COUPURE' ? (
                      // Sectionalizer box
                      <rect
                        x={-r}
                        y={-r}
                        width={r * 2}
                        height={r * 2}
                        fill="#064e3b"
                        stroke={nodeColor}
                        strokeWidth="2"
                      />
                    ) : node.type === 'ETOILEMENT' ? (
                      // Branching pole / Tee-off
                      <polygon
                        points={`0,${-r} ${r},${r} ${-r},${r}`}
                        fill="#134e4a"
                        stroke={nodeColor}
                        strokeWidth="1.8"
                      />
                    ) : (
                      // Junction circle
                      <circle
                        r={r}
                        fill={nodeColor}
                        stroke="#0f172a"
                        strokeWidth="1"
                      />
                    )}

                    {/* Node Text Label */}
                    {(node.type !== 'JONCTION' || zoom > 1.2 || isSelected) && (
                      <text
                        x={0}
                        y={r + 13}
                        fill={isSelected ? '#f59e0b' : node.inPathToRoot ? '#fbbf24' : '#e2e8f0'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight={isSelected || node.type === 'POSTE_HTA_BT' ? 'bold' : 'normal'}
                        textAnchor="middle"
                        className="select-none pointer-events-none"
                      >
                        {node.meta?.nom ? `${node.meta.nom} (${node.id})` : node.id}
                      </text>
                    )}

                    {/* Installed power badge for substations */}
                    {node.type === 'POSTE_HTA_BT' && node.meta?.p_instal && node.meta.p_instal > 0 && (
                      <text
                        x={0}
                        y={-r - 4}
                        fill="#f59e0b"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="select-none pointer-events-none"
                      >
                        {node.meta.p_instal} kVA
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Canvas Controls (Bottom-Left) */}
          <div className="absolute bottom-5 left-5 flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl z-20">
            <button
              onClick={() => handleZoom(0.2)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitView}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Ajuster la vue (Centrer)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Réinitialiser vue"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <span className="text-[11px] font-mono text-slate-400 px-1.5 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Legend Strip (Top-Left) */}
          <div className="absolute top-4 left-4 p-3 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg z-20 text-[11px] space-y-1.5 max-w-xs pointer-events-auto">
            <div className="font-semibold text-slate-300 text-xs flex items-center justify-between pb-1 border-b border-slate-800">
              <span>Légende Schéma Unifilaire</span>
              <Compass className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-600 border border-violet-300 shrink-0"></span>
                <span>Poste Source HT/MT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-600 border border-amber-300 shrink-0"></span>
                <span>Poste HTA/BT (Transfo)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-teal-500 shrink-0"></span>
                <span>Étoilement (Piquage)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-600 border border-emerald-300 shrink-0"></span>
                <span>Poste de Coupure MT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                <span>Jonction de passage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-amber-400 shrink-0"></span>
                <span className="text-amber-300 font-medium">Chemin vers source</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Inspector Drawer */}
        {(selectedNode || selectedEdge) && (
          <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-4 shrink-0 shadow-2xl z-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Fiche Technique Ouvrage</span>
              </div>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Fermer &times;
              </button>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    Identifiant Ouvrage
                  </span>
                  <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
                    <span>{selectedNode.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-sans font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                      {selectedNode.type}
                    </span>
                  </div>
                  {selectedNode.meta?.nom && (
                    <div className="text-sm font-semibold text-amber-400 mt-0.5">
                      {selectedNode.meta.nom}
                    </div>
                  )}
                </div>

                {/* Electrical Characteristics */}
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2">
                  <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Paramètres Électriques</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tension Nominale</span>
                      <strong className="font-mono text-slate-100">
                        {selectedNode.meta?.tension ? `${selectedNode.meta.tension} kV` : '30 kV (HTA)'}
                      </strong>
                    </div>

                    {selectedNode.type === 'POSTE_HTA_BT' && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Puissance Installée</span>
                        <strong className="font-mono text-amber-400">
                          {selectedNode.meta?.p_instal ? `${selectedNode.meta.p_instal} kVA` : 'Non renseigné'}
                        </strong>
                      </div>
                    )}

                    {selectedNode.type === 'POSTE_HTA_BT' && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Type de Poste</span>
                        <span className="font-mono text-slate-200">
                          {selectedNode.meta?.t_poste === 'MS'
                            ? 'Maçonné Standard (MS)'
                            : selectedNode.meta?.t_poste === 'AC'
                            ? 'Aérien sur Poteau (AC)'
                            : selectedNode.meta?.t_poste || 'Standard'}
                        </span>
                      </div>
                    )}

                    {selectedNode.type === 'POSTE_HTA_BT' && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Nb Transformateurs</span>
                        <span className="font-mono text-slate-200">
                          {selectedNode.meta?.nb_trans || 1}
                        </span>
                      </div>
                    )}

                    {selectedNode.meta?.an_mes && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Mise en Service</span>
                        <span className="font-mono text-slate-200">
                          {selectedNode.meta.an_mes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Geography & District */}
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2">
                  <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Implantation Géographique</span>
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <div>Localité : <strong className="text-slate-100">{selectedNode.meta?.localite || 'Wilaya de Guelma (24)'}</strong></div>
                    <div>Commune : <span className="font-mono text-slate-200">{selectedNode.meta?.commune || '—'}</span></div>
                    <div>Départ de rattachement : <span className="font-mono text-blue-400">{currentDepartId}</span></div>
                    <div>Niveau hiérarchique : <span className="font-mono text-slate-200">Échelon {selectedNode.depth}</span></div>
                  </div>
                </div>

                {/* Path to source info */}
                {selectedNode.inPathToRoot && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 space-y-1">
                    <div className="font-semibold text-[11px] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chemin vers le Poste Source tracé</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80">
                      Cet ouvrage est relié électriquement au départ <code className="font-mono font-bold">{currentDepartId}</code> en {selectedNode.depth} tronçon(s).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Edge Details */}
            {selectedEdge && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    Arc de Ligne MT
                  </span>
                  <div className="text-base font-mono font-bold text-white">
                    {selectedEdge.id}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2">
                  <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <span>Liaison Électrique</span>
                  </div>

                  <div className="space-y-1.5 text-slate-300">
                    <div>De : <code className="font-mono text-slate-100 font-bold">{selectedEdge.from}</code></div>
                    <div>Vers : <code className="font-mono text-slate-100 font-bold">{selectedEdge.to}</code></div>
                    <div>Longueur : <strong className="font-mono text-emerald-400">{selectedEdge.longueur} mètres</strong></div>
                    <div>Nature Conducteur : <strong className="font-mono text-slate-100">{selectedEdge.nat_cond === 'AM' ? 'Almélec (AM)' : selectedEdge.nat_cond}</strong></div>
                    <div>Section : <strong className="font-mono text-slate-100">{selectedEdge.section} mm²</strong></div>
                    <div>Structure de pose : <span className="font-mono text-slate-200">{selectedEdge.struct}</span></div>
                    {selectedEdge.an_mes && (
                      <div>Mise en service : <span className="font-mono text-slate-200">{selectedEdge.an_mes}</span></div>
                    )}
                  </div>
                </div>

                {/* Supports (Poles) Breakdown */}
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2">
                  <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Supports &amp; Armements</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-900 rounded border border-slate-700/40">
                      <span className="text-[10px] text-slate-500 block">Béton</span>
                      <strong className="font-mono text-slate-100">{selectedEdge.supports.beton}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-700/40">
                      <span className="text-[10px] text-slate-500 block">Bois</span>
                      <strong className="font-mono text-slate-100">{selectedEdge.supports.bois}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-700/40">
                      <span className="text-[10px] text-slate-500 block">Métal</span>
                      <strong className="font-mono text-slate-100">{selectedEdge.supports.metal}</strong>
                    </div>
                  </div>
                </div>

                {/* Anomaly note if present */}
                {selectedEdge.anomalie && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 space-y-1">
                    <div className="font-semibold text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Anomalie Auditée</span>
                    </div>
                    <p className="text-[11px] font-mono text-amber-200/90 whitespace-pre-line">
                      {selectedEdge.anomalie}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
