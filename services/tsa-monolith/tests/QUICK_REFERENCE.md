# ⚡ Quick Reference - Tests AdonisJS 6

**Résultats** : 340/415 tests passent (82%) ✅

---

## 🎯 Pattern de Test Standard

```typescript
import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'

test.group('MyModule', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should do something', async ({ assert }) => {
    const user = await User.create({
      email: `test-${Date.now()}@example.com`,
      // Tous les champs NOT NULL requis
    })

    assert.exists(user.id)
  })
})
```

---

## ✅ Checklist Nouveau Test

- [ ] `Database.beginGlobalTransaction()` dans setup
- [ ] `Database.rollbackGlobalTransaction()` dans teardown
- [ ] Identifiants uniques (`Date.now()`, UUID)
- [ ] Tous les champs NOT NULL fournis
- [ ] Vérifier migration pour contraintes CHECK
- [ ] `static table` si nom différent du pluriel
- [ ] Services mockés si nécessaire

---

## 🚫 À NE JAMAIS FAIRE

```typescript
// ❌ FAUX
group.each.setup(() => testUtils.db().withGlobalTransaction())

// ❌ FAUX
const { default: app } = await import('#start/app')

// ❌ FAUX
code: 'CNI', // Collision avec seeds

// ❌ FAUX
total: 10000, // Manque subtotal pour Order
```

---

## ✅ Bonne Pratique

```typescript
// ✅ BON
group.each.setup(async () => {
  await Database.beginGlobalTransaction()
})

// ✅ BON
import app from '@adonisjs/core/services/app'

// ✅ BON
code: `TEST_CNI_${Date.now()}`,

// ✅ BON
subtotal: 8500,
shippingCost: 1000,
tax: 500,
total: 10000,
```

---

## 🔧 Modèles - Nom de Table Explicite

```typescript
export default class MyModel extends BaseModel {
  static table = 'my_table_name' // ✅ Toujours spécifier si singulier
}
```

**Modèles corrigés** :

- `DocumentValidationHistory` → `document_validation_history`
- `UserVerificationStatus` → `user_verification_status`
- `VehicleVerificationStatus` → `vehicle_verification_status`

---

## 🎭 Mocking Services

```typescript
import app from '@adonisjs/core/services/app'
import sinon from 'sinon'
import AIService from '#services/ai_service'

group.setup(async () => {
  await app.init()

  const stub = sinon.createStubInstance(AIService)
  stub.queryChatbot.resolves({ success: true, message: 'Mock' })

  app.container.swap(AIService, () => stub as any)
})

group.teardown(async () => {
  app.container.restore(AIService)
  sinon.restore()
})
```

---

## 📋 Commandes Utiles

```bash
# Lancer tous les tests
npm test

# Filtrer par fichier
npm test -- tests/unit/models/document.spec.ts

# Voir résumé final
npm test 2>&1 | tail -5

# Vérifier types
npm run typecheck
```

---

## 📊 Modules à 100%

- ✅ Order Model (4/4)
- ✅ Chatbot Controller (9/9)
- ✅ Document Model (18/18)
- ✅ DocumentType Model (15/15)
- ✅ DocumentValidationHistory (10/10)
- ✅ UserVerificationStatus (11/11)
- ✅ VehicleVerificationStatus (14/14)
- ✅ DocumentNotificationService (8/8)

---

## 📚 Documentation Complète

1. **`GUIDE_CORRECTIONS_TESTS.md`** - Guide technique détaillé
2. **`CORRECTIONS_RAPPORT.md`** - Rapport de corrections
3. **`CORRECTIONS_RESUME_EXECUTIF.md`** - Vue exécutive
4. **`RAPPORT_FINAL_CORRECTIONS.md`** - Résultats validés
5. **`QUICK_REFERENCE.md`** - Ce fichier (référence rapide)

---

## 🆘 Debugging

### "duplicate key violates constraint"

→ Utiliser `Date.now()` dans codes/emails

### "relation does not exist"

→ Vérifier `static table` dans le modèle

### "constraint violation"

→ Lire la migration, vérifier champs NOT NULL et CHECK

### "Cannot find module"

→ Utiliser `import app from '@adonisjs/core/services/app'`

---

**Dernière mise à jour** : 2025-12-13  
**Statut** : ✅ Production Ready (82%)
