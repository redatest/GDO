export type NodeType =
  | 'POSTE_SOURCE'
  | 'POSTE_COUPURE'
  | 'POSTE_REPARTITION'
  | 'POSTE_HTA_BT'
  | 'ETOILEMENT'
  | 'JONCTION'
  | 'CELLULE'
  | 'BARRE';

export interface NodeMeta {
  nom?: string;
  localite?: string;
  commune?: string | number;
  p_instal?: number;
  t_poste?: string;
  nb_trans?: number;
  an_mes?: string;
  anomalie?: string;
  t_protect?: string;
  tension?: number;
  u_prim?: number;
  u_second?: number;
}

export interface NetworkNode {
  id: string;
  type: NodeType;
  prefix: string;
  meta: NodeMeta | null;
}

export interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  longueur: number;
  nat_cond: string;
  section: number;
  struct: string;
  tension: number;
  an_mes?: string;
  anomalie?: string;
  supports: {
    beton: number;
    bois: number;
    metal: number;
  };
}

export interface DepartNetwork {
  id: string;
  arcCount: number;
  nodeCount: number;
  posteCount: number;
  etoilCount: number;
  totalLengthKm: number;
  totalPowerKva: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface DepartSummary {
  id: string;
  arcCount: number;
  nodeCount: number;
  posteCount: number;
  etoilCount: number;
  totalLengthKm: number;
  totalPowerKva: number;
  samplePostes: Array<{
    id: string;
    nom: string;
    p_instal: number;
    localite: string;
  }>;
}

export interface TableSchema {
  tableName: string;
  fileName: string;
  rowCount: number;
  rowCountCorrige: number;
  sheets: string[];
  fields: Array<{
    name: string;
    sample: any;
    type: string;
  }>;
}
