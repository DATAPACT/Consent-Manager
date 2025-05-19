import { getFirestore, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // adjust path based on your setup

export interface Option {
  value: string;
  label: string;
}

export type Ontology = {
  id: string;
  content: string;
};

export const fetchOntologies = async (): Promise<Ontology[]> => {
  const db = getFirestore();
  const colRef = collection(db, "ontologies");
  const snapshot = await getDocs(colRef);

  const ontologiesData = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data();
      if (!data.fileURL) {
        return { id: doc.id, content: "No fileURL found" };
      }
      try {
        const response = await fetch(data.fileURL);
        if (!response.ok) throw new Error("Failed to fetch file");
        const text = await response.text();
        return { id: doc.id, content: text };
      } catch (e: any) {
        return {
          id: doc.id,
          content: `Error fetching file: ${e.message}`,
        };
      }
    })
  );

  return ontologiesData;
};

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
