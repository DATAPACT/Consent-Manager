import { useState } from "react";

// Interfaces
export interface Refinement {
  id: number;
  attribute?: string;
  instance?: string;
  value?: string;
  label?: string;
}

export interface Permission {
  id: number;
  dataset: string;
  action: string;
  purpose: string;
  datasetRefinements: Refinement[];
  purposeRefinements: Refinement[];
  actionRefinements: Refinement[];
  constraintRefinements: Refinement[];
}

// Custom Hook to manage permissions
export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: Date.now(),
      dataset: "",
      action: "",
      purpose: "",
      datasetRefinements: [],
      purposeRefinements: [],
      actionRefinements: [],
      constraintRefinements: [],
    },
  ]);

  // Function to add a new permission
  const addPermission = () => {
    setPermissions([
      ...permissions,
      {
        id: Date.now(),
        dataset: "",
        action: "",
        purpose: "",
        datasetRefinements: [],
        purposeRefinements: [],
        actionRefinements: [],
        constraintRefinements: [],
      },
    ]);
  };

  // Function to remove a permission
  const removePermission = (id: number) => {
    if (id !== permissions[0].id) {
      setPermissions(permissions.filter((permission) => permission.id !== id));
    }
  };

  // Function to add refinements
  const addDatasetRefinement = (permissionId: number) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              datasetRefinements: [
                ...permission.datasetRefinements,
                { id: Date.now() },
              ],
            }
          : permission
      )
    );
  };

  const addPurposeRefinement = (permissionId: number) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              purposeRefinements: [
                ...permission.purposeRefinements,
                { id: Date.now() },
              ],
            }
          : permission
      )
    );
  };

  const addActionRefinement = (permissionId: number) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              actionRefinements: [
                ...permission.actionRefinements,
                { id: Date.now() },
              ],
            }
          : permission
      )
    );
  };

  const addConstraintRefinement = (permissionId: number) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              constraintRefinements: [
                ...permission.constraintRefinements,
                { id: Date.now() },
              ],
            }
          : permission
      )
    );
  };

  // Function to remove refinements
  const removeDatasetRefinement = (
    permissionId: number,
    refinementId: number
  ) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              datasetRefinements: permission.datasetRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : permission
      )
    );
  };

  const removePurposeRefinement = (
    permissionId: number,
    refinementId: number
  ) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              purposeRefinements: permission.purposeRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : permission
      )
    );
  };

  const removeActionRefinement = (
    permissionId: number,
    refinementId: number
  ) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              actionRefinements: permission.actionRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : permission
      )
    );
  };

  const removeConstraintRefinement = (
    permissionId: number,
    refinementId: number
  ) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              constraintRefinements: permission.constraintRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : permission
      )
    );
  };

  const updateDataset = (permissionId: number, value: string) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? { ...permission, dataset: value }
          : permission
      )
    );
  };

  const updateDatasetRefinement = (
    permissionId: number,
    refinementId: number,
    field: keyof Refinement,
    value: string
  ) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              datasetRefinements: permission.datasetRefinements.map((r) =>
                r.id === refinementId ? { ...r, [field]: value } : r
              ),
            }
          : permission
      )
    );
  };

  const updateAction = (permissionId: number, value: string) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? { ...permission, action: value }
          : permission
      )
    );
  };

  const updateActionRefinement = (
    permissionId: number,
    refinementId: number,
    field: keyof Refinement,
    value: string
  ) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              actionRefinements: permission.actionRefinements.map((r) =>
                r.id === refinementId ? { ...r, [field]: value } : r
              ),
            }
          : permission
      )
    );
  };

  const updatePurpose = (permissionId: number, value: string) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? { ...permission, purpose: value }
          : permission
      )
    );
  };

  const updatePurposeRefinement = (
    permissionId: number,
    refinementId: number,
    field: keyof Refinement,
    value: string
  ) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              purposeRefinements: permission.purposeRefinements.map((r) =>
                r.id === refinementId ? { ...r, [field]: value } : r
              ),
            }
          : permission
      )
    );
  };

  const updateConstraintsRefinement = (
    permissionId: number,
    refinementId: number,
    field: keyof Refinement,
    value: string
  ) => {
    setPermissions(
      permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              constraintRefinements: permission.constraintRefinements.map((r) =>
                r.id === refinementId ? { ...r, [field]: value } : r
              ),
            }
          : permission
      )
    );
  };

  return {
    permissions,
    setPermissions,
    addPermission,
    removePermission,
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
    updatePurpose,
    updateDatasetRefinement,
    updateActionRefinement,
    updatePurposeRefinement,
    updateConstraintsRefinement,
  };
};
