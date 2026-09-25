# Feuille de route globale — Research Agent (Google ADK)

## Statut actuel du projet
* **Version en cours** : V1 — Complétée (Phase 1 : Refacto architecture & résilience)
* **Étape active** : Termination de la Phase 1 — Vérification de la robustesse, corrections de fallback et migration UI
* **Modèle IA sous-jacent** : `gemini-3.6-flash` (défaut), avec fallback automatique vers `gemini-3.5-flash`, `gemini-3.7-flash`, `gemini-flash-latest`, `gemini-3.8-flash` en cas de forte demande temporaire
* **Cadre technique** : Next.js 15, Google ADK (`@google/adk`), TypeScript strict. Nouveaux modules : `lib/config/models.ts`, `lib/agent/fallback-policy.ts`, `lib/agent/plan-parser.ts`, `lib/agent/runner-service.ts`

---

## Roadmap des versions

### Version 1 — Complétée (Phase 1 & 2 de raffinement)
*Objectif : Architecture résiliente, parsing strict, gestion d'erreurs contextuelle et design system de base.*
* [x] **Étape 1.1** : Configuration de `@google/adk` et définition des types TypeScript (`types/agent.ts`).
* [x] **Étape 1.2** : Implémentation du moteur agentique ADK (`LlmAgent`, `InMemoryRunner`) et de la route API `/api/agent/plan`.
* [x] **Étape 1.3** : Développement de l'interface utilisateur unifiée (`app/page.tsx`) avec les 6 panneaux visuels distincts.
* [x] **Étape 1.4** : Validation, vérifications anti-hallucination et tests de robustesse (build validé avec succès).
* [x] **Étape 1.5** — **Refactoring résilience** : Politique de retry + fallback multi-modèles (ne plus échouer sur 503 uniquement).
* [x] **Étape 1.6** — **Parsing et validation stricte** : Schéma JSON obligatoire, nettoyage output, verrous V1 (status=PLANIFIED, isBlocked=true).
* [x] **Étape 1.7** — **Gestion d'erreurs contextuelle** : Codes erreurs (503, 429, NETWORK, PARSE) → messages utilisateur actionnables.
* [x] **Étape 1.8** — **Design system de base** : Tokens centralisés (`lib/config/models.ts`), séparation modèle/config, état d'erreur enrichi.

### Version 2 — Intégration d'Outils Réels & Contrôle Humain (À venir)
*Objectif : Connecter les premiers outils ADK avec validation humaine avant chaque exécution.*
* [ ] **Étape 2.1** : Déclaration de `FunctionTool` ADK (`search_web`, `read_document`, `save_result`).
* [ ] **Étape 2.2** : Interface d'autorisation utilisateur ("Human-in-the-loop") avant déclenchement d'un outil.
* [ ] **Étape 2.3** : Exécution réelle des outils et affichage des données brutes vérifiables.
* [ ] **Étape 2.4** : Transition d'état de l'agent (`PLANIFIÉ` → `EN_COURS` → `TERMINÉ`).

### Version 3 — Boucle Agentique Autonome & Mémoire (À venir)
*Objectif : Boucle ReAct complète avec orchestration multi-tours et persistance.*
* [ ] **Étape 3.1** : Orchestration avec les agents de flux ADK (`SequentialAgent`, `LoopAgent`).
* [ ] **Étape 3.2** : Évaluation autonome du critère d'arrêt et auto-correction.
* [ ] **Étape 3.3** : Persistance de session et historique de recherche.

### Version 4 — Design System Visuel & Expérience Utilisateur (Planifié)
*Objectif : Interface soignée conforme à la maquette fournie, composants réutilisables et design system complet.*
* [ ] **Étape 4.1** : Création du design system tokens (`colors`, `spacing`, `radius`, `shadows`, `typography`).
* [ ] **Étape 4.2** : Composants UI de base (`Button`, `Card`, `Input`, `Select`, `Badge`, `Drawer`, `Toast`, `Spinner`).
* [ ] **Étape 4.3** : Remplacement des styles Tailwind ad hoc par les tokens définis.
* [ ] **Étape 4.4** : Refactor des 6 panneaux de résultat en composants dédiés (`ObjectiveCard`, `TasksList`, `InfoGrid`, `ToolsGrid`, `StoppingCriteriaCard`, `NextActionCard`).
* [ ] **Étape 4.5** : Améliorations UX : états de chargement, notifications de fallback, sélecteur de modèle interactif.
