# Flows métier — GeoConnect Front

> Document décrivant les actions métiers actuellement disponibles dans l'application React ainsi que ce qui reste à implémenter pour compléter les flows post-acceptation de proposition (suivi de l'étude).

---

## 👤 Authentification

### Connexion
1. L'utilisateur saisit son `login` et `password` sur `/login`.
2. `POST /api/auth/login` → retourne un JWT et les infos utilisateur.
3. Le token est stocké en `localStorage` et injecté automatiquement dans chaque requête via un intercepteur Axios.
4. Redirection selon le rôle :
   - `CLIENT` → `/client/dashboard`
   - `BUREAU_ETUDE` → `/be/dashboard`

### Inscription (Bureau d'étude)
1. Le formulaire `/be/register` collecte `login`, `password`, et le rôle `BUREAU_ETUDE`.
2. `POST /api/auth/register` → retourne un JWT.
3. Redirection vers le dashboard BE.

---

## 🏗️ Côté CLIENT

### 1. Créer une demande de devis (`/client/new-request`)

**Flow :**
1. Le client remplit le formulaire :
   - Type de mission (G1, G2 AVP, G2 PRO) *(requis)*
   - Description / particularités
   - Référence cadastrale, superficie, nombre de lots
   - Délai maximum souhaité
   - Adresse du projet (rue, code postal, ville) *(requis)*
   - Fichier joint *(optionnel)*
2. Si un fichier est joint :
   - `POST /documents/upload` → retourne un `DocumentDTO` avec son `id`
3. `POST /demandeDevis` avec les données du formulaire + `docsDevisId` si fichier uploadé.
4. Redirection vers `/client/dashboard`.

```
[Formulaire] → (optionnel) POST /documents/upload
             → POST /demandeDevis
             → Redirection Dashboard
```

---

### 2. Consulter ses demandes et études (`/client/dashboard`)

- Onglet **Demandes** : liste toutes les demandes du client avec leur statut (EN_ATTENTE, ACCEPTEE, REFUSEE) et les propositions reçues.
- Onglet **Études** : liste les études en cours ou terminées avec leur état d'avancement.

**Données chargées :**
- `GET /client` → identifier le compte client lié à l'utilisateur connecté
- `GET /demandeDevis/client/{clientId}` → liste des demandes
- `GET /propositionDevis/devis/{demandeId}` → propositions par demande
- `GET /etude/client/{clientId}` → liste des études
- `GET /etude/{id}/detail` → détail complet de chaque étude

---

### 3. Voir le détail d'une demande et accepter une proposition (`/client/request/:id`)

**Flow :**
1. Chargement de la demande : `GET /demandeDevis/{id}`
2. Chargement des propositions : `GET /propositionDevis/devis/{id}`
3. Le client visualise les propositions reçues (prix, délai rendu, délai intervention, document PDF joint).
4. Le client peut **accepter une proposition** :
   - `PATCH /propositionDevis/{id}/accepter`
   - Le backend refuse automatiquement les autres propositions.
   - L'UI met à jour les statuts en local (ACCEPTEE / REFUSEE).

```
[Détail demande] → Affichage des propositions
                → PATCH /propositionDevis/{id}/accepter
                → Mise à jour statuts en UI
```

---

## 🏢 Côté BUREAU D'ÉTUDE (BE)

### 1. Consulter les demandes disponibles (`/be/dashboard`)

- Liste toutes les demandes de devis en attente.
- **Données chargées :**
   - `GET /demandeDevis` → toutes les demandes
   - `GET /bureauEtude` → identifier le bureau lié à l'utilisateur connecté

---

### 2. Soumettre une proposition de devis (`/be/request/:id`)

**Flow :**
1. Chargement de la demande : `GET /demandeDevis/{id}`
2. Vérification si le BE a déjà soumis une proposition : `GET /propositionDevis/devis/{demandeId}`
3. Le BE remplit le formulaire :
   - Prix HT *(requis)*
   - Délai de rendu (jours)
   - Délai d'intervention (jours)
   - Fichier PDF du devis *(optionnel)*
4. Si un PDF est joint :
   - `POST /documents/upload` → retourne un `DocumentDTO` avec son `id`
5. `POST /propositionDevis` avec les données + `documentId` si PDF uploadé.
6. La proposition soumise s'affiche en lecture seule.

