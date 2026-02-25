# Migration vers Architecture MVP Multi-Familles

## 📋 Résumé des Changements

Cette migration transforme l'application Angular de gestion financière simple en une application **multi-familles** complète avec authentification JWT, gestion des rôles et invitations.

## ✅ Fonctionnalités Implémentées

### 1. **Core Architecture**
- ✅ Models TypeScript complets (User, Family, FamilyMember, Invitation, etc.)
- ✅ Services avec gestion d'erreurs et observables RxJS
- ✅ Guards (AuthGuard, RoleGuard) pour sécuriser les routes
- ✅ Interceptors HTTP (Auth + Error handling)
- ✅ StorageService pour gérer les tokens JWT

### 2. **Authentification**
- ✅ Page de connexion (`/auth/login`)
- ✅ Page d'inscription (`/auth/register`)
- ✅ Page de profil utilisateur (`/profile`)
- ✅ Gestion JWT automatique via interceptor
- ✅ Déconnexion et redirection

### 3. **Gestion des Familles**
- ✅ Liste des familles (`/families`)
- ✅ Création de famille (`/families/create`)
- ✅ Détails d'une famille avec membres (`/families/:id`)
- ✅ Sélecteur de famille global (FamilySelectorComponent)
- ✅ Gestion des membres (changer rôle, retirer)
- ✅ Quitter/Supprimer une famille

### 4. **Système d'Invitations**
- ✅ Liste des invitations reçues/envoyées (`/invitations`)
- ✅ Formulaire d'envoi d'invitation (`/invitations/send`)
- ✅ Accepter/Refuser une invitation
- ✅ Annuler une invitation envoyée
- ✅ États: PENDING, ACCEPTED, DECLINED, EXPIRED, CANCELLED

### 5. **Permissions par Rôle**
- ✅ **ADMIN**: Tous les droits (gérer famille, membres, budgets, catégories)
- ✅ **PARENT**: Gérer budgets, catégories, inviter des membres
- ✅ **MEMBER**: Voir transactions, créer transactions pour soi

### 6. **Composants Partagés**
- ✅ FamilySelectorComponent: Sélection famille active
- ✅ MemberAvatarComponent: Avatar coloré avec initiales
- ✅ RoleBadgeComponent: Badge de rôle stylisé

## 📁 Nouvelle Structure

```
src/app/
├── core/
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── family.model.ts
│   │   ├── family-member.model.ts
│   │   ├── invitation.model.ts
│   │   ├── category.model.ts
│   │   ├── transaction.model.ts
│   │   ├── budget.model.ts
│   │   ├── statistics.model.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── storage.service.ts
│   │   ├── auth.service.ts
│   │   ├── family.service.ts
│   │   ├── invitation.service.ts
│   │   ├── category.service.ts
│   │   ├── transaction.service.ts
│   │   ├── budget.service.ts
│   │   ├── statistics.service.ts
│   │   └── index.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── role.guard.ts
│   │   └── index.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   ├── error.interceptor.ts
│   │   └── index.ts
│   └── index.ts
├── shared/
│   └── components/
│       ├── family-selector/
│       ├── member-avatar/
│       └── role-badge/
├── features/
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── profile/
│   ├── families/
│   │   ├── family-list/
│   │   ├── family-create/
│   │   └── family-detail/
│   └── invitations/
│       ├── invitation-list/
│       └── invitation-send/
└── components/ (existants - à adapter)
    ├── dashboard/
    ├── transactions/
    ├── budget/
    └── categories/
```

## 🔧 Configuration

### app.config.ts
```typescript
- Ajout des interceptors: authInterceptor, errorInterceptor
- Import FormsModule et ReactiveFormsModule
```

### app.routes.ts
```typescript
- Routes publiques: /auth/login, /auth/register
- Routes protégées avec authGuard
- Routes avec roleGuard (ADMIN, PARENT)
- Nouvelle hiérarchie: /families, /invitations, /dashboard, etc.
```

### app.component
```typescript
- Ajout FamilySelectorComponent
- Bouton profil et déconnexion
- Navigation conditionnelle (masquée sur /auth)
- Détection de l'authentification
```

## ⚠️ Adaptations Nécessaires (Composants Existants)

### transactions.component.ts
**DOIT être adapté pour:**
- Récupérer `familyId` depuis `FamilyService.selectedFamily$`
- Ajouter sélection du membre concerné (`familyMemberId`)
- Appeler `TransactionService.getTransactions(familyId, filters)`
- Afficher avatar du membre dans la liste

### budget.component.ts
**DOIT être adapté pour:**
- Récupérer `familyId` depuis `FamilyService.selectedFamily$`
- Appeler `BudgetService.getBudgets(familyId)`
- Vérifier permissions (PARENT ou ADMIN uniquement)

