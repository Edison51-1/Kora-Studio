<p align="center"><img src="build/icon.png" width="110" alt="KORA Studio"></p>
<h1 align="center">KORA Studio</h1>
<p align="center">Éditeur vidéo, image et audio — simple, moderne, hors ligne.</p>

## Fonctionnalités
- Import de vidéos, images et audios (bouton ou glisser-déposer)
- Timeline avec règle de temps, tête de lecture et zoom
- Couper, supprimer, dupliquer, réordonner les clips, annuler/rétablir
- Lecture de toute la séquence avec aperçu en direct
- Animation des images (zoom avant/arrière, fondu, glissement) et ajout de son
- Volume par clip, fusion de plusieurs médias en un seul fichier
- Export MP4 (480p / 720p / 1080p) ou MP3 — propulsé par FFmpeg

## Raccourcis
| Touche | Action |
|---|---|
| Espace | Lecture / pause |
| C | Couper à la tête de lecture |
| Suppr | Supprimer le clip |
| Ctrl+Z / Ctrl+Y | Annuler / rétablir |

## Développement
    npm install
    npm start

## Créer l'installeur
    npm run dist
Windows : `.exe` — Linux : `.AppImage` (dans `dist/`).
Sur GitHub, l'action **Build KORA Studio** construit les deux et les publie dans les *Releases* quand tu pousses un tag `v*` (ex. `v0.1.0`).

## Feuille de route
Texte et sous-titres · transitions · filtres de couleur · pistes multiples · enregistrement de la voix

## Licence
MIT
