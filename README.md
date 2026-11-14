<p align="center"><img src="build/icon.png" width="110" alt="KORA Studio"></p>
<h1 align="center">KORA Studio</h1>
<p align="center">Éditeur vidéo, image et audio — simple, moderne, hors ligne.</p>

## Fonctionnalités
- Import de vidéos, images et audios (bouton ou glisser-déposer), timeline avec règle, tête de lecture et zoom
- **Textes** posés à n'importe quel moment : police, taille, couleur, contour, fond, position (glisser dans l'aperçu), animation d'entrée
- **Remplacer le son d'une vidéo** par un autre fichier audio
- **Son réglable partout** : volume (jusqu'à 200 %), coupure du son, fondus entrant/sortant ; coupe un clip en morceaux pour régler chaque partie
- **18 animations d'images** au choix : zooms, panoramiques, Ken Burns, pulsation, fondus, glissements, rotation, tremblement
- Vitesse des vidéos (0,5× à 2×), luminosité, contraste, saturation, cadrage des images (contenir / remplir)
- Couper, dupliquer, supprimer, réordonner, annuler/rétablir
- **Enregistrer et rouvrir un projet** (fichier `.kora`)
- Lecture de toute la séquence en direct, export MP4 (480p / 720p / 1080p) ou MP3 — propulsé par FFmpeg
- Export en étapes (un clip à la fois) : faible consommation de mémoire, priorité basse pour garder l'ordinateur fluide

## Raccourcis
| Touche | Action |
|---|---|
| Espace | Lecture / pause |
| C | Couper à la tête de lecture |
| T | Ajouter un texte |
| Suppr | Supprimer le clip |
| Ctrl+S | Enregistrer le projet |
| Ctrl+Z / Ctrl+Y | Annuler / rétablir |

## Développement
    npm install
    npm start

## Créer l'installeur
    npm run dist
Windows : `.exe` — Linux : `.AppImage` (dans `dist/`).
Sur GitHub, l'action **Build KORA Studio** construit les deux et les publie dans les *Releases* quand tu pousses un tag `v*` (ex. `v0.1.0`).

## Feuille de route
Transitions entre clips · sous-titres (.srt) · pistes multiples · enregistrement de la voix · export d'un seul clip

## Licence
MIT
