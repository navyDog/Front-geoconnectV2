# Guide — Gestion des documents depuis un front React

## 🏗️ Architecture backend (résumé)

Le backend suit un pattern **upload-en-deux-temps** selon les cas :

| Endpoint | Méthode | Type | Description |
|---|---|---|---|
| `POST /documents/upload` | `multipart/form-data` | Part `file` | Upload standalone → retourne un `DocumentDTO` avec `id` et `nomTelechargement` |
| `GET /documents/{id}/download` | — | — | Téléchargement binaire, `Content-Disposition` porte le bon nom |
| `POST /propositionDevis` | `multipart/form-data` | 2 parts | Création proposition + PDF en une seule requête |
| `PUT /propositionDevis` | `multipart/form-data` | 2 parts | Mise à jour proposition + PDF |

---

## 📄 Structure du `DocumentDTO`

Tous les endpoints qui retournent un document (upload, listing, etc.) renvoient maintenant
un champ **`nomTelechargement`** calculé côté backend :

```json
{
  "id": 12,
  "nomFichierOriginal": "uuid_rapport.pdf",
  "nomTelechargement": "DUPONT_JEAN-G1-RAPPORT.pdf",
  "typeContenu": "application/pdf",
  "tailleFichier": 204800,
  "statut": "ATTACHE",
  "expireAt": null
}
```

| Champ | Usage |
|---|---|
| `nomFichierOriginal` | Clé technique interne — **ne pas afficher à l'utilisateur** |
| `nomTelechargement` | Nom à afficher dans l'UI et à utiliser lors du téléchargement |

> Le nom suit le pattern `NOM_CLIENT-TYPE_MISSION-TYPE_DOCUMENT.ext`  
> (ex : `DUPONT_JEAN-G1-RAPPORT.pdf`, `MARTIN_SOPHIE-G2_PRO-DEVIS_SIGNE.pdf`).  
> Si le document est encore orphelin (pas encore attaché à une étude), le nom original sanitisé est retourné.

---

## 📋 Cas 1 — Afficher le nom d'un document **sans** le télécharger

Utilise directement `nomTelechargement` depuis le DTO reçu :

```jsx
// Exemple : liste des documents d'une étude
const DocumentItem = ({ document }) => (
  <div>
    <span>{document.nomTelechargement}</span>
    <button onClick={() => downloadDocument(document.id, document.nomTelechargement)}>
      Télécharger
    </button>
  </div>
);
```

Pas de logique de nommage côté front — le back fait tout.

---

## 📋 Cas 2 — Télécharger un document avec le bon nom

```js
const downloadDocument = async (documentId, nomTelechargement) => {
  const res = await axios.get(`/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });

  // Le Content-Disposition du back porte déjà le bon nom,
  // mais on le passe explicitement pour être sûr.
  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomTelechargement;
  link.click();
  URL.revokeObjectURL(url);
};
```

> ✅ `nomTelechargement` provient du `DocumentDTO` déjà en mémoire — aucun appel réseau supplémentaire.

---

## 📋 Cas 3 — Afficher un PDF dans le navigateur (sans téléchargement)

```js
const afficherDocument = async (documentId) => {
  const res = await axios.get(`/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  window.open(url, "_blank"); // ouvre dans un nouvel onglet
};
```

---

## 📋 Cas 4 — Upload standalone + affichage immédiat du nom

Après un upload, le `DocumentDTO` retourné contient déjà `nomTelechargement`.
S'il est encore orphelin (pas encore attaché), le backend retourne le nom original sanitisé.
Le nom structuré sera mis à jour automatiquement dès que le document sera attaché à une étude
et que le front rechargera le listing.

```js
const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post("/documents/upload", formData, {
    headers: { Authorization: `Bearer ${token}` },
    // ⚠️ Ne pas forcer Content-Type : axios le gère avec le bon boundary
  });

  // res.data est un DocumentDTO avec nomTelechargement déjà renseigné
  return res.data;
};

// Exemple d'usage dans un composant
const handleUpload = async (file) => {
  const doc = await uploadDocument(file);
  console.log(doc.nomTelechargement); // ex: "MON_FICHIER_PDF" (orphelin sanitisé)
  setDocuments((prev) => [...prev, doc]);
};
```

---

## 📋 Cas 5 — `createPropositionDevis` avec PDF (déjà supporté ✅)

Le backend accepte **un seul appel `multipart/form-data`** avec 2 parts :

- **`proposition`** : le JSON de la proposition, envoyé comme `Blob` avec le type `application/json`
- **`devisPdf`** : le fichier PDF (optionnel)

```js
const createPropositionDevis = async (propositionData, pdfFile) => {
  const formData = new FormData();

  formData.append(
    "proposition",
    new Blob([JSON.stringify(propositionData)], { type: "application/json" })
  );

  if (pdfFile) {
    formData.append("devisPdf", pdfFile);
  }

  return axios.post("/propositionDevis", formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
```

---

## 📋 Cas 6 — `createDemandeDevis` avec document

> ⚠️ Le `POST /demandeDevis` attend du **JSON pur** (`@RequestBody`).  
> L'association d'un document se fait en deux étapes.

```js
const soumettreDemandeAvecDocument = async (demandeData, file) => {
  // Étape 1 : upload
  const doc = await uploadDocument(file);

  // Étape 2 : créer la demande avec le documentId
  return axios.post(
    "/demandeDevis",
    { ...demandeData, documentId: doc.id },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
```

---

## 🗺️ Récapitulatif

```
┌──────────────────────────────────────────────────────────────────────┐
│                       NOMMAGE DES DOCUMENTS                           │
├──────────────────────────────────────────────────────────────────────┤
│  Afficher le nom        →  document.nomTelechargement  (champ DTO)   │
│  Déclencher le DL       →  link.download = nomTelechargement         │
│  Logique de nommage     →  100% côté back, rien côté front           │
│  Mise à jour du nom     →  automatique au rechargement du listing     │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     PATTERNS D'APPELS API                             │
├───────────────────────────┬──────────────────────────────────────────┤
│ PropositionDevis          │ multipart/form-data (2 parts)            │
│ POST /propositionDevis    │  - "proposition" → JSON Blob             │
│ PUT  /propositionDevis    │  - "devisPdf"    → File (optionnel)      │
├───────────────────────────┼──────────────────────────────────────────┤
│ Upload standalone         │ POST /documents/upload                   │
│                           │  - "file" → File                         │
│                           │  → retourne DocumentDTO avec             │
│                           │    nomTelechargement                      │
├───────────────────────────┼──────────────────────────────────────────┤
│ Téléchargement            │ GET /documents/{id}/download             │
│                           │  responseType: "blob"                    │
│                           │  link.download = doc.nomTelechargement   │
└───────────────────────────┴──────────────────────────────────────────┘
```

---

## ⚠️ Points d'attention

- **Ne jamais forcer `Content-Type: multipart/form-data`** dans les headers axios : axios le définit automatiquement avec le bon `boundary`. Le forcer manuellement casse la requête.
- **Toujours passer le JWT** dans `Authorization: Bearer <token>` — tous les endpoints sont sécurisés.
- **Ne pas utiliser `nomFichierOriginal`** pour l'affichage — c'est une clé technique interne (UUID + nom brut). Utiliser exclusivement `nomTelechargement`.
- Pour `createPropositionDevis`, la part JSON **doit être un `Blob`** avec `type: "application/json"`, pas une simple chaîne.
