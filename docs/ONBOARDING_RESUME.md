# Onboarding - Reprise et Synchronisation

## Vue d'ensemble

Le système d'onboarding de Family Finance dispose d'un mécanisme complet de **reprise automatique** et de **synchronisation avec le backend** pour garantir une expérience utilisateur fluide même en cas d'interruption.

## 🔄 Fonctionnalités de reprise

### 1. **Persistance locale (localStorage)**
L'état d'onboarding est automatiquement sauvegardé dans le `localStorage` à chaque étape :
- Étape actuelle (`currentStep`)
- Étapes complétées (`steps[].completed`)
- Données temporaires (email, nom famille, catégories sélectionnées, etc.)

**Avantage** : Si l'utilisateur ferme le navigateur ou rafraîchit la page, il reprend exactement là où il s'est arrêté.

### 2. **Synchronisation avec le backend**
Au moment de la connexion ou au démarrage de l'application, le service récupère le statut réel depuis le backend :

```typescript
// Endpoint backend attendu
GET /api/users/me/onboarding-status

// Réponse
{
  "completed": false,
  "currentStep": 2,
  "stepsCompleted": {
    "accountCreated": true,
    "familyCreated": false,
    "categoriesAdded": false,
    "firstTransactionAdded": false
  },
  "completedAt": null
}
```

**Avantage** : L'état est cohérent entre appareils (bureau, mobile, tablette).

### 3. **Fusion intelligente des états**
La méthode `mergeStates()` combine l'état local et le statut backend selon ces règles :
- **Priorité au backend** : Si le backend indique qu'une étape est complétée, elle l'est même si le local ne le sait pas
- **Utilisation du plus avancé** : Le `currentStep` retenu est le maximum entre local et backend
- **Conservation des données en cours** : Les données de formulaire non encore envoyées sont préservées

```typescript
private mergeStates(localState: OnboardingState, backendStatus: OnboardingStatus): OnboardingState {
  // Si backend dit "completed", c'est fait !
  if (backendStatus.completed) {
    this.storageService.markOnboardingComplete();
    return this.initialState;
  }

  // Fusionner les étapes complétées
  const mergedSteps = localState.steps.map((step, index) => {
    let completed = step.completed || backendStatus.stepsCompleted[stepNames[index]];
    return { ...step, completed };
  });

  // Prendre le currentStep le plus avancé
  const currentStep = Math.max(localState.currentStep, backendStatus.currentStep);

  return { ...localState, currentStep, steps: mergedSteps };
}
```

## 📍 Points de synchronisation

### Au démarrage de l'application
```typescript
// app.config.ts - APP_INITIALIZER
authService.setOnboardingService(onboardingService);

// auth.service.ts - loadCurrentUser()
if (this.isAuthenticated()) {
  this.getCurrentUser().subscribe(() => {
    this.syncOnboardingAfterAuth(); // ← Synchronise ici
  });
}
```

### Après la connexion
```typescript
// auth.service.ts - login()
login(request: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.API_URL}/login`, request)
    .pipe(
      tap(response => {
        this.handleAuthResponse(response);
        this.syncOnboardingAfterAuth(); // ← Synchronise ici
      })
    );
}
```

### Lors de l'accès à une route protégée
```typescript
// onboarding-complete.guard.ts
if (!onboardingService.isOnboardingComplete()) {
  onboardingService.resumeOnboarding(); // ← Synchronise et redirige
  return false;
}
```

## 🎯 Scénarios de reprise

### Scénario 1 : Interruption pendant l'onboarding
**Contexte** : L'utilisateur est à l'étape 2 (création famille), ferme son navigateur  
**Au retour** :
1. `onboardingCompleteGuard` détecte que l'onboarding n'est pas complet
2. Appelle `resumeOnboarding()`
3. Synchronise avec le backend
4. Redirige vers `/onboarding/family-setup` (étape 2)

### Scénario 2 : Changement d'appareil
**Contexte** : L'utilisateur commence sur desktop (étape 1 et 2 complétées), continue sur mobile  
**Au retour** :
1. Login sur mobile
2. `syncStateWithBackend()` récupère le statut backend (étape 2 complétée)
3. Fusionne avec l'état local vide du mobile
4. L'utilisateur reprend à l'étape 3 directement

### Scénario 3 : Backend en avance sur le local
**Contexte** : L'utilisateur a terminé hors ligne, mais le backend a déjà marqué l'onboarding complet  
**Au retour** :
1. `syncStateWithBackend()` récupère `completed: true`
2. Marque l'onboarding comme terminé localement
3. Redirige vers le dashboard

### Scénario 4 : Données en conflit
**Contexte** : Local dit "étape 3", backend dit "étape 2"  
**Résolution** :
- Fusion : `currentStep = Math.max(3, 2) = 3`
- Mais les étapes 1 et 2 sont marquées complétées si le backend le dit
- L'utilisateur continue à l'étape 3

## 🛠️ API Backend requise

### Endpoint de statut
```
GET /api/users/me/onboarding-status
Authorization: Bearer {token}

