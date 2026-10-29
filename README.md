# GDO-MT

**GDO-MT** est une application web de consultation, d'analyse et de visualisation du réseau électrique moyenne tension (MT/HTA) de la wilaya de Guelma, en Algérie.

- **Application en ligne :** https://redatest.github.io/GDO/
- **Dépôt source :** https://github.com/redatest/GDO
- **Technologies :** HTML, CSS et JavaScript natifs (modules ES)
- **Hébergement :** GitHub Pages — site statique, sans serveur applicatif

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

## Utilisation et développement

L'application publiée s'exécute directement dans le navigateur et ne nécessite aucun outil d'installation ou de compilation.

Le navigateur charge directement :
- `index.html` : page d'entrée ;
- `assets/app.css` : feuille de style statique ;
- `src/app.js` : logique de l'application en JavaScript natif ;
- `src/data/` : modules JavaScript et référentiels réseau.

Pour tester les fichiers localement, utilisez un serveur HTTP statique, par exemple l'extension **Live Server** de Visual Studio Code ou le serveur intégré de Python :

```bash
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000`. Il n'est pas recommandé d'ouvrir directement `index.html` en `file://`, car les modules JavaScript du navigateur peuvent être bloqués par les règles de sécurité d'origine.

## Déploiement

Le workflow GitHub Actions situé dans `.github/workflows/deploy.yml` publie directement les fichiers statiques de la branche `main` vers `gh-pages`. Il n'installe aucune dépendance et ne lance aucune compilation.

Le site public est servi par GitHub Pages à l'adresse https://redatest.github.io/GDO/.

## Données locales et confidentialité

Les paramètres de l'application et les fiches du carnet de terrain sont enregistrés dans le stockage local du navigateur (`localStorage`). Ils restent propres au navigateur et à l'appareil utilisés : ils ne sont pas automatiquement synchronisés entre plusieurs appareils et peuvent être perdus si les données du navigateur sont effacées. Exportez régulièrement les fiches importantes.

## Structure principale du projet

- `index.html` : page d'entrée ;
- `assets/app.css` : CSS statique prêt à être servi par le navigateur ;
- `src/app.js` : interface et logique de l'application ;
- `src/data/` : référentiels et données réseau ;
- `.github/workflows/deploy.yml` : déploiement statique vers GitHub Pages.

## Licence et usage

Ce dépôt est destiné à la consultation et à la modernisation des données patrimoniales du réseau de distribution. Les résultats affichés dépendent de la qualité et de la date des données sources ; toute décision d'exploitation doit s'appuyer sur les référentiels et procédures techniques officiels.
