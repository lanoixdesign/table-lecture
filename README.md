# Table de lecture

Prototype web (mobile, en français) : la caméra regarde une table, reconnaît les objets posés et affiche des fiches holographiques. Tout tourne dans le navigateur, sans clé d'API.

- Détection rapide : TensorFlow.js COCO-SSD (80 classes).
- Mémoire étendue (v3) : MobileCLIP-S0 (zero-shot) via transformers.js, chargé en arrière-plan, + `vocab.json` : 358 objets avec fiches en français. Les empreintes de chaque objet combinent des descriptions textuelles et la moyenne d'images libres de Wikimedia Commons (CC0 / domaine public / CC BY / CC BY-SA ; seules les empreintes sont stockées, voir `credits.html`).
- Mode « Apprendre » : nommez un objet, son empreinte reste sur votre appareil (localStorage) et il est ensuite reconnu en priorité.
- Repli : MobileNet si la mémoire étendue ne se charge pas.
