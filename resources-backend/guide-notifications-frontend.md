# Guide — Intégration du système de notifications in-app (Front-end)

## Vue d'ensemble

Le back-end expose 4 endpoints REST pour le système de notifications in-app.  
Le modèle d'intégration retenu est le **polling** : le front interroge périodiquement le serveur pour récupérer les nouvelles informations.

---

## Endpoints disponibles

Tous les endpoints nécessitent un cookie JWT valide (utilisateur connecté).  
Base URL : `GET /api/...`

| Méthode | URL | Rôle |
|---|---|---|
| `GET` | `/api/notifications` | Récupère toutes les notifs de l'utilisateur connecté |
| `GET` | `/api/notifications/non-lues/count` | Nombre de notifs non lues (badge) |
| `PATCH` | `/api/notifications/{id}/lire` | Marque une notif comme lue |
| `PATCH` | `/api/notifications/lire-tout` | Marque toutes les notifs comme lues |

---

## Schéma de la réponse `NotificationDTO`

```json
{
  "id": 42,
  "type": "NOUVELLE_PROPOSITION_DEVIS",
  "message": "Nouvelle proposition de devis reçue de la part de GeoTest SARL.",
  "lienAction": "/demandes/7",
  "lue": false,
  "createdAt": "2026-05-20T14:32:00"
}
```

### Types de notifications par rôle

| Type | Destinataire | Contexte |
|---|---|---|
| `NOUVELLE_DEMANDE_DEVIS` | `BUREAU_ETUDE` | Nouvelle demande disponible (broadcast) |
| `PROPOSITION_ACCEPTEE` | `BUREAU_ETUDE` | Le client a accepté leur proposition |
| `DATE_INTERVENTION_VALIDEE` | `BUREAU_ETUDE` | Le client a confirmé la date |
| `DATE_INTERVENTION_REFUSEE` | `BUREAU_ETUDE` | Le client a refusé la date — nouvelle proposition requise |
| `PAIEMENT_CONFIRME` | `BUREAU_ETUDE` | Le paiement a été confirmé — étude clôturée |
| `NOUVELLE_PROPOSITION_DEVIS` | `CLIENT` | Un BE a soumis une proposition sur leur demande |
| `DATE_INTERVENTION_PROPOSEE` | `CLIENT` | Un BE a proposé une date d'intervention |
| `RAPPORT_DISPONIBLE` | `CLIENT` | Le rapport est prêt — paiement attendu |

---

## Stratégie d'intégration recommandée

### 1. Badge de notifications (polling rapide)

Appeler `GET /api/notifications/non-lues/count` toutes les **30 secondes**.  
Afficher le compteur en badge sur l'icône de cloche.

```typescript
// Exemple React avec un hook personnalisé
const useNotificationBadge = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const res = await fetch('/api/notifications/non-lues/count', {
        credentials: 'include', // indispensable pour envoyer le cookie JWT
      });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    };

    fetchCount(); // appel immédiat au montage
    const interval = setInterval(fetchCount, 30_000); // puis toutes les 30s
    return () => clearInterval(interval); // nettoyage au démontage
  }, []);

  return count;
};
```

**Important** : arrêter le polling quand l'utilisateur n'est pas connecté ou quand le composant est démonté.

---

### 2. Panneau de notifications (chargement à la demande)

Appeler `GET /api/notifications` **au clic** sur l'icône de cloche, pas en continu.

```typescript
const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await fetch('/api/notifications', { credentials: 'include' });
  if (!res.ok) throw new Error('Erreur lors du chargement des notifications');
  return res.json();
};
```

---

### 3. Marquage comme lu

**Au clic** sur une notification individuelle, appeler `PATCH /api/notifications/{id}/lire`.  
Au clic sur "Tout marquer comme lu", appeler `PATCH /api/notifications/lire-tout`.

Mettre à jour le state local **optimistement** (avant la réponse serveur) puis rafraîchir le badge.

```typescript
const marquerCommeLue = async (id: number) => {
  // Mise à jour optimiste du state local
  setNotifications(prev =>
    prev.map(n => n.id === id ? { ...n, lue: true } : n)
  );
  // Appel serveur
  await fetch(`/api/notifications/${id}/lire`, {
    method: 'PATCH',
    credentials: 'include',
  });
  // Rafraîchir le badge
  refreshBadgeCount();
};
```

---

### 4. Navigation via `lienAction`

Chaque notification contient un champ `lienAction` (ex: `/etudes/42`, `/demandes/7`).  
Au clic, marquer la notification comme lue ET naviguer vers ce lien :

```typescript
const handleNotificationClick = async (notif: Notification) => {
  if (!notif.lue) {
    await marquerCommeLue(notif.id);
  }
  if (notif.lienAction) {
    navigate(notif.lienAction); // react-router-dom
  }
};
```

---

## Structure de composant suggérée

```
<NotificationBell>           ← badge + icône, polling du count
  <NotificationPanel>        ← liste, chargée au clic
    <NotificationItem />     ← item individuel, gère le clic + navigation
    <MarkAllReadButton />    ← "Tout marquer comme lu"
  </NotificationPanel>
</NotificationBell>
```

---

## Points d'attention

### Fréquence de polling
- **30 secondes** pour le badge est un bon compromis : réactif sans surcharger le serveur.
- Pour un usage intensif (> 100 utilisateurs simultanés), envisager de passer en **SSE** (Server-Sent Events) côté back. L'architecture hexagonale actuelle le permettrait sans modifier le domaine.

### Gestion de l'authentification
- Toutes les requêtes doivent inclure `credentials: 'include'` (cookie `jwt` HttpOnly).
- En cas de `401`, arrêter le polling et rediriger vers la page de connexion.

### Arrêt du polling
- Stopper le `setInterval` au logout et sur les pages non authentifiées.
- Utiliser un état global (Zustand, Redux, ou Context) pour partager le `count` entre composants.

### Pagination (évolution future)
- L'endpoint `GET /api/notifications` retourne **toutes** les notifications.
- Pour les utilisateurs très actifs (BE recevant beaucoup de demandes), ajouter un paramètre `?page=0&size=20` côté back est simple à mettre en place si nécessaire.

