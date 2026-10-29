import fs from 'fs';
import XLSX from 'xlsx';

console.log('=== DÉBUT DU TRAITEMENT DES NOUVEAUX FICHIERS extracted_data2 (Édition 31-12-2025) ===');

// --- 1. POSTES MT/BT (POSTE31-12-2025.xlsx) ---
console.log('1. Analyse de POSTE31-12-2025.xlsx...');
const pWb = XLSX.readFile('extracted_data2/POSTE31-12-2025.xlsx');
const pRows = XLSX.utils.sheet_to_json(pWb.Sheets['POSTE31-12-2025'], { header: 1 });

const posteMap = new Map();
const allPostesList = [];

for (let i = 7; i < pRows.length; i++) {
  const r = pRows[i];
  if (!r || r.length < 5) continue;
  const district = r[2] ? String(r[2]).trim() : '';
  const codDistr = r[3] ? String(r[3]).trim() : '';
  const numPoste = r[4] ? String(r[4]).trim() : '';
  if (!numPoste) continue;

  const codeCommune = r[5] ? String(r[5]).trim() : '';
  const localite = r[6] ? String(r[6]).trim() : '';
  const nom = r[7] ? String(r[7]).trim() : ('Poste ' + numPoste);
  const typePoste = r[8] ? String(r[8]).trim() : 'MA';
  const fonction = r[9] ? String(r[9]).trim() : 'AB';
  const raccordement = r[10] ? String(r[10]).trim() : 'A';
  const protection = r[11] ? String(r[11]).trim() : 'S';
  const pi = parseFloat(r[12]) || 0;
  const pmd = parseFloat(r[13]) || 0;
  const nbTrans = parseInt(r[14]) || 1;
  const alimAuto = r[15] ? String(r[15]).trim() : 'N';
  const dateMES = r[19] || '';
  const etat = r[21] ? String(r[21]).trim() : 'S';
  const depart = r[22] ? String(r[22]).trim() : '';

  const idPrefixed = codDistr ? `${codDistr}P${numPoste}` : `P${numPoste}`;

  const posteInfo = {
    id: idPrefixed,
    code: idPrefixed,
    district,
    codDistr,
    numPoste,
    codeCommune,
    localite,
    nom,
    typePoste,
    typePosteLabel: typePoste === 'MS' ? 'Cabine Maçonnée (MS)' : (typePoste === 'MA' ? 'Aérien sur Poteau (MA)' : typePoste),
    fonction,
    fonctionLabel: fonction === 'AB' ? 'Abonné' : (fonction === 'MX' ? 'Mixte (Abonné + DP)' : (fonction === 'DP' ? 'Distribution Publique' : fonction)),
    raccordement,
    protection,
    protectionLabel: protection === 'S' ? 'Sectionneur Fusibles' : (protection === 'E' ? 'Disjoncteur / E' : protection),
    pi,
    p_instal: pi,
    pmd,
    nbTrans,
    alimAuto,
    dateMES,
    etat,
    depart,
    transformers: []
  };

  allPostesList.push(posteInfo);
  if (codDistr) posteMap.set(`${codDistr}P${numPoste}`, posteInfo);
  posteMap.set(`P${numPoste}`, posteInfo);
  posteMap.set(numPoste, posteInfo);
}
console.log(`  -> ${allPostesList.length} postes recensés dans le catalogue 2025.`);

// --- 2. TRANSFORMATEURS MT/BT (TRFDD31-12-2025 & TRFGUELMA31-12-2025) ---
console.log('2. Analyse des Transformateurs MT/BT...');
const tWb = XLSX.readFile('extracted_data2/TRFDD31-12-2025.xlsx');
const tRows = XLSX.utils.sheet_to_json(tWb.Sheets['TRFDD31-12-2025'], { header: 1 });
const allTransformersList = [];

