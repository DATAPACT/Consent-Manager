import { useState } from "react";

// Interfaces
export interface Refinement {
  id: number;
  attribute?: string;
  instance?: string;
  value?: string;
}

export interface Rule {
  id: number;
  dataset: string;
  action: string;
  datasetRefinements: Refinement[];
  purposeRefinements: Refinement[];
  actionRefinements: Refinement[];
  constraintRefinements: Refinement[];
}

// Custom Hook to manage rules
export const useRules = () => {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: Date.now(),
      dataset: "",
      action: "",
      datasetRefinements: [],
      purposeRefinements: [],
      actionRefinements: [],
      constraintRefinements: [],
    },
  ]);

  // Function to add a new rule
  const addRule = () => {
    setRules([
      ...rules,
      {
        id: Date.now(),
        dataset: "",
        action: "",
        datasetRefinements: [],
        purposeRefinements: [],
        actionRefinements: [],
        constraintRefinements: [],
      },
    ]);
  };

  // Function to remove a rule
  const removeRule = (id: number) => {
    if (id !== rules[0].id) {
      setRules(rules.filter((rule) => rule.id !== id));
    }
  };

  // Function to add refinements
  const addDatasetRefinement = (ruleId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              datasetRefinements: [
                ...rule.datasetRefinements,
                { id: Date.now() },
              ],
            }
          : rule
      )
    );
  };

  const addPurposeRefinement = (ruleId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              purposeRefinements: [
                ...rule.purposeRefinements,
                { id: Date.now() },
              ],
            }
          : rule
      )
    );
  };

  const addActionRefinement = (ruleId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              actionRefinements: [
                ...rule.actionRefinements,
                { id: Date.now() },
              ],
            }
          : rule
      )
    );
  };

  const addConstraintRefinement = (ruleId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              constraintRefinements: [
                ...rule.constraintRefinements,
                { id: Date.now() },
              ],
            }
          : rule
      )
    );
  };

  // Function to remove refinements
  const removeDatasetRefinement = (ruleId: number, refinementId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              datasetRefinements: rule.datasetRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : rule
      )
    );
  };

  const removePurposeRefinement = (ruleId: number, refinementId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              purposeRefinements: rule.purposeRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : rule
      )
    );
  };

  const removeActionRefinement = (ruleId: number, refinementId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              actionRefinements: rule.actionRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : rule
      )
    );
  };

  const removeConstraintRefinement = (ruleId: number, refinementId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              constraintRefinements: rule.constraintRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : rule
      )
    );
  };

  const updateDataset = (ruleId: number, value: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, dataset: value } : rule
      )
    );
  };

  const updateDatasetRefinement = (
    ruleId: number,
    refinementId: number,
    field: keyof Refinement,
    value: string
  ) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              datasetRefinements: rule.datasetRefinements.map((r) =>
                r.id === refinementId ? { ...r, [field]: value } : r
              ),
            }
          : rule
      )
    );
  };

  const updateAction = (ruleId: number, value: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, action: value } : rule
      )
    );
  };

  const updateActionRefinement = (
    ruleId: number,
    refinementId: number,
    field: keyof Refinement,
    value: string
  ) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              actionRefinements: rule.actionRefinements.map((r) =>
                r.id === refinementId ? { ...r, [field]: value } : r
              ),
            }
          : rule
      )
    );
  };

  return {
    rules,
    addRule,
    removeRule,
    addDatasetRefinement,
    addPurposeRefinement,
    addActionRefinement,
    addConstraintRefinement,
    removeDatasetRefinement,
    removePurposeRefinement,
    removeActionRefinement,
    removeConstraintRefinement,
    updateDataset,
    updateAction,
    updateDatasetRefinement,
    updateActionRefinement,
  };
};
