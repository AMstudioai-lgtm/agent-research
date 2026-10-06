# Feuille de route globale — Research Agent (Google ADK)

## Statut actuel du projet
* **Version en cours** : V2.1 — Sortie Structurée DeepResearch & Ancrage 2026
* **Étape active** : Module accompli avec succès (Rapport DeepResearch exclusif dans l'espace réponse, traçabilité dans le Thinking, ancrage 2026 et validation humaine du plan)
* **Modèle IA sous-jacent** : `gemini-3.5-flash` (modèle exclusif, aucun switch automatique)
* **Cadre technique** : Next.js 15, Google ADK (`@google/adk`), TypeScript strict, Tailwind CSS, Bun

---

## Alignement Visuel avec les Spécifications (Template & Wireframe)

Conformément aux maquettes fournies par l'utilisateur :
1. **Barre Supérieure (Top Bar)** :
   - **Burger contenant les conversations** : Bouton carré aux coins arrondis à gauche ouvrant le drawer d'historique.
   - **Nom de la conversation** : Pill horizontal aux bords arrondis au centre affichant le titre de la conversation en cours.
   - Bouton d'action à droite pour démarrer une nouvelle conversation.
2. **Corps de l'application (Flux de discussion)** :
   - **Message envoyé** : Bulle de message utilisateur soignée, alignée à droite.
   - **Log dépliable de l'agent ("ce qu'il est en train de faire")** : Bandeau horizontal dépliable sous le message avec indicateur d'état, chevron et détails de traçabilité.
   - **Espace réponse** : Espace central épuré accueillant les résultats structurés (Statut officiel, Objectif, Action suivante Human-in-the-loop, Liste des tâches, Carnet de recherche et Diagnostics).
3. **Pied de page fixé (Bottom Container)** :
   - **Suggestions** : Pilules horizontales positionnées juste au-dessus du champ pour lancer des recherches types.
   - **Champ texte** : Grand conteneur rectangulaire encadré et arrondi avec textarea auto-extensible.
   - **Espace de sélection modèle** : Pill situé en bas à gauche à l'intérieur du champ texte affichant `Gemini 3.5 Flash` et un mini-popover descriptif.
   - **Bouton d'envoi** : Bouton carré aux coins arrondis situé en bas à droite à l'intérieur du champ texte avec icône de flèche (`→`).

---

## Architecture des Fichiers

* **`lib/config/models.ts`** : Modèle fixe exclusif `gemini-3.5-flash`.
* **`lib/agent/research-agent.ts`** : Configuration de l'agent `LlmAgent` Google ADK.
* **`lib/agent/runner.ts`** : Exécution via `InMemoryRunner`.
* **`lib/agent/fallback.ts`** : Génération de secours déterministe isolée.
* **`lib/agent/tools.ts`** : Outils réels ADK (`search_web`, `read_document`, `save_result`).
* **`components/`** :
  - `Header.tsx` : Burger, pill du nom de conversation, nouvelle recherche.
  - `Sidebar.tsx` : Tiroir coulissant des conversations.
  - `UserMessage.tsx` : Bulle "Message envoyé" alignée à droite.
  - `AgentLogBar.tsx` : "Log dépliable de l'agent, ce qu'il est en train de faire".
  - `ResponseSpace.tsx` : "Espace réponse" avec les composants modulaires.
  - `Suggestions.tsx` : Pilules de suggestions au-dessus du champ texte.
  - `BottomInput.tsx` : "Champ texte" avec "Espace de sélection modèle" et "Bouton d'envoie".
  - `StatusBanner.tsx`, `NextActionCard.tsx`, `TaskList.tsx`, `SavedNotesCard.tsx`, `ExecutionHistoryCard.tsx`, `RequiredInfoCard.tsx`, `RequiredToolsCard.tsx`.
* **`app/page.tsx`** : Assemblage clair et responsive.