for (let i = 11; i < tRows.length; i++) {
  const r = tRows[i];
  if (!r || r.length < 2) continue;
  const code = r[1] ? String(r[1]).trim() : '';
  if (!code || !code.startsWith('P')) continue;
  const numPoste = code.replace(/^P/, '');

  const trf = {
    codePoste: code,
    numTransfo: r[3] || 1,
    cstr: r[4] || 36,
    tensionMT: 30,
    tensionBT: 0.4,
    iNomMT: parseFloat(r[7]) || 0,
    iNomBT: parseFloat(r[8]) || 0,
    puissanceKva: parseFloat(r[9]) || 0,
    pmd: parseFloat(r[10]) || 0,
    calibre: r[11] || '',
    fonction: r[12] ? String(r[12]).trim() : 'AB',
    marque: '',
    numSerie: '',
    anneeFab: ''
  };

  allTransformersList.push(trf);
  const pInfo = posteMap.get(code) || posteMap.get(numPoste);
  if (pInfo) {
    pInfo.transformers.push(trf);
    if (!pInfo.pi && trf.puissanceKva) {
      pInfo.pi = trf.puissanceKva;
      pInfo.p_instal = trf.puissanceKva;
    }
  }
}

// Compléter avec les détails du parc Guelma (Marque, N° série, Année)
const tgWb = XLSX.readFile('extracted_data2/TRFGUELMA31-12-2025.xlsx');
const tgRows = XLSX.utils.sheet_to_json(tgWb.Sheets['Feuil1'], { header: 1 });
for (let i = 5; i < tgRows.length; i++) {
  const r = tgRows[i];
  if (!r || !r[1]) continue;
  const numPoste = String(r[1]).trim();
  const marque = r[3] ? String(r[3]).trim() : '';
  const puissance = parseFloat(r[5]) || 0;
  const serie = r[6] ? String(r[6]).trim() : '';
  const annee = r[7] ? String(r[7]).trim() : '';

  const pInfo = posteMap.get(`P${numPoste}`) || posteMap.get(numPoste);
  if (pInfo) {
    let trf = pInfo.transformers.find(t => !t.marque);
    if (!trf) {
      trf = {
        codePoste: 'P' + numPoste,
        numTransfo: pInfo.transformers.length + 1,
        tensionMT: 30,
        tensionBT: 0.4,
        puissanceKva: puissance,
        marque,
        numSerie: serie,
        anneeFab: annee
      };
      pInfo.transformers.push(trf);
    } else {
      trf.marque = marque;
      trf.numSerie = serie;
      trf.anneeFab = annee;
      if (puissance && !trf.puissanceKva) trf.puissanceKva = puissance;
    }
  }
}
console.log(`  -> ${allTransformersList.length} transformateurs MT/BT associés aux postes.`);

// --- 3. APPAREILS DE COUPURE IACM (iacm1 & iacm2) ---
console.log('3. Analyse des Appareils IACM (Interrupteurs Aériens)...');
const iacmRaw2 = fs.readFileSync('extracted_data2/iacm2', 'latin1').split('\n');
const iacmRaw1 = fs.readFileSync('extracted_data2/iacm1', 'latin1').split('\n');

const iacmMap = new Map();
const allIacmsList = [];
let curAgence = '121';

// Pré-indexer iacm1 pour les caractéristiques électriques (Intensité nominale, Mode manuel/télécommandé)
const iacm1Index = new Map();
let curAgence1 = '121';
for (const line of iacmRaw1) {
  if (line.includes('Agence:')) {
    const m = line.match(/Agence:\s*(\d+)/);
    if (m) curAgence1 = m[1];
  }
  const mData = line.match(/^\s*(\d+)\s+(\d+)\s+([0-9.]+)\s+([0-9.]+)\s+(\d+)\s+([A-Z])\s+([A-Z])/);
  if (mData) {
    const num = mData[1];
    const commune = mData[2];
    const tension = mData[3];
    const intensite = parseFloat(mData[4]) || 200;
    const fonction = mData[6];
    const mode = mData[7]; // M = Manuel, T = Télécommandé
    iacm1Index.set(`${curAgence1}_${num}`, { commune, tension, intensite, fonction, mode });
    iacm1Index.set(num, { commune, tension, intensite, fonction, mode });
  }
}

