# Onglet Paramètres — Guide d'intégration Frontend

> Document décrivant ce qui est à mettre en place côté React pour l'onglet **Paramètres** du Bureau d'Études, en commençant par la gestion des préférences de notification par département.

---

## 🎯 Objectif

Permettre à chaque Bureau d'Études de choisir pour quels **départements français** il souhaite être notifié (in-app + email) lors de la création d'une nouvelle demande de devis.

L'onglet paramètres est conçu pour être **extensible** : les préférences de notification sont la première brique. Mot de passe, email de contact, informations générales du BE pourront y être ajoutés progressivement.

---

## 🔌 API disponibles

### 1. Préférences de notification

| Méthode | Endpoint | Rôle requis | Description |
|---|---|---|---|
| `GET` | `/parametres/me/notifications` | `BUREAU_ETUDE` | Récupère les préférences de l'utilisateur connecté |
| `PUT` | `/parametres/me/notifications` | `BUREAU_ETUDE` | Met à jour les préférences |

#### Réponse `GET` et retour `PUT`

```json
{
  "notifierTousDepartements": false,
  "departementsSuivis": ["75", "92", "93", "94"]
}
```

| Champ | Type | Description |
|---|---|---|
| `notifierTousDepartements` | `boolean` | `true` = reçoit toutes les demandes sans filtre (mode par défaut) |
| `departementsSuivis` | `string[]` | Codes des départements souscrits — pertinent uniquement si `notifierTousDepartements = false` |

#### Corps du `PUT`

```json
{
  "notifierTousDepartements": false,
  "departementsSuivis": ["75", "92", "971"]
}
```

> ⚠️ `notifierTousDepartements` est **obligatoire** (`@NotNull`) — une requête sans ce champ retournera `400`.

---

### 2. Référentiel des départements

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/referentiel/departements` | Non requise | Liste des 101 départements français |

#### Réponse

```json
[
  { "code": "01", "libelle": "Ain" },
  { "code": "75", "libelle": "Paris" },
  { "code": "2A", "libelle": "Corse-du-Sud" },
  { "code": "971", "libelle": "Guadeloupe" },
  ...
]
```

À appeler **une seule fois** au chargement de la page (données statiques, pas de BDD) et mettre en cache côté front (ex. React Query avec `staleTime: Infinity`).

---

## 🗂️ Routes front à créer

| Route | Rôle | Description |
|---|---|---|
| `/be/parametres` | `BUREAU_ETUDE` | Page principale de l'onglet paramètres |

La page peut être organisée en **sous-onglets** ou **sections** :

```
/be/parametres
  ├── Section "Notifications"      ← à implémenter maintenant
  ├── Section "Mon profil"         ← à venir (PUT /bureauEtude)
  └── Section "Sécurité"           ← à venir (mot de passe)
```

---

## 🖥️ Composants à créer

### Page `ParametresPage`

Composant racine pour `/be/parametres`. Contient la navigation entre sections et charge les données initiales.

```
<ParametresPage>
  ├── <SectionNotifications />     ← priorité 1
  ├── <SectionProfil />            ← future
  └── <SectionSecurite />          ← future
```

---

### Composant `SectionNotifications`

**Chargement initial :**
1. `GET /referentiel/departements` → alimenter la liste de sélection
2. `GET /parametres/me/notifications` → pré-sélectionner les préférences actuelles

**UI à afficher :**

```
┌──────────────────────────────────────────────────────────┐
│  🔔 Préférences de notification                          │
│                                                          │
│  ○ Recevoir toutes les nouvelles demandes de devis       │
│    (sans filtre géographique)                            │
│                                                          │
│  ● Recevoir uniquement les demandes dans mes             │
│    départements sélectionnés                             │
│                                                          │
│  [  MultiSelect des départements  ▼ ]                    │
│  ┌─────────────────────────────────┐                     │
│  │  ✓ Paris (75)                   │                     │
│  │  ✓ Hauts-de-Seine (92)          │                     │
│  │  ✓ Guadeloupe (971)             │                     │
│  └─────────────────────────────────┘                     │
│                                                          │
│                          [ Enregistrer ]                 │
└──────────────────────────────────────────────────────────┘
```

**Comportement :**
- Le **MultiSelect** est désactivé (`disabled`) si `notifierTousDepartements = true`
- Il se réactive automatiquement quand l'utilisateur bascule sur "sélectionner des départements"
- Afficher un **toast de succès** après l'enregistrement
- Afficher un **message d'erreur** en cas de `400`/`404`

**Appel à la sauvegarde :**
```
PUT /parametres/me/notifications
← {
    "notifierTousDepartements": false,
    "departementsSuivis": ["75", "92", "971"]
  }
```

---

## 🔄 Flux de données complet

```
Ouverture de /be/parametres
  │
  ├─► GET /referentiel/departements
  │     → stocker en cache (staleTime: Infinity)
  │
  └─► GET /parametres/me/notifications
        → initialiser le formulaire
              notifierTousDepartements = true/false
              departementsSuivis = ["75", ...]

Modification par l'utilisateur
  │
  └─► PUT /parametres/me/notifications
        ← { notifierTousDepartements, departementsSuivis }
        → Toast "Préférences enregistrées ✓"
        → Mise à jour du state local avec la réponse
```

---

## 📦 Suggestions de bibliothèques

| Besoin | Suggestion |
|---|---|
| MultiSelect de départements | `react-select` (composant `Select` avec `isMulti`) ou équivalent UI kit projet |
| Gestion des appels API | React Query (`useQuery` + `useMutation`) |
| Toast de feedback | `react-hot-toast` ou équivalent UI kit projet |

---

## ✅ Checklist d'implémentation

- [ ] Créer la route `/be/parametres` (protégée par le rôle `BUREAU_ETUDE`)
- [ ] Ajouter le lien vers `/be/parametres` dans la navbar/menu latéral du BE
- [ ] Créer le composant `ParametresPage`
- [ ] Créer le composant `SectionNotifications` avec :
  - [ ] Appel `GET /referentiel/departements` (mis en cache)
  - [ ] Appel `GET /parametres/me/notifications` au montage
  - [ ] Radio/toggle "Tous les départements" / "Sélection manuelle"
  - [ ] MultiSelect des départements (désactivé si "tous")
  - [ ] Appel `PUT /parametres/me/notifications` à la soumission
  - [ ] Feedback toast de succès/erreur

---

## ⚠️ Points d'attention

- **Codes Corse** : les codes `2A` et `2B` sont des chaînes (pas des entiers) — vérifier que le composant Select les gère correctement comme `value`.
- **DOM-TOM** : les codes sont sur 3 chiffres (`"971"`, `"972"`…), les codes métropole sur 2 (`"01"`, `"75"`…). Le tri alphabétique peut sembler étrange — envisager un tri par libellé ou par code numérique.
- **Rétro-compatibilité** : un BE qui vient de s'inscrire a `notifierTousDepartements: true` et `departementsSuivis: []` → l'UI doit donc afficher "Tous les départements" par défaut.
- **Validation côté front** : si `notifierTousDepartements = false` et `departementsSuivis` est vide, afficher un avertissement avant d'enregistrer ("Aucun département sélectionné — vous ne recevrez aucune notification").

