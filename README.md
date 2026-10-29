# GDO-MT

**GDO-MT** est une application web de consultation, d'analyse et de modernisation du réseau électrique moyenne tension (MT/HTA) de la wilaya de Guelma, en Algérie.

- **Application en ligne :** https://redatest.github.io/GDO/
- **Dépôt source :** https://github.com/redatest/GDO
- **Technologies :** JavaScript, Vite, Tailwind CSS et Bun
- **Hébergement :** GitHub Pages — application statique, sans serveur applicatif en production

## Fonctionnalités

- **Schéma unifilaire MT :** sélection des départs, navigation dans le schéma, zoom, panoramique et inspection des nœuds et tronçons.
- **Filtrage par agence :** affichage des départs correspondant à l'agence sélectionnée.
- **Catalogue des ouvrages :** consultation et recherche des postes, transformateurs, IACM, tronçons et autres éléments du réseau.
- **Carnet de terrain :** création et gestion locale de fiches de visite, avec export JSON.
- **Tables de référence :** consultation, recherche, filtrage, pagination et export des données disponibles.
- **Audit topologique :** vérification des identifiants, des extrémités de tronçons, des longueurs et de la cohérence des compteurs du référentiel.

## Référentiel réseau

L'instantané applicatif actuellement documenté contient notamment :

| Indicateur | Valeur |
|---|---:|
| Départs dans le référentiel courant | 49 |
| Tronçons/arcs physiques | 7 501 |
| Occurrences de nœuds dans les départs | 6 596 |
| Linéaire cumulé déclaré | 2 632,07 km |
| Postes recensés | 2 660 |
| Transformateurs recensés | 2 800 |
| IACM recensés | 1 638 |

Ces valeurs décrivent les données intégrées à l'application. Elles ne constituent pas une certification de l'état réel ou de la configuration électrique du réseau.

### Limites connues des données

Le dépôt conserve également un instantané topologique historique utilisé pour comparaison. Il diffère du référentiel courant : il contient 51 départs, et les totaux ainsi que la composition des départs ne sont pas identiques. L'audit peut aussi signaler des départs comportant plusieurs composantes topologiques disjointes.

Ces écarts doivent être vérifiés avec les données métier. L'application ne crée pas automatiquement de raccordements électriques manquants, afin de ne pas inventer une liaison physique qui ne serait pas confirmée par la source de référence.

## Installation et développement

Prérequis : [Bun](https://bun.sh/). Le projet utilise Bun pour l’installation des dépendances, les contrôles, l’audit topologique et la compilation ; Node.js n’est pas requis.

```bash
bun install --frozen-lockfile
bun run dev
```

Vite démarre le serveur de développement sur le port **3000**. Pour générer et prévisualiser la version de production :

```bash
bun run lint
bun run audit:topology
bun run build
bun run preview
```

Le résultat de compilation est généré dans le dossier `dist/`. Ce dossier est un artefact de build : il peut être régénéré et n'a pas besoin d'être maintenu manuellement dans les sources.

### Audit topologique

Pour lancer uniquement l'audit des données réseau :

```bash
bun run audit:topology
```

L'audit contrôle notamment les identifiants dupliqués, les extrémités de tronçons absentes, les longueurs invalides et les écarts de compteurs entre le référentiel courant et le résumé des départs. Il signale les anomalies de données sans les corriger en ajoutant des raccordements physiques supposés.

## Déploiement

Le workflow GitHub Actions situé dans `.github/workflows/deploy.yml` :

1. récupère le code de la branche `main` ;
2. installe les dépendances à partir de `bun.lock` ;
3. vérifie la syntaxe JavaScript et lance l'audit topologique avec Bun ;
4. construit l'application dans `dist/` ;
5. publie le résultat sur la branche `gh-pages`.

Le site public est servi par GitHub Pages à l'adresse https://redatest.github.io/GDO/.

## Données locales et confidentialité

Les paramètres de l'application et les fiches du carnet de terrain sont enregistrés dans le stockage local du navigateur (`localStorage`). Ils restent donc propres au navigateur et à l'appareil utilisés : ils ne sont pas automatiquement synchronisés entre plusieurs appareils et peuvent être perdus si les données du navigateur sont effacées. Exportez régulièrement les fiches importantes.

## Structure principale du projet

- `src/app.js` : interface et logique de l'application.
- `src/index.css` : styles.
- `src/data/` : référentiels et données réseau.
- `scripts/auditTopology.js` : contrôle de cohérence topologique.
- `index.html` : page d'entrée.
- `vite.config.ts` : configuration Vite.
- `package.json` et `bun.lock` : scripts et dépendances.
- `.github/workflows/deploy.yml` : intégration et déploiement continus.

## Licence et usage

Ce dépôt est destiné à la modernisation et à la consultation des données patrimoniales du réseau de distribution. Les résultats affichés dépendent de la qualité et de la date des données sources ; toute décision d'exploitation doit s'appuyer sur les référentiels et procédures techniques officiels.
