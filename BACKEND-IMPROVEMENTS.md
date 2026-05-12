# 🔧 Améliorations backend requises — GeoConnect API

> Document de suivi destiné aux équipes backend et frontend.  
> Il liste les endpoints manquants/à sécuriser identifiés lors de l'audit du frontend.

---

## Contexte

Le frontend utilisait un **workaround** pour récupérer le profil de l'utilisateur connecté :

```typescript
// Ancien code (supprimé)
const clients = await GET /client           // chargeait TOUS les clients de la base
const myClient = clients.find(c => c.utilisateurId === user.userId)
```

Ce pattern existait dans 5 endroits du frontend et posait trois problèmes :
- 🐌 **Performance** : toute la table `client` transitait sur le réseau
- 🔓 **Sécurité** : un client recevait les données personnelles de tous les autres
- 📦 **Scalabilité** : intenable avec 500+ clients en base

---

## Récapitulatif — État d'avancement

| # | Action | Statut | Notes |
|---|--------|--------|-------|
| 1 | Créer `GET /client/me` | ✅ Déployé | Swagger v2 confirmé |
| 2 | Créer `GET /bureauEtude/me` | ✅ Déployé | Swagger v2 confirmé |
| 3 | Mettre à jour le front | ✅ Fait | `src/api/client.ts` et `src/api/bureauEtude.ts` mis à jour |
| 4 | Restreindre `GET /client` à `ADMIN` | 🔴 À faire | Fuite de données active tant que non appliqué |
| 5 | Restreindre `GET /bureauEtude` à `ADMIN` | 🔴 À faire | Fuite de données active tant que non appliqué |
| 6 | `POST /client` retourne l'`id` | 🟡 À vérifier | Évite un appel API redondant à l'inscription |

---

## ✅ 1. `GET /client/me` — Déployé

Retourne le `ClientDTO` de l'utilisateur connecté en lisant son identité depuis le JWT.

```http
GET /client/me
Authorization: Bearer <jwt>
→ 200 ClientDTO
→ 401 JWT invalide
→ 403 Rôle non CLIENT
→ 404 Aucun profil lié à cet utilisateur
```

**Impact front :** `src/api/client.ts` — `getClientByUserId()` appelle désormais directement `/client/me`.  
Tous les composants consommateurs en bénéficient sans autre modification.

---

## ✅ 2. `GET /bureauEtude/me` — Déployé

Retourne le `BureauEtudesDTO` de l'utilisateur connecté avec le rôle `BUREAU_ETUDE`.

```http
GET /bureauEtude/me
Authorization: Bearer <jwt>
→ 200 BureauEtudesDTO
→ 401 JWT invalide
→ 403 Rôle non BUREAU_ETUDE
→ 404 Aucun bureau lié à cet utilisateur
```

**Impact front :** `src/api/bureauEtude.ts` — `getBureauByUserId()` appelle désormais directement `/bureauEtude/me`.

---

## 🔴 4. Sécuriser `GET /client` — À faire

### Problème
`GET /client` retourne toujours la liste complète de tous les clients, accessible à tous les rôles authentifiés.
Depuis le déploiement de `/client/me`, le frontend ne l'appelle **plus jamais** pour les rôles `CLIENT` ou `BUREAU_ETUDE`.
Il est donc safe de le restreindre maintenant.

### Action à réaliser (Spring Boot)
```java
@GetMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<ClientDTO>> getAllClients() { ... }
```

> ⚠️ S'assurer que la version du front utilisant `/client/me` est bien en production **avant** d'appliquer cette restriction.

---

## 🔴 5. Sécuriser `GET /bureauEtude` — À faire

### Problème
Même situation : `GET /bureauEtude` expose la liste complète des bureaux (raison sociale, email, téléphone, adresse)
à tous les rôles. Le front n'en a plus besoin depuis `/bureauEtude/me`.

### Action à réaliser (Spring Boot)
```java
@GetMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<BureauEtudesDTO>> getAllBureauEtude() { ... }
```

---

## 🟡 6. `POST /client` — Garantir le retour de l'`id`

### Problème
`POST /client` ne retourne pas systématiquement l'`id` du client créé.  
Le frontend (`Home.tsx`) fait un second appel API en fallback pour le récupérer :

```typescript
let client = await createClient({ ... });
if (!client?.id) {
  const myClient = await getClientByUserId(authRes.userId); // appel supplémentaire
  clientId = myClient?.id;
}
```

### Action à réaliser
S'assurer que `POST /client` retourne systématiquement le `ClientDTO` complet en `201 Created` :

```java
@PostMapping
public ResponseEntity<ClientDTO> createClient(@RequestBody ClientDTO dto) {
    ClientDTO created = clientService.create(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created); // id toujours présent
}
```

Une fois corrigé, le fallback dans `Home.tsx` disparaît automatiquement.

---

## Procédure de migration frontend (pour référence — déjà appliquée)

Les deux seuls fichiers qui ont été modifiés côté front suite au déploiement des endpoints `/me` :

**`src/api/client.ts`**
```typescript
export const getClientByUserId = async (_userId: number): Promise<ClientDTO | null> => {
  const { data } = await api.get('/client/me');
  return data ?? null;
};
```

**`src/api/bureauEtude.ts`**
```typescript
export const getBureauByUserId = async (_userId: number): Promise<BureauEtudesDTO | null> => {
  const { data } = await api.get('/bureauEtude/me');
  return data ?? null;
};
```