```
[Formulaire proposition] → (optionnel) POST /documents/upload
                         → POST /propositionDevis
                         → Affichage proposition soumise
```

> ⚠️ Si le BE a déjà soumis une proposition pour cette demande, le formulaire est masqué et la proposition existante est affichée.

---

## 📄 Gestion des documents

| Action | Endpoint | Détail |
|---|---|---|
| **Upload** | `POST /documents/upload` | `multipart/form-data`, part `file` |
| **Télécharger** | `GET /documents/{id}/download` | Déclenche le téléchargement navigateur |
| **Afficher (PDF)** | `GET /documents/{id}/download` | Ouvre dans un nouvel onglet |
| **Supprimer** | `DELETE /documents/{id}` | — |

> ⚠️ Ne jamais forcer le `Content-Type` manuellement lors d'un upload — Axios le génère automatiquement avec le bon `boundary` multipart.

---

## 🗺️ Récapitulatif des routes front

| Route | Rôle | Description |
|---|---|---|
| `/login` | Tous | Connexion |
| `/be/register` | BE | Inscription bureau d'étude |
| `/client/dashboard` | CLIENT | Dashboard demandes & études |
| `/client/new-request` | CLIENT | Créer une demande de devis |
| `/client/request/:id` | CLIENT | Détail demande + acceptation proposition |
| `/be/dashboard` | BE | Liste des demandes disponibles |
| `/be/request/:id` | BE | Détail demande + soumission proposition |

---

## ⚠️ Limitations connues

- **Association document ↔ DemandeDevis** : le champ `docsDevisId` est envoyé au backend, mais le `DemandeDevisDTO` backend ne l'expose pas encore formellement. Le backend doit être enrichi pour le persister proprement.
- **Mise à jour d'une proposition** : l'API `PUT /propositionDevis` existe côté backend mais n'est pas encore exposée dans l'UI.
- **Création d'une étude** : `POST /etude` est disponible en API (réservé `ADMIN` / `BUREAU_ETUDE`) mais non exposé dans l'UI actuelle — la création se fait normalement via l'acceptation d'une proposition côté back.

---

## 🔄 Flow post-acceptation de proposition — Suivi de l'étude

> Ce flow commence après qu'une proposition de devis a été acceptée par le client (étude à l'état `DEVIS_VALIDE`).

### États de l'étude (machine à états)

```
DEVIS_VALIDE
  → DATE_INTERVENTION_PROPOSEE  (BE propose une date)
    → DATE_INTERVENTION_FIXEE   (CLIENT valide)
    → DATE_INTERVENTION_PROPOSEE (CLIENT refuse → BE propose une autre date)
      → DATE_INTERVENTION_FIXEE
        → INTERVENTION_EFFECTUEE (BE)
          → RAPPORT_TERMINE      (BE — upload rapport requis)
            → PAIEMENT_EFFECTUE  (CLIENT)
```

---

### ✅ État du backend — **IMPLÉMENTÉ**

Les endpoints, la machine à états et la sécurité par rôle sont en place.

