# Tous Alertes

Carte web de veille des évènements climatiques, bâtie avec MapLibre GL.

## Démarrer

```bash
npm install
npm run dev
```

## Sources à connecter

L'interface présente des données de démonstration. Pour la production, les couches prévues sont :

- **Incendies** : NASA FIRMS (VIIRS / MODIS) pour les points chauds et Copernicus EFFIS pour les périmètres et le danger feu.
- **Inondations** : Copernicus EMS et le Global Flood Monitoring de l'Observatoire des inondations.
- **Tempêtes** : Copernicus Climate Data Store et alertes des services météorologiques nationaux.
- **Fonds de carte** : OpenTopoMap (topographique) et Esri World Imagery (satellite).