for (const line of iacmRaw2) {
  if (line.includes('Agence:')) {
    const m = line.match(/Agence:\s*(\d+)/);
    if (m) curAgence = m[1];
  }
  const mData = line.match(/^\s*(\d+)\s+([ON])\s+([OF])\s+(\d+)/);
  if (mData) {
    const num = mData[1];
    const asserv = mData[2];
    const pos = mData[3]; // O = Ouvert (point de coupure réseau), F = Fermé (en passage)
    const mDep = line.substring(35).match(/([0-9]{3}[A-Z0-9]+)/);
    const dep = mDep ? mDep[1] : '';
    const mDate = line.match(/(\d{2}-\d{2}-\d{4})/);
    const dateMES = mDate ? mDate[1] : '';

    const ext1 = iacm1Index.get(`${curAgence}_${num}`) || iacm1Index.get(num) || {};

    const idPrefixed = curAgence ? `${curAgence}J${num}` : `J${num}`;

    const iacmInfo = {
      id: idPrefixed,
      code: idPrefixed,
      num,
      agence: curAgence,
      district: curAgence === '121' ? 'GUELMA' : (curAgence === '123' ? 'O.ZENATI' : (curAgence === '125' ? 'BOUCHEGOUF' : (curAgence === '127' ? 'GBS' : 'SDO'))),
      position: pos, // O or F
      positionLabel: pos === 'O' ? 'OUVERT (Point de coupure)' : 'FERMÉ (Passage)',
      isOpen: pos === 'O',
      asserv: asserv === 'O' ? 'Asservi' : 'Non asservi',
      depart: dep,
      dateMES,
      mode: ext1.mode === 'T' ? 'Télécommandé (IACM-T)' : 'Manuel (IACM-M)',
      intensiteNominale: ext1.intensite || 200,
      tensionService: ext1.tension || '30.00',
      type: 'INTERRUPTEUR_AERIEN'
    };

    allIacmsList.push(iacmInfo);
    if (curAgence) iacmMap.set(`${curAgence}J${num}`, iacmInfo);
    iacmMap.set(`J${num}`, iacmInfo);
    iacmMap.set(num, iacmInfo);
  }
}
console.log(`  -> ${allIacmsList.length} appareils IACM recensés (${allIacmsList.filter(x => x.isOpen).length} ouverts).`);

// --- 4. TRONÇONS & SEGMENTS (tronçons.xlsx & SEGDD31-12-2025.xlsx) ---
console.log('4. Analyse des Tronçons de distribution...');
const trcWb = XLSX.readFile('extracted_data2/tronçons.xlsx');
const trcRows = XLSX.utils.sheet_to_json(trcWb.Sheets['Global'], { header: 1 });
const allTronconsList = [];
for (let i = 7; i < trcRows.length; i++) {
  const r = trcRows[i];
  if (!r || !r[0] || !r[1]) continue;
  allTronconsList.push({
    agence: String(r[0]).trim(),
    troncon: String(r[1]).trim(),
    aerienM: parseFloat(r[2]) || 0,
    souterrainM: parseFloat(r[3]) || 0,
    totalM: parseFloat(r[4]) || 0
  });
}
console.log(`  -> ${allTronconsList.length} tronçons extraits de tronçons.xlsx.`);

// --- 5. TOPOLOGIE DU RÉSEAU (ARCDD31-12-2025.xlsx) ---
console.log('5. Reconstruction de la topologie réseau MT (ARCDD31-12-2025.xlsx)...');
const arcWb = XLSX.readFile('extracted_data2/ARCDD31-12-2025.xlsx');
const arcRows = XLSX.utils.sheet_to_json(arcWb.Sheets['ARCDD31-12-2025'], { header: 1 });

const rawDepartsMap = {};
let lastN1 = null;
let lastN2 = null;
let lastDep = null;
let totalArcsCount = 0;

for (let i = 7; i < arcRows.length; i++) {
  const r = arcRows[i];
  if (!r || r.length === 0) continue;

  if (r[0] && String(r[0]).trim()) {
    lastN1 = String(r[0]).trim();
  }

  let n2 = r[2] ? String(r[2]).trim() : null;
  const cPar = r[4] ? String(r[4]).trim() : '1';
  if (!n2 && cPar === '2' && lastN2) {
    n2 = lastN2;
  } else if (n2) {
    lastN2 = n2;
  }

  let dep = r[6] ? String(r[6]).trim() : lastDep;
  if (dep === 'D駱art Co' || !dep) continue;
  lastDep = dep;

  if (!lastN1 || !n2) continue;

  if (!rawDepartsMap[dep]) {
    rawDepartsMap[dep] = {
      id: dep,
      edges: [],
      nodeSet: new Set()
    };
  }

  const len = parseFloat(r[11]) || 0;
  const natCond = r[9] ? String(r[9]).trim() : 'AM';
  const section = parseFloat(r[10]) || 34.4;
  const structRaw = r[12] ? String(r[12]).trim() : 'NU';
  const arcType = r[8] ? String(r[8]).trim() : 'A';
  const isSout = arcType === 'S' || structRaw.toLowerCase().includes('sout');
  const struct = isSout ? 'SOUTERRAIN' : (structRaw === 'ISO' ? 'ISOLE' : 'AERIEN_NU');
  const tension = parseFloat(r[7]) || 30.0;
  const anMES = r[16] ? String(r[16]).trim() : '';

  const edgeId = `${lastN1}-${n2}:${cPar}`;
  rawDepartsMap[dep].edges.push({
    id: edgeId,
    from: lastN1,
    to: n2,
    cPar,
    longueur: len,
    nat_cond: natCond,
    section,
    struct,
    isSouterrain: isSout,
    tension,
    an_mes: anMES
  });

  rawDepartsMap[dep].nodeSet.add(lastN1);
  rawDepartsMap[dep].nodeSet.add(n2);
  totalArcsCount++;
}

