# Sécurité — Vérification d'appartenance des ressources

> Document technique décrivant le mécanisme mis en place pour garantir qu'un utilisateur
> authentifié ne peut agir que sur ses propres ressources.

---

## Table des matières

1. [Contexte et problème initial](#1-contexte-et-problème-initial)
2. [Ce qui a été mis en place](#2-ce-qui-a-été-mis-en-place)
3. [Comment ça fonctionne — flux complet](#3-comment-ça-fonctionne--flux-complet)
4. [Évaluation honnête vis-à-vis des bonnes pratiques](#4-évaluation-honnête-vis-à-vis-des-bonnes-pratiques)
5. [Limites actuelles et pistes d'amélioration](#5-limites-actuelles-et-pistes-damélioration)
6. [Impacts côté front-end](#6-impacts-côté-front-end)

---

## 1. Contexte et problème initial

Avant la mise en place de cette sécurité, les endpoints de mutation de l'étude
ne vérifiaient que le **rôle** de l'utilisateur JWT :

```java
// Avant — seul le rôle est vérifié
@PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
public ResponseEntity<Void> marquerPaiementEffectue(@PathVariable Long id) { ... }
```

**Problème** : un CLIENT authentifié pouvait appeler `/etude/42/paiement-effectue`
sur une étude qui ne lui appartient pas, à condition de connaître l'ID (IDOR —
*Insecure Direct Object Reference*).

---

## 2. Ce qui a été mis en place

### Nouveaux fichiers

| Fichier | Layer | Rôle |
|---|---|---|
| `webapp/security/SecurityService.java` | application-layer | Composant Spring exposant les méthodes de vérification d'appartenance |
| `webapp/security/SecurityServiceTest.java` | application-layer | 9 cas de test unitaire |

### Fichiers modifiés

| Fichier | Layer | Modification |
|---|---|---|
| `port/EtudeRepository.java` | domain-layer | +2 méthodes `existsByIdAndClientUserId` / `existsByIdAndBureauEtudeUserId` |
| `database/dao/EtudeDAO.java` | infrastructure-layer | +2 requêtes dérivées Spring Data JPA |
| `database/adapter/EtudeRepositoryAdapter.java` | infrastructure-layer | Implémentation des 2 nouvelles méthodes |
| `resource/etude/EtudeController.java` | application-layer | `@PreAuthorize` renforcé sur tous les endpoints critiques |

### Endpoints protégés

#### Désormais réservés au CLIENT propriétaire de l'étude (ou ADMIN)

| Endpoint | Avant | Après |
|---|---|---|
| `PATCH /etude/{id}/valider-date` | `hasAnyRole('ADMIN', 'CLIENT')` | `ADMIN` ou `CLIENT` + appartenance |
| `PATCH /etude/{id}/refuser-date` | `hasAnyRole('ADMIN', 'CLIENT')` | `ADMIN` ou `CLIENT` + appartenance |
| `PATCH /etude/{id}/paiement-effectue` | `hasAnyRole('ADMIN', 'CLIENT')` | `ADMIN` ou `CLIENT` + appartenance |
| `POST /etude/{id}/devis-signe/upload` | `hasAnyRole('ADMIN', 'CLIENT')` | `ADMIN` ou `CLIENT` + appartenance |

#### Désormais réservés au BUREAU D'ÉTUDES responsable de l'étude (ou ADMIN)

| Endpoint | Avant | Après |
|---|---|---|
| `PATCH /etude/{id}/proposer-date` | `hasAnyRole('ADMIN', 'BUREAU_ETUDE')` | `ADMIN` ou `BE` + appartenance |
| `PATCH /etude/{id}/intervention-effectuee` | `hasAnyRole('ADMIN', 'BUREAU_ETUDE')` | `ADMIN` ou `BE` + appartenance |
| `PATCH /etude/{id}/date-rendu-prevue` | `hasAnyRole('ADMIN', 'BUREAU_ETUDE')` | `ADMIN` ou `BE` + appartenance |
| `PATCH /etude/{id}/rapport-termine` | `hasAnyRole('ADMIN', 'BUREAU_ETUDE')` | `ADMIN` ou `BE` + appartenance |
| `PATCH /etude/{id}/devis-signe` | `hasAnyRole('ADMIN', 'BUREAU_ETUDE')` | `ADMIN` ou `BE` + appartenance |

---

## 3. Comment ça fonctionne — flux complet

```
┌──────────────┐   JWT   ┌──────────────────────┐
│   Frontend   │ ──────► │ JwtAuthenticationFilter│
└──────────────┘         └──────────┬───────────┘
                                    │ extrait username (login)
                                    ▼
                         ┌──────────────────────┐
                         │ UserDetailsServiceImpl│ ─► UtilisateurRepository
                         └──────────┬───────────┘
                                    │ UserDetailsAdapter (contient userId)
                                    ▼
                         ┌───────────────────────────┐
                         │   SecurityContextHolder    │
                         │   Authentication {         │
                         │     principal:             │
                         │       UserDetailsAdapter   │
                         │         └─ userId: 42      │
                         │   }                        │
                         └──────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │     @PreAuthorize (SpEL)        │
                    │  "hasRole('ADMIN')              │
                    │   or (hasRole('CLIENT')         │
                    │   and @securityService          │
                    │      .etudeAppartientAu         │
                    │       ClientConnecte(#id))"     │
                    └───────────────┬────────────────┘
                                    │ appelle
                                    ▼
                    ┌───────────────────────────────────┐
                    │         SecurityService            │
                    │  1. lit userId du SecurityContext  │
                    │  2. appelle EtudeRepository        │
                    │     .existsByIdAndClientUserId()   │
                    └───────────────┬───────────────────┘
                                    │ requête EXISTS SQL
                                    ▼
                    ┌───────────────────────────────────┐
                    │            EtudeDAO               │
                    │  SELECT 1 FROM etude e            │
                    │  JOIN proposition_devis pd ...    │
                    │  JOIN demande_devis dd  ...       │
                    │  JOIN client c         ...        │
                    │  WHERE e.id = ?                   │
                    │    AND c.user_id = ?              │
                    └───────────────────────────────────┘
```

### Ce que renvoie Spring Security

| Situation | HTTP |
|---|---|
| Token absent ou expiré | `401 Unauthorized` |
| Token valide, mauvais rôle | `403 Forbidden` |
| Token valide, bon rôle, mauvaise appartenance | `403 Forbidden` |
| Token valide, bon rôle, bonne appartenance | `200 OK` (traitement métier) |
| Rôle ADMIN | `200 OK` (bypass appartenance) |

### Pourquoi EXISTS et pas un chargement ?

La vérification utilise `boolean exists...()` (Spring Data JPA), qui génère un
`SELECT COUNT(1)` ou `SELECT 1 ... LIMIT 1` selon le driver. **Aucun objet n'est
hydraté** — c'est une opération O(1) qui ne charge ni l'étude, ni le client, ni
la proposition.

---

## 4. Évaluation honnête vis-à-vis des bonnes pratiques

### ✅ Ce qui est bien aligné avec hexagonal / clean code

- **La couche domaine est totalement ignorante de la sécurité.**
  `EtudeServiceImpl` ne contient aucune vérification d'identité. Les règles
  métier (machine à états) restent pures.

- **Le `SecurityService` orchestre uniquement des ports du domaine.**
  Il dépend de `EtudeRepository` (port, pas DAO) — c'est la dépendance correcte.

- **La vérification est à la frontière applicative (input port).**
  `@PreAuthorize` sur le controller correspond exactement à l'endroit où
  l'architecture hexagonale place la validation des droits d'entrée.

- **Requêtes optimisées.**
  La loi de Demeter et le principe "ne charge que ce dont tu as besoin" sont
  respectés — un simple `EXISTS` SQL.

### ⚠️ Ce qui n'est pas parfaitement hexagonal

**Dépendance application-layer → infrastructure-layer sur `UserDetailsAdapter`.**

Le `SecurityService` (application-layer) appelle :
```java
if (auth.getPrincipal() instanceof UserDetailsAdapter adapter) { ... }
```
Or `UserDetailsAdapter` est dans `infrastructure-layer`. En architecture hexagonale
stricte, l'application-layer ne devrait pas connaître les détails d'implémentation
de l'infrastructure.

**La solution "pure"** serait d'introduire un port dans le domaine :

```java
// domain-layer — port
public interface IdentitePort {
    Optional<Long> getCurrentUserId();
}

// infrastructure-layer — adapter
@Component
public class SpringSecurityIdentiteAdapter implements IdentitePort {
    @Override
    public Optional<Long> getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsAdapter a) {
            return Optional.of(a.getUtilisateurBO().getId());
        }
        return Optional.empty();
    }
}

// application-layer — SecurityService ne connaît que le port
@Component("securityService")
public class SecurityService {
    private final IdentitePort identitePort;
    private final EtudeRepository etudeRepository;
    // ...
}
```

Ce pattern est plus pur mais aussi plus verbeux. Pour ce projet, la transgression
est **connue, localisée et documentée** — c'est acceptable.

### ⚠️ Verbosité des expressions SpEL

Les annotations `@PreAuthorize` sont répétitives :
```java
@PreAuthorize("hasRole('ADMIN') or (hasRole('CLIENT') and @securityService.etudeAppartientAuClientConnecte(#id))")
```

Une solution plus propre serait des **méta-annotations** :
```java
// À créer si le projet grandit
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole('ADMIN') or (hasRole('CLIENT') and @securityService.etudeAppartientAuClientConnecte(#id))")
public @interface RequiertClientProprietaire {}
```

**Au global : l'approche est pragmatique, efficace et courante dans les projets
Spring Boot professionnels. Elle n'est pas parfaitement "hexagonale pure" mais
le compromis est justifié.**

---

## 5. Limites actuelles et pistes d'amélioration

| Limite | Impact | Solution envisageable |
|---|---|---|
| `SecurityService` dépend de `UserDetailsAdapter` (infra) | Couplage léger application→infra | Introduire `IdentitePort` dans le domaine |
| SpEL verbeux dans `@PreAuthorize` | Lisibilité, risque de copier-coller | Créer des méta-annotations (`@RequiertClientProprietaire`) |
| Endpoints de lecture non protégés | Un CLIENT peut lire les études des autres via `/etude/{id}` | Ajouter la vérification sur GET si nécessaire |
| Pas de vérification sur `GET /etude/client/{id}` | Un CLIENT peut demander les études d'un autre client par son ID | Comparer `id` avec l'ID du client connecté |

---

## 6. Impacts côté front-end

### Nouveau comportement attendu des réponses

Avant : un appel non autorisé pouvait renvoyer `200` (si rôle correct mais
mauvaise appartenance). Après : il reçoit désormais **`403 Forbidden`** avec le
corps :

```json
{
  "typeError": "ACCESS_DENIED",
  "message": "Accès refusé : droits insuffisants"
}
```

### Modifications nécessaires côté front

#### 1. Gestion globale du `403`

Si ce n'est pas déjà fait, ajouter un intercepteur HTTP global pour traiter les
`403` différemment des `401` :

```typescript
// Exemple avec Axios
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré → redirection vers /login
      router.push('/login');
    } else if (error.response?.status === 403) {
      // Droits insuffisants OU appartenance invalide
      // Ne pas rediriger vers /login — l'utilisateur est bien authentifié
      toast.error("Accès refusé : vous n'êtes pas autorisé à effectuer cette action.");
    }
    return Promise.reject(error);
  }
);
```

> **Important :** `401` et `403` ont des sémantiques distinctes.
> - `401` → l'utilisateur n'est **pas identifié** (token absent/expiré) → `/login`
> - `403` → l'utilisateur est identifié mais **n'a pas le droit** → message d'erreur, pas de déconnexion

#### 2. Suppression des appels cross-client

Si le front récupère les IDs d'étude via une liste (ex. `/etude` ou
`/etude/client/{id}`) puis appelle des mutations, il doit **s'assurer qu'il
n'envoie que des actions sur ses propres études**. Le back renverra `403` dans
le cas contraire — il ne faut pas que cela dégrade silencieusement l'expérience.

#### 3. Aucun changement de contrat d'API

Les **signatures des endpoints ne changent pas** : mêmes URLs, mêmes corps de
requête, mêmes réponses `200` en cas de succès. Seul le comportement en cas
d'accès non autorisé change (`200` → `403`).

#### 4. Tableau récapitulatif par endpoint

| Endpoint | Qui peut appeler ? | Ancienne erreur si non-propriétaire | Nouvelle erreur |
|---|---|---|---|
| `PATCH /etude/{id}/valider-date` | CLIENT propriétaire ou ADMIN | `200` (bug) | `403` |
| `PATCH /etude/{id}/refuser-date` | CLIENT propriétaire ou ADMIN | `200` (bug) | `403` |
| `PATCH /etude/{id}/paiement-effectue` | CLIENT propriétaire ou ADMIN | `200` (bug) | `403` |
| `POST /etude/{id}/devis-signe/upload` | CLIENT propriétaire ou ADMIN | `200` (bug) | `403` |
| `PATCH /etude/{id}/proposer-date` | BE responsable ou ADMIN | `200` (bug) | `403` |
| `PATCH /etude/{id}/intervention-effectuee` | BE responsable ou ADMIN | `200` (bug) | `403` |
| `PATCH /etude/{id}/date-rendu-prevue` | BE responsable ou ADMIN | `200` (bug) | `403` |
| `PATCH /etude/{id}/rapport-termine` | BE responsable ou ADMIN | `200` (bug) | `403` |
| `PATCH /etude/{id}/devis-signe` | BE responsable ou ADMIN | `200` (bug) | `403` |

---

*Document généré le 21/05/2026 — à mettre à jour si le modèle de données évolue.*

