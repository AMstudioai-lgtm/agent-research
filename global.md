# Feuille de route globale — Research Agent (Google ADK)

## Statut actuel du projet
* **Version en cours** : V1 — Cadrage & Planification Pédagogique (Google ADK)
* **Étape active** : Étape 1.4 — Validation, vérifications anti-hallucination & démonstration utilisateur
* **Modèle IA sous-jacent** : `gemini-3.6-flash` (défaut), avec fallback automatique sur `gemini-3.5-flash`, `gemini-3.7-flash`, `gemini-flash-latest`, `gemini-3.8-flash`
* **Cadre technique** : Next.js 15, Google ADK (`@google/adk`), TypeScript strict

---

## Roadmap des versions

### Version 1 — Cadrage, Structuration & Pédagogie (Livrée & Testable)
*Objectif : Transformer une demande utilisateur en un plan structuré avec les 6 sections sans aucun outil externe ni hallucination.*
* [x] **Étape 1.1** : Configuration de `@google/adk` et définition des types TypeScript (`types/agent.ts`).
* [x] **Étape 1.2** : Implémentation du moteur agentique ADK (`LlmAgent`, `InMemoryRunner`) et de la route API `/api/agent/plan`.
* [x] **Étape 1.3** : Développement de l'interface utilisateur unifiée (`app/page.tsx`) avec les 6 panneaux visuels distincts.
* [x] **Étape 1.4** : Validation, vérifications anti-hallucination et tests de robustesse (build validé avec succès).

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