Réponse 200 OK:
{
  "completed": boolean,
  "currentStep": number,
  "stepsCompleted": {
    "accountCreated": boolean,
    "familyCreated": boolean,
    "categoriesAdded": boolean,
    "firstTransactionAdded": boolean
  },
  "completedAt": "2026-03-04T14:30:00Z" | null
}
```

### Mise à jour du statut (automatique)
Le backend doit mettre à jour le statut d'onboarding automatiquement lorsque :
- Un compte est créé → `accountCreated = true`
- Une famille est créée → `familyCreated = true`
- Des catégories sont ajoutées → `categoriesAdded = true`
- Une transaction est créée → `firstTransactionAdded = true`

Lorsque toutes les étapes obligatoires sont complétées :
```
completed = true
completedAt = NOW()
```

## 🔧 Méthodes disponibles

### OnboardingService

#### `syncStateWithBackend(): Observable<OnboardingState>`
Récupère le statut backend et fusionne avec l'état local.

#### `resumeOnboarding(): void`
Synchronise avec le backend et navigue vers la prochaine étape.

#### `fetchOnboardingStatus(): Observable<OnboardingStatus>`
Récupère uniquement le statut depuis le backend (sans fusion).

#### `clearOnboardingState(): void`
Efface l'état local (utilisé après complétion).

#### `resetOnboarding(): void`
Réinitialise complètement l'onboarding (dev/test uniquement).

## ⚠️ Gestion des erreurs

Si le backend ne répond pas ou si l'endpoint n'existe pas encore :
```typescript
fetchOnboardingStatus(): Observable<OnboardingStatus> {
  return this.http.get<OnboardingStatus>(`${this.API_URL}/users/me/onboarding-status`)
    .pipe(
      catchError(error => {
        // Fallback sur un statut par défaut
        return of({
          completed: false,
          currentStep: 1,
          stepsCompleted: {
            accountCreated: true, // Si on peut appeler l'API, le compte existe
            familyCreated: false,
            categoriesAdded: false,
            firstTransactionAdded: false
          }
        });
      })
    );
}
```

L'app continue de fonctionner en mode "local only" si le backend n'est pas disponible.

## 📊 Flow de reprise complet

```
User ouvre l'app
    ↓
isAuthenticated? 
    ↓ Oui
loadCurrentUser()
    ↓
syncOnboardingAfterAuth()
    ↓
fetchOnboardingStatus() ← API Call
    ↓
mergeStates(local, backend)
    ↓
saveState(merged)
    ↓
User tente d'accéder à /dashboard
    ↓
onboardingCompleteGuard
    ↓
isOnboardingComplete?
    ↓ Non
resumeOnboarding()
    ↓
syncStateWithBackend() ← Re-sync pour être sûr
    ↓
navigate('/onboarding/[next-step]')
```

## ✅ Tests manuels

Pour tester la reprise d'onboarding :

1. **Test de persistance locale** :
   ```typescript
   // Console navigateur
   localStorage.getItem('onboarding_state')
   ```

2. **Test de reprise après fermeture** :
   - Commencer l'onboarding (étape 1 et 2)
   - Fermer le navigateur
   - Rouvrir → devrait reprendre à l'étape 3

3. **Test de synchronisation backend** :
   - Modifier manuellement le localStorage
   - Se reconnecter
   - Vérifier que le statut backend prévaut

4. **Test multi-appareils** :
   - Commencer sur device A
   - Se connecter sur device B
   - Vérifier que le statut est synchronisé

## 🚀 Améliorations futures

- [ ] Gestion des conflits de version (timestamp local vs backend)
- [ ] Mode hors ligne avec queue de synchronisation
- [ ] Analytics des abandons à chaque étape
- [ ] Notifications push pour rappeler de terminer l'onboarding
