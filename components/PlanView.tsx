'use client';

import React, { useState } from 'react';
import { Check, Edit3, Play, Plus, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { ResearchPlan, PlannedTask } from '@/types/agent';
import { motion } from 'motion/react';

interface PlanViewProps {
  plan: ResearchPlan;
  isRunning: boolean;
  onValidateAndRun: (updatedPlan?: ResearchPlan) => void;
  onUpdatePlan: (updatedPlan: ResearchPlan) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  plan,
  isRunning,
  onValidateAndRun,
  onUpdatePlan,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedObjective, setEditedObjective] = useState(plan.objective);
  const [editedTasks, setEditedTasks] = useState<PlannedTask[]>(plan.tasks);
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const handleStartEdit = () => {
    setEditedObjective(plan.objective);
    setEditedTasks(plan.tasks);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const updated: ResearchPlan = {
      ...plan,
      objective: editedObjective.trim() || plan.objective,
      tasks: editedTasks,
    };
    onUpdatePlan(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedObjective(plan.objective);
    setEditedTasks(plan.tasks);
    setIsEditing(false);
  };

  const handleAddTask = () => {
    if (!newTaskDesc.trim()) return;
    const newTask: PlannedTask = {
      id: editedTasks.length > 0 ? Math.max(...editedTasks.map((t) => t.id)) + 1 : 1,
      description: newTaskDesc.trim(),
      expectedOutput: 'Résultats et données vérifiés',
      isCompleted: false,
    };
    setEditedTasks([...editedTasks, newTask]);
    setNewTaskDesc('');
  };

  const handleRemoveTask = (id: number) => {
    setEditedTasks(editedTasks.filter((t) => t.id !== id));
  };

  const isCompleted = plan.status === 'TERMINÉ';

  return (
    <div className="space-y-4">
      {/* Carte principale du Plan : Gris Card (#1A1A1A) avec bordure (#2A2A2A) */}
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-5 shadow-xs">
        {/* En-tête : Titre & Actions (Valider / Modifier) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2A2A] pb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Plan de recherche proposé
            </h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              {isCompleted
                ? 'Recherche terminée avec succès.'
                : isRunning
                ? "L'agent exécute automatiquement les outils connectés..."
                : 'Validez ce plan pour démarrer la recherche autonome ou modifiez-le.'}
            </p>
          </div>

          {!isRunning && !isCompleted && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-1.5 text-xs font-medium text-[#E5E5E5] transition-colors hover:bg-[#111111]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Annuler
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#059669] transition-colors focus:ring-2 focus:ring-[#10B981]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Enregistrer
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-transparent px-3.5 py-1.5 text-xs font-medium text-[#E5E5E5] transition-colors hover:border-[#3B82F6] hover:bg-[#111111] hover:text-[#3B82F6]"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#737373]" />
                    Modifier le plan
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onValidateAndRun()}
                    className="flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    Valider le plan
                  </motion.button>
                </>
              )}
            </div>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#1E3A5F]/30 px-3 py-1 text-xs font-semibold text-[#3B82F6]">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-ping" />
              <span>Exécution automatique...</span>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#0F2A1E] px-3 py-1 font-mono text-xs font-bold text-[#10B981]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Recherche terminée</span>
            </div>
          )}
        </div>

        {/* Objectif */}
        <div className="mt-4">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#737373] block mb-1">
            Objectif de recherche
          </span>
          {isEditing ? (
            <textarea
              value={editedObjective}
              onChange={(e) => setEditedObjective(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#111111] p-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
          ) : (
            <p className="text-sm font-medium text-[#E5E5E5] leading-relaxed">
              {plan.objective}
            </p>
          )}
        </div>

        {/* Liste des tâches séquentielles */}
        <div className="mt-5 space-y-2.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#737373] block">
            Étapes du plan ({isEditing ? editedTasks.length : plan.tasks.length})
          </span>

          <div className="space-y-2">
            {(isEditing ? editedTasks : plan.tasks).map((task, index) => {
              const done = !!task.isCompleted;

              return (
                <div
                  key={task.id || index}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                    done
                      ? 'border-[#10B981]/30 bg-[#0F2A1E]/40'
                      : 'border-[#2A2A2A] bg-[#111111]/70'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {done ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] font-mono text-[10px] font-bold text-[#A3A3A3]">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditedTasks((prev) =>
                            prev.map((t) => (t.id === task.id ? { ...t, description: val } : t))
                          );
                        }}
                        className="w-full rounded border border-[#2A2A2A] bg-[#111111] px-2 py-1 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                      />
                    ) : (
                      <p
                        className={`text-xs font-medium ${
                          done
                            ? 'text-[#10B981] line-through decoration-[#10B981]/50'
                            : 'text-[#E5E5E5]'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    {task.executionResult && (
                      <p className="mt-1 font-mono text-[11px] text-[#10B981]">
                        ✓ {task.executionResult}
                      </p>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-[#737373] hover:text-[#E11D48] p-1"
                      title="Supprimer cette étape"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Formulaire d'ajout d'étape en mode édition */}
          {isEditing && (
            <div className="mt-3 flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                placeholder="Ajouter une étape au plan..."
                className="flex-1 rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-1.5 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddTask}
                disabled={!newTaskDesc.trim()}
                className="flex items-center gap-1 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#333333] disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