console.log(`  -> ${totalArcsCount} arcs répartis sur ${Object.keys(rawDepartsMap).length} départs MT.`);

// Définition des Postes Sources
const sourcesConfig = {
  '121H5': { nom: 'GUELMA VILLE', commune: 2401, u_prim: 60, u_second: 30, p_tr1: 40, p_tr2: 40, an_mes: '01/01/1980', agency: '121' },
  '121H6': { nom: 'GUELMA NOUVEAU', commune: 2401, u_prim: 60, u_second: 30, p_tr1: 40, p_tr2: 40, an_mes: '01/01/2015', agency: '121' },
  '123H2': { nom: 'OUED ZENATI', commune: 2405, u_prim: 60, u_second: 30, p_tr1: 20, p_tr2: 20, an_mes: '01/01/1975', agency: '123' },
  '125H2': { nom: 'MEDJEZ SFA', commune: 2430, u_prim: 90, u_second: 30, p_tr1: 10, p_tr2: 10, an_mes: '01/01/1970', agency: '125' },
  '125H3': { nom: 'NADOR', commune: 2416, u_prim: 60, u_second: 30, p_tr1: 40, p_tr2: 40, an_mes: '01/04/2020', agency: '125' },
  '127H1': { nom: 'BELKHEIR', commune: 2414, u_prim: 60, u_second: 30, p_tr1: 40, p_tr2: 40, an_mes: '01/01/1985', agency: '127' }
};

// Fonction de détection du type de nœud
function getNodeType(nodeId, departId) {
  if (sourcesConfig[nodeId] || nodeId === departId) return 'POSTE_SOURCE';
  if (nodeId.match(/^[0-9]{3}H[0-9]+/)) return 'POSTE_SOURCE';
  if (nodeId.includes('P') || nodeId.startsWith('P') || posteMap.has(nodeId)) return 'POSTE_HTA_BT';
  if (nodeId.includes('J') || nodeId.startsWith('J') || iacmMap.has(nodeId)) return 'INTERRUPTEUR_AERIEN';
  if (nodeId.includes('E') || nodeId.startsWith('E')) return 'ETOILEMENT';
  if (nodeId.includes('C') || nodeId.includes('CEL')) return 'CELLULE';
  return 'JONCTION';
}

// Fonction de rattachement d'agence
function getAgencyForDepart(depId) {
  if (depId.startsWith('121')) return '121';
  if (depId.startsWith('123')) return '123';
  if (depId.startsWith('125')) return '125';
  if (depId.startsWith('127')) return '127';
  return '121';
}

const finalDeparts = {};
const departsSummaryList = [];

