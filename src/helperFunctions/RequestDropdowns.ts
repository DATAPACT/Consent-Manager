import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // adjust path based on your setup

export interface Option {
  value: string;
  label: string;
}

export interface OntologyOption {
  label: string;
  value: string;
}

export async function fetchOntologyOptions(): Promise<OntologyOption[]> {
  const snapshot = await getDocs(collection(db, "ontologies")); // assuming collection name is "ontologies"

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      label: data.name || "Unnamed",
      value: doc.id,
    };
  });
}

export const getFeatureDropdownValue = (
  type: "action" | "purpose"
): Option[] => {
  if (type === "action") {
    return [
      { value: "", label: "Choose action" },
      { value: "read", label: "Read" },
      { value: "write", label: "Write" },
      { value: "delete", label: "Delete" },
    ];
  }

  if (type === "purpose") {
    return [
      { value: "", label: "Choose purpose" },
      { value: "marketing", label: "Marketing" },
      { value: "legal", label: "Legal" },
      { value: "logistics", label: "Logistics" },
    ];
  }

  // Optionally return an empty array or throw an error if type is invalid
  return [];
};

export const getAttributeDropdownValue = (): Option[] => {
  return [
    { value: "", label: "Choose attribute" },
    { value: "comercial", label: "Comercial" },
    { value: "personal", label: "Personal" },
    { value: "development", label: "Development" },
  ];
};

export const getOperandDropdownValue = (): Option[] => {
  return [
    { value: "", label: "Choose instance" },
    { value: "eq", label: "eq" },
    { value: "gt", label: "gt" },
    { value: "gteq", label: "gteq" },
    { value: "hasPart", label: "hasPart" },
    { value: "isA", label: "isA" },
    { value: "isAllOf", label: "isAllOf" },
    { value: "isAnyOf", label: "isAnyOf" },
    { value: "isNoneOf", label: "isNoneOf" },
    { value: "isPartOf", label: "isPartOf" },
    { value: "lt", label: "lt" },
    { value: "lteq", label: "lteq" },
    { value: "neq", label: "neq" },
  ];
};

export const getAttributeLabel = (Labelvalue: string): string => {
  return "Install";
};

export const getInstanceLabel = (Labelvalue: string): string => {
  return "Download";
};