### categories.component.ts
**DOIT être adapté pour:**
- Récupérer `familyId` depuis `FamilyService.selectedFamily$`
- Appeler `CategoryService.getCategories(familyId)`
- Vérifier permissions (PARENT ou ADMIN uniquement)

### dashboard.component.ts
**DOIT être adapté pour:**
- Récupérer `familyId` depuis `FamilyService.selectedFamily$`
- Appeler `StatisticsService.getStatistics(familyId, startDate, endDate)`
- Afficher stats par membre avec `MemberAvatarComponent`
- Afficher rôle de l'utilisateur avec `RoleBadgeComponent`

## 🔐 Points de Sécurité

1. **JWT Tokens**: Stockés dans localStorage via `StorageService`
2. **AuthInterceptor**: Ajoute automatiquement `Authorization: Bearer <token>`
3. **ErrorInterceptor**: Gère les erreurs 401 (déconnexion auto), 403 (permissions), etc.
4. **AuthGuard**: Protège toutes les routes sauf `/auth/*`
5. **RoleGuard**: Vérifie le rôle minimum requis (`hasMinRole()`)

## 🎨 Composants Standalone Angular 17

Tous les nouveaux composants utilisent:
- `standalone: true`
- Imports directs: `CommonModule`, `ReactiveFormsModule`, `RouterLink`
- Styles inline ou fichiers séparés
- Template inline pour les petits composants

## 📡 API Backend Attendue

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur courant
- `PUT /api/auth/profile` - Mise à jour profil
- `POST /api/auth/change-password` - Changement mot de passe
- `POST /api/auth/refresh` - Rafraîchir token

### Familles
- `GET /api/families` - Mes familles
- `GET /api/families/:id` - Détails famille
- `POST /api/families` - Créer famille
- `PUT /api/families/:id` - Modifier famille
- `DELETE /api/families/:id` - Supprimer famille
- `GET /api/families/:id/members` - Membres de la famille
- `DELETE /api/families/:id/members/:memberId` - Retirer membre
- `PATCH /api/families/:id/members/:memberId/role` - Changer rôle
- `POST /api/families/:id/leave` - Quitter famille

### Invitations
- `POST /api/invitations` - Envoyer invitation
- `GET /api/invitations` - Mes invitations reçues
- `GET /api/invitations/sent` - Mes invitations envoyées
- `GET /api/invitations/token/:token` - Invitation par token
- `POST /api/invitations/:token/accept` - Accepter
- `POST /api/invitations/:token/decline` - Refuser
- `DELETE /api/invitations/:id` - Annuler

### Transactions (avec familyId)
- `GET /api/families/:familyId/transactions` - Liste
- `POST /api/families/:familyId/transactions` - Créer
- `GET /api/families/:familyId/transactions/:id` - Détails
- `PUT /api/families/:familyId/transactions/:id` - Modifier
- `DELETE /api/families/:familyId/transactions/:id` - Supprimer
- `GET /api/families/:familyId/transactions/member/:memberId` - Par membre

### Budgets, Catégories, Statistiques (idem avec familyId)

## 🚀 Prochaines Étapes

1. **Adapter les composants existants** (transactions, budgets, categories, dashboard)
2. **Tester toutes les fonctionnalités** avec le backend
3. **Ajouter des pipes personnalisés**:
   - `role-name.pipe.ts`: Traduit ADMIN → "Administrateur"
   - `date-format.pipe.ts`: Format dates français
4. **Améliorer l'UX**:
   - Toasts/notifications pour les actions
   - Loading states plus détaillés
   - Animations de transition
5. **Tests unitaires** pour services et guards
6. **Documentation API** complète

## 📝 Notes Importantes

- **Famille obligatoire**: L'utilisateur DOIT sélectionner une famille pour accéder à Dashboard/Transactions
- **Redirection intelligente**: Si 0 famille → /families/create, si 1+ famille → auto-sélection
- **Hiérarchie des rôles**: ADMIN > PARENT > MEMBER
- **Standalone components**: Pas de modules Angular, tout en standalone
- **RxJS**: Utilisation intensive des observables pour la réactivité

## 🐛 Debugging

Si erreurs au démarrage:
1. Vérifier que `environment.apiUrl` pointe vers le bon backend
2. Vérifier que le backend renvoie bien les modèles TypeScript attendus
3. Vérifier la console pour les erreurs d'interceptor
4. Tester `/auth/login` en premier

---

**Date de migration**: Février 2026  
**Version Angular**: 17 (Standalone Components)  
**Architecture**: MVP Multi-Familles avec JWT
