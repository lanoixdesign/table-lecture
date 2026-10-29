# Table de lecture

Prototype web (mobile, en français) : la caméra regarde une table, reconnaît les objets posés et affiche des fiches holographiques. Tout tourne dans le navigateur, sans clé d'API.

- Détection rapide : TensorFlow.js COCO-SSD (80 classes).
- Mémoire étendue (v3) : MobileCLIP-S0 (zero-shot) via transformers.js, chargé en arrière-plan, + `vocab.json` : 358 objets avec fiches en français. Les empreintes de chaque objet combinent des descriptions textuelles et la moyenne d'images libres de Wikimedia Commons (CC0 / domaine public / CC BY / CC BY-SA ; seules les empreintes sont stockées, voir `credits.html`).
- Mode « Apprendre » : nommez un objet, son empreinte reste sur votre appareil (localStorage) et il est ensuite reconnu en priorité.
- Repli : MobileNet si la mémoire étendue ne se charge pas.
- Codes-barres et QR codes (v3.1) : lecture en direct, sur photo figée ou importée (BarcodeDetector natif, sinon ZXing en WebAssembly). EAN-13/8, UPC-A/E, Code 128, QR.
  - Code-barres produit : fiche lue dans Open Food Facts, puis Open Beauty Facts, Open Products Facts, Open Pet Food Facts (données ODbL). Code inconnu : on peut lui donner un nom et une note, gardés sur l'appareil.
  - QR code : contenu affiché (lien, texte, Wi-Fi, contact, position…). Un lien ne s'ouvre jamais tout seul : bouton « Ouvrir le lien », avec avertissement pour http, liens raccourcis ou adresses IP. Rien n'est connecté ni exécuté automatiquement.
  - Historique des codes scannés dans MÉMOIRE (local, effaçable).