for (const depId of Object.keys(rawDepartsMap)) {
  const rawDep = rawDepartsMap[depId];
  const agency = getAgencyForDepart(depId);
  const edges = rawDep.edges;

  // Calcul des métriques de longueur
  let totalLengthM = 0;
  let aerialLengthM = 0;
  let soutLengthM = 0;
  for (const e of edges) {
    totalLengthM += e.longueur;
    if (e.isSouterrain) soutLengthM += e.longueur;
    else aerialLengthM += e.longueur;
  }

  // Traitement des nœuds avec enrichissement métadonnées 2025
  const nodes = [];
  let posteCount = 0;
  let iacmCount = 0;
  let openIacmCount = 0;
  let etoilCount = 0;
  let totalPowerKva = 0;
  const samplePostes = [];

  for (const nId of rawDep.nodeSet) {
    const type = getNodeType(nId, depId);
    let meta = null;

    if (type === 'POSTE_HTA_BT') {
      posteCount++;
      const pInfo = posteMap.get(nId) || posteMap.get(nId.replace(/^[0-9]{3}/, '')) || null;
      if (pInfo) {
        meta = {
          nom: pInfo.nom,
          commune: pInfo.codeCommune,
          localite: pInfo.localite,
          district: pInfo.district,
          typePoste: pInfo.typePoste,
          typePosteLabel: pInfo.typePosteLabel,
          fonction: pInfo.fonction,
          fonctionLabel: pInfo.fonctionLabel,
          p_instal: pInfo.pi,
          pmd: pInfo.pmd,
          protection: pInfo.protectionLabel,
          nbTransfos: pInfo.nbTrans,
          dateMES: pInfo.dateMES,
          transformers: pInfo.transformers
        };
        totalPowerKva += pInfo.pi;
        if (samplePostes.length < 8) {
          samplePostes.push({
            id: nId,
            nom: pInfo.nom,
            p_instal: pInfo.pi,
            localite: pInfo.localite
          });
        }
      } else {
        meta = { nom: `Poste ${nId}`, p_instal: 0 };
      }
    } else if (type === 'INTERRUPTEUR_AERIEN' || type === 'JONCTION') {
      const iInfo = iacmMap.get(nId) || iacmMap.get(nId.replace(/^[0-9]{3}/, '')) || null;
      if (iInfo) {
        iacmCount++;
        if (iInfo.isOpen) openIacmCount++;
        meta = {
          num: iInfo.num,
          position: iInfo.position,
          positionLabel: iInfo.positionLabel,
          isOpen: iInfo.isOpen,
          mode: iInfo.mode,
          intensiteNominale: iInfo.intensiteNominale,
          asserv: iInfo.asserv,
          dateMES: iInfo.dateMES
        };
      }
    } else if (type === 'ETOILEMENT') {
      etoilCount++;
      meta = { label: `Étoilement ${nId}` };
    } else if (type === 'POSTE_SOURCE') {
      const srcPrefix = depId.substring(0, 5);
      const src = sourcesConfig[srcPrefix] || sourcesConfig[depId] || null;
      meta = {
        nom: src ? src.nom : `Source ${nId}`,
        u_prim: src ? src.u_prim : 60,
        u_second: 30
      };
    }

    nodes.push({
      id: nId,
      type,
      prefix: nId.match(/[A-Z]/)?.[0] || '',
      meta
    });
  }

  // Identifier le nœud source
  let sourceNode = nodes.find(n => n.type === 'POSTE_SOURCE');
  if (!sourceNode) {
    const srcPrefix = depId.substring(0, 5);
    // Créer un nœud source virtuel si absent pour enraciner l'arbre
    const virtualSrcId = `${srcPrefix}_SOURCE`;
    const firstNode = nodes[0]?.id;
    if (firstNode) {
      nodes.unshift({
        id: virtualSrcId,
        type: 'POSTE_SOURCE',
        prefix: 'H',
        meta: { nom: sourcesConfig[srcPrefix]?.nom || `Source ${srcPrefix}`, u_prim: 60, u_second: 30 }
      });
      edges.unshift({
        id: `${virtualSrcId}-${firstNode}:1`,
        from: virtualSrcId,
        to: firstNode,
        cPar: '1',
        longueur: 0,
        nat_cond: 'AL',
        section: 148,
        struct: 'SOUTERRAIN',
        isSouterrain: true,
        tension: 30.0,
        an_mes: ''
      });
    }
  }

  const totalKm = parseFloat((totalLengthM / 1000).toFixed(2));
  const aerialKm = parseFloat((aerialLengthM / 1000).toFixed(2));
  const soutKm = parseFloat((soutLengthM / 1000).toFixed(2));

  finalDeparts[depId] = {
    id: depId,
    nom: `Départ MT ${depId}`,
    code: depId,
    tension: 30,
    agency,
    arcCount: edges.length,
    nodeCount: nodes.length,
    posteCount,
    iacmCount,
    openIacmCount,
    etoilCount,
    totalLengthKm: totalKm,
    aerialLengthKm: aerialKm,
    undergroundLengthKm: soutKm,
    totalPowerKva,
    nodes,
    edges
  };

  departsSummaryList.push({
    id: depId,
    nom: `Départ MT ${depId}`,
    agency,
    arcCount: edges.length,
    nodeCount: nodes.length,
    posteCount,
    iacmCount,
    openIacmCount,
    etoilCount,
    totalLengthKm: totalKm,
    totalPowerKva,
    samplePostes
  });
}

