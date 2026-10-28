# GDO-MT — Visualisation & Modernisation Réseau Moyenne Tension (HTA)

Application web moderne en **Pur JavaScript (Client-Side, 0% Node.js sur le serveur)** pour la visualisation de l'architecture physique, l'analyse topologique et la gestion des **Ouvrages Moyenne Tension (HTA 30 kV)**, issue de la rétro-ingénierie d'une application historique dBase III / FoxPro (Wilaya de Guelma, Algérie).

Ce projet est hébergeable directement sur **GitHub Pages** (ou tout serveur web statique Nginx, Apache, CDN).

---

## 🌟 Fonctionnalités Clés

- **Architecture Physique & Schéma Unifilaire Interactif (SLD)** :
  - Visualisation des **51 Départs MT** (ex: `125H3C20` avec 118 postes, `125H2C3` avec 95 postes, `127H1C4`, etc.).
  - 3 modes de rendu : **Hiérarchique (Unifilaire)**, **Radial Spatiale**, et **Simplifié (Postes & Piquages seuls)**.
  - **Traçage amont vers le poste source (*Path Tracing*)** : Cliquez sur un poste ou un piquage pour illuminer en or le chemin électrique remontant jusqu'au disjoncteur du poste source.
  - Zoom, Panoramique, centrage automatique et recherche instantanée par matricule ou localité.
  - Inspecteur technique latéral : Fiche détaillée (puissance installée kVA, type cabine maçonnée `MS` ou poteau `AC`, tension 30 kV, armements béton/bois/métal).

- **Simulateur Terrain GPARC-Mobile (Offline-First)** :
  - Simulation d'un terminal mobile / tablette durcie de terrain.
  - Modèle embarqué **SQLite (1,8 Mo)** sans aucune connexion Internet requise.
  - Formulaire de relevé d'intervention et signalement d'anomalies en local.

- **Explorateur des 12 Tables Excel dBase d'Origine** :
  - Consultation, filtrage, pagination et comparaison `anomalie` vs `corrigé`.
  - Export immédiat en **CSV** ou **JSON**.

- **Synthèse Réseau & Audit de Qualité** :
  - 51 Départs MT &middot; 7 678 Arcs (1 240+ km) &middot; 504 Postes HTA/BT &middot; ~38 450 kVA &middot; 378 Étoilements &middot; 2 Postes Sources.
  - Diagnostic des anomalies historiques dBase (tensions nulles à 0.0V, départs non renseignés).

---

## 🚀 Déploiement sur GitHub Pages (100% Pur JavaScript)

Cette application est entièrement statique. Elle ne requiert aucun serveur Node.js ni backend en production.

### Activation sur votre dépôt GitHub :
1. Rendez-vous sur votre dépôt : `https://github.com/redatest/GDO`
2. Cliquez sur **Settings** &rarr; **Pages** (dans le menu de gauche).
3. Dans **Build and deployment** &rarr; **Source** :
   - Sélectionnez **Deploy from a branch**.
   - Choisissez la branche **`gh-pages`** (ou **`main`** dossier `/docs`).
4. Cliquez sur **Save**.
5. Votre application sera disponible à l'adresse :
   **`https://redatest.github.io/GDO/`**

---

## 🛠️ Développement Local (Optionnel)

Pour tester ou modifier le code source en local :

```bash
# Installation des dépendances
npm install

# Lancement du serveur de test local
npm run dev

# Compilation de la version statique de production
npm run build
```

Le dossier `dist/` (ou `docs/`) contient les fichiers compilés prêts à être hébergés n'importe où.

---

## 📄 Licence
Projet réalisé pour la modernisation des applications patrimoniales de gestion des réseaux électriques de distribution.