| Endpoint | Rôle | Transition | Body |
|---|---|---|---|
| `PATCH /etude/{id}/proposer-date` | `BUREAU_ETUDE` | `DEVIS_VALIDE` / `DATE_INTERVENTION_PROPOSEE` → `DATE_INTERVENTION_PROPOSEE` | `{ "dateIntervention": "YYYY-MM-DD" }` |
| `PATCH /etude/{id}/valider-date` | `CLIENT` | `DATE_INTERVENTION_PROPOSEE` → `DATE_INTERVENTION_FIXEE` | — |
| `PATCH /etude/{id}/refuser-date` | `CLIENT` | `DATE_INTERVENTION_PROPOSEE` → `DATE_INTERVENTION_PROPOSEE` (reset date) | — |
| `PATCH /etude/{id}/intervention-effectuee` | `BUREAU_ETUDE` | `DATE_INTERVENTION_FIXEE` → `INTERVENTION_EFFECTUEE` | — |
| `PATCH /etude/{id}/rapport-termine` | `BUREAU_ETUDE` | `INTERVENTION_EFFECTUEE` → `RAPPORT_TERMINE` | `{ "rapportId": Long, "dateRendu": "YYYY-MM-DD" }` |
| `PATCH /etude/{id}/paiement-effectue` | `CLIENT` | `RAPPORT_TERMINE` → `PAIEMENT_EFFECTUE` | — |
| `PATCH /etude/{id}/devis-signe` | `BUREAU_ETUDE` | — (attachement seul, pas de transition d'état) | `{ "documentId": Long }` |

> ℹ️ `rapport-termine` requiert un document déjà uploadé via `POST /documents/upload` et une date de rendu. Le rapport est attaché et l'état est mis à jour atomiquement.

> ⚠️ Toute tentative de transition invalide (mauvais état courant) retourne une `400` avec un message explicite.

---

### 🖥️ Ce qui reste à faire côté FRONTEND

#### 1. Page détail d'une étude

Deux nouvelles routes à créer :

| Route | Rôle | Description |
|---|---|---|
| `/client/etude/:id` | CLIENT | Détail étude + actions client |
| `/be/etude/:id` | BE | Détail étude + actions bureau d'étude |

Les données sont chargées via `GET /etude/{id}/detail` (retourne l'étude complète avec proposition, demande et client).

---

**Côté CLIENT** — afficher les actions selon l'état courant :

| État | Action(s) à afficher | Appel API |
|---|---|---|
| `DEVIS_VALIDE` | *(attente du BE)* — afficher un message d'information | — |
| `DATE_INTERVENTION_PROPOSEE` | ✅ **Valider la date** / ❌ **Refuser la date** | `PATCH /etude/{id}/valider-date` ou `/refuser-date` |
| `DATE_INTERVENTION_FIXEE` | *(intervention planifiée)* — afficher la date | — |
| `INTERVENTION_EFFECTUEE` | *(en cours de traitement)* | — |
| `RAPPORT_TERMINE` | 💳 **Confirmer le paiement** | `PATCH /etude/{id}/paiement-effectue` |
| `PAIEMENT_EFFECTUE` | *(étude clôturée)* | — |

---

**Côté BUREAU D'ÉTUDE** — afficher les actions selon l'état courant :

| État | Action(s) à afficher | Appel API |
|---|---|---|
| `DEVIS_VALIDE` | 📅 **Proposer une date d'intervention** (datepicker) | `PATCH /etude/{id}/proposer-date` + `{ "dateIntervention" }` |
| `DATE_INTERVENTION_PROPOSEE` | 📅 **Proposer une nouvelle date** (si refus client) | `PATCH /etude/{id}/proposer-date` + `{ "dateIntervention" }` |
| `DATE_INTERVENTION_FIXEE` | ✅ **Marquer l'intervention effectuée** | `PATCH /etude/{id}/intervention-effectuee` |
| `INTERVENTION_EFFECTUEE` | 📄 **Uploader le rapport** puis **Terminer le rapport** | 1. `POST /documents/upload` → récupérer `documentId` 2. `PATCH /etude/{id}/rapport-termine` + `{ "rapportId", "dateRendu" }` |
| `RAPPORT_TERMINE` | *(en attente du paiement client)* | — |
| `PAIEMENT_EFFECTUE` | *(étude clôturée)* | — |

> ℹ️ Pour `INTERVENTION_EFFECTUEE`, le flow upload + terminer rapport doit être traité en deux étapes séquentielles dans l'UI : d'abord upload du fichier (comme pour les autres documents), puis appel PATCH avec l'id retourné et la date de rendu.

> ℹ️ Le BE peut également attacher le devis signé à tout moment via `PATCH /etude/{id}/devis-signe` + `{ "documentId" }` si le client lui fournit le document signé hors-flow.

---

#### 2. Enrichir les dashboards

**Dashboard CLIENT (`/client/dashboard`) :**
- Onglet **Études** : afficher un badge coloré par état (`DEVIS_VALIDE` → gris, `DATE_INTERVENTION_PROPOSEE` → orange, `DATE_INTERVENTION_FIXEE` → bleu, `INTERVENTION_EFFECTUEE` → bleu foncé, `RAPPORT_TERMINE` → vert, `PAIEMENT_EFFECTUE` → vert foncé).
- Lien cliquable vers `/client/etude/:id`.
- Mettre en évidence les études nécessitant une action du client (badge ou indicateur visuel).

**Dashboard BE (`/be/dashboard`) :**
- Ajouter un onglet **Mes études** (`GET /etude/bureauEtude/{bureauEtudeId}`) en complément des demandes disponibles.
- Badge d'état + lien vers `/be/etude/:id`.
- Mettre en évidence les études nécessitant une action du BE.
