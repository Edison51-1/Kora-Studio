<p align="center"><img src="build/icon.png" width="110" alt="KORA Studio"></p>
<h1 align="center">KORA Studio</h1>
<p align="center">Éditeur vidéo, image et audio — simple, moderne, hors ligne.</p>

## Fonctionnalités
- **Formats** : 16:9 (YouTube), 9:16 (TikTok, Shorts, Reels), 1:1 et 4:5 (Instagram)
- **Sous-titres automatiques** : le logiciel écoute les vidéos et écrit ce qui est dit en bas de l'image (hors ligne, modèle Whisper téléchargé une fois) ; import de fichiers `.srt` ; sous-titres modifiables
- **Stickers, flèches, images et vidéos par-dessus** : 26 stickers vectoriels (couleur modifiable), 2 calques d'incrustation, position, taille, rotation, opacité, animations (fondu, pop, glissements)
- **Deux vidéos côte à côte** (ou l'une au-dessus de l'autre) avec réglage du son de chacune
- **Transitions** entre clips (fondu, fondu au noir, dissolution, glissements, volets, cercle, pixels, zoom)
- **Timeline libre** : 2 pistes audio positionnables à la seconde près, glisser pour déplacer, tirer les bords pour raccourcir, vraie forme d'onde, miniatures
- Textes animés à tout moment, glisser dans l'aperçu ; 18 animations d'images ; vitesse, couleurs, cadrage
- **Son** : volume jusqu'à 200 %, fondus, réduction du bruit, remplacement du son d'une vidéo, normalisation à l'export
- **Vidéo → MP3** (128 à 320 kbps), export d'un seul clip, qualité Haute/Standard/Légère, estimation de la taille
- Projets `.kora`, **sauvegarde automatique** avec récupération après un plantage, confirmation avant de quitter
- Export en étapes (faible consommation de mémoire), journal des erreurs

## Raccourcis
| Touche | Action |
|---|---|
| Espace | Lecture / pause |
| C | Couper à la tête de lecture |
| T | Ajouter un texte |
| Suppr | Supprimer le clip |
| Ctrl+C / Ctrl+V | Copier / coller un clip |
| Ctrl+Z / Ctrl+Y | Annuler / rétablir |
| Ctrl+S | Enregistrer le projet |
| ← → | Reculer / avancer d'une image |

## Développement
    npm install
    npm start
    npm test        (tests du moteur d'export avec le vrai FFmpeg)

## Créer l'installeur
    npm run dist
Windows : `.exe` — Linux : `.AppImage` et `.deb` (dans `dist/`).
Sur GitHub, l'action **Build KORA Studio** construit les deux et les publie dans les *Releases* quand tu pousses un tag `v*` (ex. `v0.1.0`).

## Feuille de route
Accélération par la carte graphique · séparation voix / musique · sélection multiple de clips · enregistrement de la voix

## Licence
MIT
