# Installer le compteur de jetons sur iPhone

Le dossier contient une application web complète : une fois installée, elle
s'ouvre en plein écran depuis l'écran d'accueil, sans barre Safari, et
fonctionne sans connexion. La partie en cours est sauvegardée sur le téléphone
à chaque action.

Fichiers : `index.html`, `sw.js`, `manifest.webmanifest`, `icon-180.png`,
`icon-192.png`, `icon-512.png`. Ils doivent rester ensemble dans le même dossier.

## Mise en ligne avec GitHub Pages (gratuit, permanent)

1. Créer un compte sur github.com.
2. Cliquer sur **New repository**, le nommer `jetons`, le laisser **Public**,
   puis **Create repository**.
3. Sur la page du dépôt : **Add file → Upload files**, glisser les six fichiers,
   puis **Commit changes**.
4. Onglet **Settings → Pages**. Sous *Branch*, choisir `main` et `/ (root)`,
   puis **Save**.
5. Attendre une minute. L'adresse apparaît en haut de la page, du type
   `https://TONPSEUDO.github.io/jetons/`.

## Ajouter l'app à l'écran d'accueil

1. Ouvrir cette adresse **dans Safari** sur l'iPhone (pas Chrome, l'installation
   n'y fonctionne pas).
2. Bouton **Partager** (le carré avec la flèche) → **Sur l'écran d'accueil** →
   **Ajouter**.
3. L'icône apparaît sur l'écran d'accueil. En la lançant, l'app démarre en plein
   écran, hors connexion comprise.

Les amis peuvent faire pareil depuis la même adresse, chaque téléphone garde sa
propre partie.

## Comment la sauvegarde fonctionne

La partie est écrite dans le stockage local du téléphone après chaque action, et
une nouvelle fois quand l'app passe en arrière-plan. Si iOS la ferme en pleine
main, il suffit de la rouvrir : tapis, mises du tour, donneur, blinds, joueurs
couchés et ordre des sièges sont restaurés tels quels. Le bouton
« Annuler la dernière action » reste disponible sur les coups joués depuis
l'ouverture.

Trois choses effacent la partie, à éviter en cours de tournoi : le mode de
navigation privée, « Effacer historique et données de site » dans les réglages
Safari, et la suppression de l'app depuis l'écran d'accueil.

## Mettre l'app à jour plus tard

Remplacer `index.html` dans le dépôt (ou tout autre fichier du site). Le
déploiement sur GitHub Pages se relance automatiquement, et la version du
cache dans `sw.js` est recalculée à chaque déploiement : pas besoin de
l'incrémenter à la main, les téléphones récupèrent la nouvelle version toute
seuls.

## Autre option, sans compte

app.netlify.com/drop accepte le dossier par glisser-déposer et renvoie une
adresse immédiatement. Pratique pour tester, mais l'adresse peut expirer sans
compte : pour un usage durable, GitHub Pages est plus sûr.
