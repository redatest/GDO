/**
 * Référentiel initial des paramètres de calcul MT.
 * Les valeurs par défaut sont clonées avant toute modification par l'utilisateur.
 */
const DEFAULT_SETTINGS = {
  transfos: [
    { kva: 50, ucc: 4.0, p0: 145, pk: 1050, in30: 0.96, type: 'AC', desc: 'Poste haut de poteau rural' },
    { kva: 100, ucc: 4.0, p0: 260, pk: 1750, in30: 1.92, type: 'AC/MS', desc: 'Poste agricole / village' },
    { kva: 160, ucc: 4.0, p0: 390, pk: 2350, in30: 3.08, type: 'MS', desc: 'Cabine maçonnée standard' },
    { kva: 250, ucc: 4.0, p0: 530, pk: 3250, in30: 4.81, type: 'MS', desc: 'Agglomération moyenne' },
    { kva: 400, ucc: 4.0, p0: 750, pk: 4600, in30: 7.70, type: 'MS', desc: 'Centre urbain / industrie' },
    { kva: 630, ucc: 4.0, p0: 1100, pk: 6500, in30: 12.12, type: 'MS', desc: 'Zone industrielle / hôpital' },
    { kva: 1000, ucc: 5.0, p0: 1700, pk: 10500, in30: 19.24, type: 'MS', desc: 'Grosse unité industrielle' }
  ],
  conducteurs: [
    { code: 'AM_36', nom: 'Almélec 36 mm²', section: 36, nat: 'AM', r: 0.92, x: 0.38, iMax: 155, pose: 'AÉRIEN NU' },
    { code: 'AM_75', nom: 'Almélec 75 mm²', section: 75, nat: 'AM', r: 0.44, x: 0.36, iMax: 245, pose: 'AÉRIEN NU' },
    { code: 'AM_117', nom: 'Almélec 117 mm²', section: 117, nat: 'AM', r: 0.28, x: 0.35, iMax: 330, pose: 'AÉRIEN NU' },
    { code: 'AM_148', nom: 'Almélec 148 mm²', section: 148, nat: 'AM', r: 0.22, x: 0.34, iMax: 385, pose: 'AÉRIEN NU' },
    { code: 'CU_25', nom: 'Cuivre 25 mm²', section: 25, nat: 'CU', r: 0.72, x: 0.39, iMax: 140, pose: 'AÉRIEN NU' },
    { code: 'CU_50', nom: 'Cuivre 50 mm²', section: 50, nat: 'CU', r: 0.36, x: 0.37, iMax: 215, pose: 'AÉRIEN NU' },
    { code: 'SOUT_150', nom: 'Câble Souterrain Alu 150 mm²', section: 150, nat: 'AL', r: 0.21, x: 0.12, iMax: 320, pose: 'SOUTERRAIN' },
    { code: 'SOUT_240', nom: 'Câble Souterrain Alu 240 mm²', section: 240, nat: 'AL', r: 0.13, x: 0.11, iMax: 415, pose: 'SOUTERRAIN' }
  ],
  seuils: {
    tensionNominale: 30.0,
    tensionMin: 27.0,
    tensionMax: 33.0,
    chuteTensionMax: 5.0,
    chuteTensionMaxRurale: 7.0,
    cosPhi: 0.90
  }
};

export { DEFAULT_SETTINGS };
