# Escapade

Escapade est un planificateur de vacances familial en HTML, CSS et JavaScript natifs. Il fonctionne sans compilation, sans compte et sans base de données.

Le projet est inspiré par les principes d'EasyItinerary: organisation jour par jour, carte, budget, réservations, checklist et sauvegarde locale. L'interface et l'implémentation d'Escapade ont été conçues pour ce projet.

## Fonctions

- Plusieurs voyages dans le même navigateur
- Programme jour par jour
- Activités avec horaires, statut, coût, notes, liens et coordonnées
- Glisser-déposer entre les journées sur ordinateur
- Boutons de réorganisation compatibles mobile
- Carte Leaflet et OpenStreetMap
- Recherche de lieux via Photon, sans clé API
- Budget prévisionnel et réel
- Réservations et numéros de confirmation
- Checklist par groupe et par voyageur
- Inspirations et favoris
- Destinations et activités favorites personnalisables
- Thème clair ou sombre
- Sauvegarde automatique dans `localStorage`
- Import et export JSON
- Impression du voyage
- PWA installable et cache hors ligne
- Interface responsive

## Lancer en local

L'ouverture directe de `index.html` permet d'utiliser presque toute l'application. Pour tester la PWA et le service worker, utilisez un serveur local:

```bash
python -m http.server 8080
```

Puis ouvrez `http://localhost:8080`.

## Publier sur GitHub Pages

1. Créez un dépôt GitHub, par exemple `escapade-planner`.
2. Ajoutez tous les fichiers de ce dossier à la racine du dépôt.
3. Dans GitHub, ouvrez `Settings`, puis `Pages`.
4. Dans `Build and deployment`, choisissez `Deploy from a branch`.
5. Dans `Source`, choisissez `GitHub Actions`.
6. Le workflow inclus dans `.github/workflows/pages.yml` publiera automatiquement le site à chaque mise à jour de la branche `main`.

En ligne de commande:

```bash
git init
git add .
git commit -m "Initial Escapade planner"
git branch -M main
git remote add origin https://github.com/Rickhunter-stack/escapade-planner.git
git push -u origin main
```

## Données et confidentialité

Toutes les données sont enregistrées dans le navigateur. Une suppression des données du site ou un changement d'appareil peut les effacer. Utilisez régulièrement l'export JSON.

La recherche de lieux interroge le service public Photon. Les fonds cartographiques proviennent d'OpenStreetMap.

## Limites de la version GitHub Pages

GitHub Pages est un hébergement statique. Il n'y a donc pas de synchronisation automatique entre appareils ni de collaboration en temps réel. L'import et l'export JSON servent au transfert des voyages.

## Crédits

- Concept de référence: EasyItinerary par Dobidop, licence MIT
- Carte: Leaflet
- Données cartographiques: OpenStreetMap
- Géocodage: Photon par Komoot

## Licence

MIT