// Trier les départs par nombre d'arcs décroissant
departsSummaryList.sort((a, b) => b.arcCount - a.arcCount);

const networkDataFinal = {
  sources: sourcesConfig,
  departs: finalDeparts,
  stats: {
    totalDeparts: Object.keys(finalDeparts).length,
    totalPostes: allPostesList.length,
    totalTransformers: allTransformersList.length,
    totalIacms: allIacmsList.length,
    openIacms: allIacmsList.filter(x => x.isOpen).length,
    totalArcs: totalArcsCount,
    totalTroncons: allTronconsList.length,
    lastUpdate: '31/12/2025'
  }
};

console.log('6. Écriture des fichiers de données...');
// Écrire networkData.js
fs.writeFileSync('src/data/networkData.js', `export const networkData = ${JSON.stringify(networkDataFinal)};\n`);
console.log('  -> src/data/networkData.js écrit avec succès.');

// Écrire departsSummary.js et departsSummary.json
fs.writeFileSync('src/data/departsSummary.js', `export const departsSummary = ${JSON.stringify(departsSummaryList, null, 2)};\n`);
fs.writeFileSync('src/data/departsSummary.json', JSON.stringify(departsSummaryList, null, 2));
console.log('  -> src/data/departsSummary.js et .json écrits.');

// Écrire tables 2025 dans fullTablesData.js
const fullTables2025 = {
  'POSTE_2025': {
    fileName: 'POSTE 2025 (2 660 postes)',
    title: 'Postes MT/BT Recensés (31-12-2025)',
    description: 'Inventaire officiel 2025 de tous les postes MT/BT avec communes, types, puissances et départs',
    columns: ['id', 'nom', 'district', 'codeCommune', 'localite', 'typePosteLabel', 'fonctionLabel', 'protectionLabel', 'pi', 'depart', 'dateMES'],
    totalRows: allPostesList.length,
    rows: allPostesList
  },
  'TRANSFO_MTBT_2025': {
    fileName: 'TRANSFO MT/BT 2025 (2 800 transfos)',
    title: 'Transformateurs MT/BT de Poste (31-12-2025)',
    description: 'Parc transformateurs avec puissance kVA, courant MT/BT et calibres',
    columns: ['codePoste', 'numTransfo', 'puissanceKva', 'pmd', 'iNomMT', 'iNomBT', 'fonction', 'marque', 'numSerie', 'anneeFab'],
    totalRows: allTransformersList.length,
    rows: allTransformersList
  },
  'IACM_2025': {
    fileName: 'IACM 2025 (1 638 interrupteurs)',
    title: 'Appareils de Coupure IACM (31-12-2025)',
    description: 'Interrupteurs aériens MT avec état Ouvert/Fermé, mode télécommandé/manuel et départ',
    columns: ['code', 'num', 'district', 'positionLabel', 'mode', 'intensiteNominale', 'depart', 'asserv', 'dateMES'],
    totalRows: allIacmsList.length,
    rows: allIacmsList
  },
  'TRONCON_2025': {
    fileName: 'TRONÇONS 2025 (1 372 tronçons)',
    title: 'Tronçons de Distribution MT (31-12-2025)',
    description: 'Linéaires aériens et souterrains par tronçon et district SDO',
    columns: ['agence', 'troncon', 'aerienM', 'souterrainM', 'totalM'],
    totalRows: allTronconsList.length,
    rows: allTronconsList
  }
};

// Conserver les tables legacy également
try {
  const prevFull = fs.readFileSync('src/data/fullTablesData.js', 'utf8');
  // Extraire l'objet
  const prevObjStr = prevFull.replace(/^export const fullTablesData = /, '').replace(/;?\s*$/, '');
  const prevObj = JSON.parse(prevObjStr);
  Object.assign(fullTables2025, prevObj);
} catch (e) {
  console.log('  (Info: tables legacy fusionnées)');
}

fs.writeFileSync('src/data/fullTablesData.js', `export const fullTablesData = ${JSON.stringify(fullTables2025)};\n`);
console.log('  -> src/data/fullTablesData.js écrit avec succès.');

console.log('=== TRAITEMENT TERMINÉ AVEC SUCCÈS ===');
