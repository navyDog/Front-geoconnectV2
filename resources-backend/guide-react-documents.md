# Guide — Gestion des documents depuis un front React

## 🏗️ Architecture backend (résumé)

Le backend suit un pattern **upload-en-deux-temps** selon les cas :

| Endpoint | Méthode | Type | Description |
|---|---|---|---|
| `POST /documents/upload` | `multipart/form-data` | Part `file` | Upload standalone d'un fichier → retourne un `DocumentDTO` avec son `id` |
| `GET /documents/{id}/download` | — | — | Téléchargement d'un fichier binaire |
| `POST /propositionDevis` | `multipart/form-data` | 2 parts | Création proposition + PDF en une seule requête |
| `PUT /propositionDevis` | `multipart/form-data` | 2 parts | Mise à jour proposition + PDF |

---

## 📋 Cas 1 — `createDemandeDevis` avec document

> ⚠️ Le `DemandeDevisDTO` **n'a pas de champ `documentId`** et le `POST /demandeDevis` attend du **JSON pur** (`@RequestBody`).  
> La `DemandeDevisEntity` possède bien un champ `docsDevis` mais il n'est pas encore exposé dans le DTO ni dans le controller.

**→ Pour l'instant, il n'est pas possible d'associer un document à une `DemandeDevis` directement via l'API.**

### Ce qu'il faudrait faire côté backend pour l'activer

1. Ajouter un champ `documentId` dans `DemandeDevisDTO`
2. Modifier le controller pour accepter du `multipart/form-data` (comme `PropositionDevis`)
3. Adapter le mapper et le service en conséquence

### Flow React en attendant (2 étapes)

```
Étape 1 : Upload du fichier
POST /documents/upload  →  { id: 42, nomFichierOriginal: "plan.pdf", ... }

Étape 2 : Créer la demande (le documentId pourra être passé une fois le backend adapté)
POST /demandeDevis  →  { delaiMax, adresseProjet, clientId }
```

---

## 📋 Cas 2 — `createPropositionDevis` avec PDF (déjà supporté ✅)

Le backend accepte **un seul appel `multipart/form-data`** avec 2 parts :

- **`proposition`** : le JSON de la proposition, envoyé comme `Blob` avec le type `application/json`
- **`devisPdf`** : le fichier PDF (optionnel)

### Exemple React / Axios

```js
const createPropositionDevis = async (propositionData, pdfFile) => {
  const formData = new FormData();

  // Part "proposition" : JSON sérialisé comme Blob
  formData.append(
    "proposition",
    new Blob([JSON.stringify(propositionData)], { type: "application/json" })
  );

  // Part "devisPdf" : fichier binaire (optionnel)
  if (pdfFile) {
    formData.append("devisPdf", pdfFile); // pdfFile = objet File depuis <input type="file">
  }

  return axios.post("/propositionDevis", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // ⚠️ Ne PAS définir Content-Type manuellement
      // axios le génère automatiquement avec le bon boundary multipart
    },
  });
};
```

### Exemple JSX

```jsx
const [pdfFile, setPdfFile] = useState(null);

<input
  type="file"
  accept="application/pdf"
  onChange={(e) => setPdfFile(e.target.files[0])}
/>

<button
  onClick={() =>
    createPropositionDevis(
      {
        bureauEtudeId: 1,
        demandeDevisId: 3,
        prix: 1500,
        dateRendu: "2026-07-01",
      },
      pdfFile
    )
  }
>
  Soumettre
</button>
```

---

## 📋 Cas 3 — Upload standalone + association manuelle

C'est le pattern à utiliser pour **tout endpoint qui n'accepte qu'un `documentId`** dans son body JSON (ex : `DemandeDevis` une fois enrichi côté backend).

```js
// Étape 1 : uploader le fichier, récupérer son id
const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file); // le paramètre backend s'appelle exactement "file"
  const res = await axios.post("/documents/upload", formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.id; // ex: 42
};

// Étape 2 : utiliser l'id retourné dans la vraie requête JSON
const soumettreDemandeAvecDocument = async (demandeData, file) => {
  const documentId = await uploadDocument(file);

  return axios.post(
    "/demandeDevis",
    {
      delaiMax: demandeData.delaiMax,
      adresseProjet: demandeData.adresseProjet,
      clientId: demandeData.clientId,
      documentId: documentId, // une fois le backend adapté
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
```

---

## 📋 Cas 4 — Télécharger / afficher un document

```js
const downloadDocument = async (documentId, fileName) => {
  const res = await axios.get(`/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob", // important : réponse binaire
  });

  // Déclenche le téléchargement dans le navigateur
  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || `document-${documentId}`;
  link.click();
  URL.revokeObjectURL(url);
};
```

Pour **afficher** un PDF dans le navigateur au lieu de le télécharger :

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

## 🗺️ Récapitulatif des patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                     PATTERNS FRONT REACT                         │
├───────────────────────────┬─────────────────────────────────────┤
│ PropositionDevis          │ multipart/form-data (2 parts)        │
│ POST /propositionDevis    │  - "proposition" → JSON Blob         │
│ PUT  /propositionDevis    │  - "devisPdf"    → File (optionnel)  │
├───────────────────────────┼─────────────────────────────────────┤
│ Upload standalone         │ POST /documents/upload               │
│                           │  - "file" → File                     │
│                           │  → retourne DocumentDTO avec id       │
├───────────────────────────┼─────────────────────────────────────┤
│ DemandeDevis              │ JSON pur (pas de doc exposé à ce     │
│ POST /demandeDevis        │ jour) → upload séparé si backend     │
│                           │ enrichi avec documentId              │
├───────────────────────────┼─────────────────────────────────────┤
│ Téléchargement            │ GET /documents/{id}/download         │
│                           │  responseType: "blob"                │
└───────────────────────────┴─────────────────────────────────────┘
```

---

## ⚠️ Points d'attention

- **Ne jamais forcer `Content-Type: multipart/form-data`** dans les headers axios quand tu utilises `FormData` : axios le définit automatiquement avec le bon `boundary`. Le forcer manuellement casse la requête.
- **Toujours passer le JWT** dans `Authorization: Bearer <token>` — tous les endpoints sont sécurisés.
- Pour `createPropositionDevis`, la part JSON **doit être un `Blob`** avec `type: "application/json"`, pas une simple chaîne, sinon Spring ne saura pas la désérialiser en `PropositionDevisDTO`.

