# Visualiseur PDF — authentification par cookie HttpOnly

## ✅ État actuel — migration vers cookies HttpOnly terminée côté backend

### Ce qui a été fait côté backend

#### 1. `AuthController` — cookie posé au login, register et logout

Au login et au register, le backend pose un cookie `jwt` HttpOnly et retourne
les infos utilisateur **sans token** dans le body.

```
POST /api/auth/login    → 200 { userId, login, role } + Set-Cookie: jwt=<token>; HttpOnly; SameSite=Strict
POST /api/auth/register → 200 { userId, login, role } + Set-Cookie: jwt=<token>; HttpOnly; SameSite=Strict
POST /api/auth/logout   → 204 + Set-Cookie: jwt=; Max-Age=0 (suppression du cookie)
```

Le cookie est configuré avec :

| Attribut | Dev | Prod (Docker) |
|---|---|---|
| `HttpOnly` | `true` | `true` |
| `Secure` | `false` | `true` |
| `SameSite` | `Strict` | `Strict` |
| `Path` | `/` | `/` |
| `MaxAge` | 24h | 24h |

La propriété `cookie.secure` est pilotée par profil Spring :
- `application.yaml` → `cookie.secure: false` (HTTP local)
- `application-docker.yaml` → `cookie.secure: true` (HTTPS production)

#### 2. `JwtAuthenticationFilter` — lecture dual-source

Le filtre extrait le JWT depuis deux sources, dans l'ordre de priorité :

1. **Header `Authorization: Bearer <token>`** — appels axios (pendant la transition)
2. **Cookie HttpOnly `jwt`** — `window.open`, navigation directe

Le header prend toujours la priorité. Les cookies autres que `jwt` sont ignorés.

#### 3. `SecurityConfig` — CSRF réactivé + CORS resserré

La protection CSRF est réactivée via le pattern **Double Submit Cookie** (recommandé OWASP pour les SPA) :
- Spring pose un cookie `XSRF-TOKEN` (lisible en JS, non HttpOnly)
- Le front doit renvoyer sa valeur dans le header `X-XSRF-TOKEN`
- Un site tiers ne peut pas lire ce cookie → protection CSRF garantie

Les endpoints `/api/auth/**` sont exclus de la vérification CSRF (le cookie n'existe pas encore au login).

Les headers CORS autorisés sont désormais explicites : `Authorization`, `Content-Type`, `X-XSRF-TOKEN`.

#### 4. `DocumentController` — endpoint download avec nom dans l'URL

```
GET /documents/{id}/download               → attachment (téléchargement)
GET /documents/{id}/download/{nomFichier}  → inline (visualiseur PDF Chrome)
```

Le paramètre `nomFichier` est validé (`@Pattern`, `@Size`) — les path traversal (`../`) retournent 400.
Le cookie HttpOnly est envoyé automatiquement par le navigateur → `window.open` fonctionne nativement, sans trick.

---

## 🎯 Ce qu'il reste à faire côté frontend

### 1. `src/api/index.ts` — activer `withCredentials`, supprimer le header Bearer

```ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true, // envoie le cookie jwt + XSRF-TOKEN automatiquement
});

// Supprimer l'interceptor qui posait Authorization: Bearer
// Axios lit XSRF-TOKEN et envoie X-XSRF-TOKEN nativement (comportement par défaut)
```

### 2. `src/contexts/AuthContext.tsx` — ne plus stocker le token

```ts
// AVANT
const { token, userId, login, role } = await authApi.login(credentials);
localStorage.setItem('token', token);

// APRÈS — token absent de la réponse, cookie posé par le backend
const { userId, login, role } = await authApi.login(credentials);
setUser({ userId, login, role }); // stocker uniquement les infos d'affichage
```

> Au rechargement de page, le token HttpOnly n'est pas lisible en JS.
> Deux options : ajouter un endpoint `GET /api/auth/me` qui retourne les infos
> utilisateur à partir du cookie, ou persister `{ userId, login, role }` en `sessionStorage`.

### 3. `src/api/document.ts` — `openDocument` devient trivial

```ts
// AVANT — trick cookie temporaire + proxy
export const openDocument = (documentId: number, nomTelechargement?: string): void => {
  const token = localStorage.getItem('token');
  document.cookie = `pdf_token=${token}; max-age=30; path=/api; SameSite=Strict`;
  const fileName = encodeURIComponent(nomTelechargement ?? `document-${documentId}.pdf`);
  window.open(`/api/documents/${documentId}/download/${fileName}`, '_blank');
};

// APRÈS — le cookie jwt est envoyé automatiquement par le navigateur
export const openDocument = (documentId: number, nomTelechargement?: string): void => {
  const fileName = encodeURIComponent(nomTelechargement ?? `document-${documentId}.pdf`);
  window.open(`/api/documents/${documentId}/download/${fileName}`, '_blank');
};
```

### 4. `vite.config.ts` — supprimer le hook `configure`

```ts
'/api': {
  target: env.VITE_API_URL || 'http://localhost:8080',
  changeOrigin: true,
  // Le préfixe /api est désormais conservé (context-path backend)
  // rewrite: (path) => path.replace(/^\/api/, ''),
  // Supprimer entièrement le bloc configure: (req) => { ... }
  // qui lisait pdf_token et injectait Authorization: Bearer
},
```

### 5. Config nginx en production

```nginx
# Auth : le backend expose /api/auth/*, conserver le préfixe
location /api/auth/ {
    proxy_pass http://localhost:8080/api/auth/;
    proxy_set_header Cookie $http_cookie;
}

# Tout le reste : le backend expose désormais aussi sous /api
location /api/ {
    proxy_pass http://localhost:8080/api/;
    proxy_set_header Cookie $http_cookie;
}
```

---

## Tableau récapitulatif — couverture sécurité

| Vecteur d'attaque | Protection en place |
|---|---|
| XSS → vol de token | Cookie `HttpOnly` — le JS ne peut pas lire le JWT |
| CSRF | `SameSite=Strict` + Double Submit Cookie `XSRF-TOKEN` |
| Écoute réseau | Cookie `Secure` en production (HTTPS uniquement) |
| Token exposé dans les logs/réponses | Token absent du body de réponse |
| Élévation de privilèges | `@PreAuthorize` par rôle sur chaque endpoint |
| Origine non autorisée | CORS avec origines et headers explicites |
| Path traversal sur download | `@Pattern` + `@Size` sur `nomFichier` → 400 |
