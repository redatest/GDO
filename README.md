# GDO-MT — Visualisation & modernisation du réseau moyenne tension (HTA)

Application web statique en JavaScript pour consulter le réseau MT 30 kV, explorer les ouvrages, afficher les schémas unifilaires et enregistrer des relevés terrain. Le référentiel historique provient de données dBase/FoxPro et de classeurs Excel de la wilaya de Guelma, Algérie.

L'application ne nécessite pas de serveur applicatif en production. Les paramètres et les fiches de visite sont conservés dans le stockage local du navigateur (`localStorage`) et les visites peuvent être exportées en JSON. Ce stockage local ne synchronise pas les données entre plusieurs appareils.

## Fonctionnalités

- **Schéma unifilaire MT** : sélection d'un départ, zoom, panoramique, inspection des nœuds et tronçons, affichage des caractéristiques des ouvrages.
- **Catalogue des ouvrages** : postes HTA/BT, IACM, transformateurs, tronçons et étoilements, avec recherche par texte.
- **Carnet de terrain** : fiches de visite locales, suppression et export JSON.
- **Référentiels et tables historiques** : consultation, filtrage, pagination et export CSV/JSON. Les données réseau et les tables volumineuses sont chargées à la demande.
- **Audit des données réseau** : contrôle des identifiants, des extrémités des tronçons, des compteurs et des écarts entre instantanés.

## Chiffres du référentiel actuel

Le référentiel applicatif actuel indique :

- 49 départs et 7 501 tronçons/arcs ;
- 6 596 occurrences de nœuds dans les départs ;
- 2 632,07 km de linéaire cumulé ;
- 2 660 postes, 2 800 transformateurs et 1 638 IACM recensés ;
- 39 IACM ouverts dans les statistiques du référentiel.

Ces chiffres décrivent l'instantané applicatif actuel ; ils ne constituent pas une validation de l'état électrique réel du réseau.

## Contrôle topologique

Lancer l'audit avec :

```bash
bun run audit:topology
```

Le contrôle vérifie les identifiants dupliqués, les extrémités de tronçons absentes, les longueurs invalides et la cohérence entre les compteurs de `networkData` et `departsSummary`.

**Écarts de données connus à résoudre avec la source métier :**

- `networkTopology.json` contient 51 départs historiques, contre 49 dans le référentiel actuel ;
- les deux instantanés ne portent pas sur les mêmes départs et leurs totaux de tronçons/linéaire diffèrent ;
- plusieurs départs comportent des composantes topologiques disjointes.

L'audit signale ces cas mais ne crée pas automatiquement de tronçons de raccordement : ajouter une liaison électrique sans preuve dans les données de référence pourrait fausser le schéma et les analyses de chemin amont.

## Développement et validation

Le dépôt utilise Bun et le fichier de verrouillage `bun.lock`.

```bash
bun install --frozen-lockfile
bun run dev
bun run lint
bun run audit:topology
bun run build
```

Le workflow GitHub Actions exécute les contrôles, construit l'application et publie le contenu de `dist/` sur la branche `gh-pages`.

## GitHub Pages

Dépôt : https://github.com/redatest/GDO  
Application : https://redatest.github.io/GDO/

Dans **Settings → Pages**, la source de publication doit être la branche `gh-pages` si ce n'est pas déjà le cas.

## Licence

Projet réalisé pour la modernisation des applications patrimoniales de gestion des réseaux électriques de distribution.
