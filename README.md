# GDO-MT

**GDO-MT** est une application web de consultation, d'analyse et de visualisation du réseau électrique moyenne tension (MT/HTA).

- **Application en ligne :** https://redatest.github.io/GDO/
- **Dépôt source :** https://github.com/redatest/GDO
- **Technologies :** HTML, CSS et JavaScript natifs (modules ES)
- **Hébergement :** GitHub Pages — site statique, sans serveur applicatif
- **Outils de développement requis :** aucun gestionnaire de paquets, runtime JavaScript ou outil de compilation

## Fonctionnalités

- **Schéma unifilaire MT :** sélection des départs, navigation dans le schéma, zoom, panoramique et inspection des nœuds et tronçons.
- **Filtrage par agence :** affichage des départs correspondant à l'agence sélectionnée.
- **Catalogue des ouvrages :** consultation et recherche des postes, transformateurs, IACM, tronçons et autres éléments du réseau.
- **Carnet de terrain :** création et gestion locale de fiches de visite, avec export JSON.
- **Tables de référence :** consultation, recherche, filtrage, pagination et export des données disponibles.
- **Stockage local :** paramètres et fiches de terrain conservés dans le navigateur avec `localStorage`.

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

Le dépôt conserve également un instantané topologique historique. Il diffère du référentiel courant : il contient 51 départs et des totaux différents. Ces écarts doivent être vérifiés avec les données métier. L'application n'ajoute pas automatiquement de raccordements physiques supposés.

## Architecture sans npm ni Bun

L'application est une application statique côté navigateur. Son exécution ne nécessite ni Node.js, ni npm, ni Bun, ni framework JavaScript, ni compilation.

Le navigateur charge directement :
- `index.html` : page d'entrée ;
- `assets/app.css` : feuille de style CSS statique ;
- `src/app.js` : orchestration de l'interface et des interactions ;
- `src/config/defaultSettings.js` : paramètres MT par défaut ;
- `src/data/dataRepository.js` : chargement différé et normalisation des référentiels ;
- `src/data/` : modules JavaScript et référentiels réseau ;
- `src/utils/formatters.js` : fonctions communes de formatage et d'échappement HTML/JavaScript.

Les modules JavaScript ES sont chargés directement par le navigateur. Le fichier `tsconfig.json`, qui faisait référence à des types Vite et à une résolution de modules destinée à un environnement de bundling, a été supprimé car il n'est pas utilisé à l'exécution.

## Exécution locale

Pour tester localement, servez le dossier avec n'importe quel serveur HTTP statique. Par exemple, si Python est déjà installé :

```bash
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000`. Cette commande est uniquement une solution de test facultative ; Python n'est pas une dépendance de l'application publiée. L'ouverture directe en `file://` n'est pas recommandée, car les règles de sécurité du navigateur peuvent bloquer les modules JavaScript ES.

## Déploiement

Le workflow GitHub Actions situé dans `.github/workflows/deploy.yml` prépare un répertoire temporaire avec `index.html`, `assets/app.css`, `src/app.js` et les modules JavaScript de `src/data/`, puis publie uniquement ces fichiers ainsi que les modules utilitaires nécessaires vers `gh-pages`. Les feuilles Excel, les fichiers de travail et les référentiels JSON non nécessaires à l'exécution ne sont pas déployés. Le workflow n'installe aucun paquet et ne lance aucune compilation.

Le site public est servi par GitHub Pages à l'adresse https://redatest.github.io/GDO/.

## Données locales et confidentialité

Les paramètres de l'application et les fiches du carnet de terrain sont enregistrés dans le stockage local du navigateur (`localStorage`). Ils restent propres au navigateur et à l'appareil utilisés : ils ne sont pas automatiquement synchronisés entre plusieurs appareils et peuvent être perdus si les données du navigateur sont effacées. Exportez régulièrement les fiches importantes.

## Structure principale du projet

- `index.html` : page d'entrée ;
- `assets/app.css` : CSS statique ;
- `src/app.js` : orchestration de l'interface ;
- `src/data/` : chargement, modules et données réseau ;
- `src/config/` : configuration initiale de l'application ;
- `src/utils/` : fonctions utilitaires partagées ;
- `.github/workflows/deploy.yml` : déploiement statique vers GitHub Pages.

## Licence et usage

Ce dépôt est destiné à la consultation et à la modernisation des données patrimoniales du réseau de distribution. Les résultats affichés dépendent de la qualité et de la date des données sources ; toute décision d'exploitation doit s'appuyer sur les référentiels et procédures techniques officiels.
