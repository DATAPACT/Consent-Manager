import { getFirestore, collection, getDocs } from "firebase/firestore";

export interface Option {
  value: string;
  label: string;
}

export type Ontology = {
  id: string;
  name: string;
  content: string;
};

export const fetchOntologies = async (): Promise<Ontology[]> => {
  const db = getFirestore();
  const colRef = collection(db, "ontologies");
  const snapshot = await getDocs(colRef);

  const ontologiesData = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const name = data.name || doc.id; // fallback to ID if name is missing

      if (!data.fileURL) {
        return { id: doc.id, name, content: "No fileURL found" };
      }

      try {
        const response = await fetch(data.fileURL);
        if (!response.ok) throw new Error("Failed to fetch file");
        const text = await response.text();
        return { id: doc.id, name, content: text };
      } catch (e: any) {
        return {
          id: doc.id,
          name,
          content: `Error fetching file: ${e.message}`,
        };
      }
    })
  );

  return ontologiesData;
};

export const getFeatureDropdownValue = (
  ontology: Ontology,
  type: "action" | "purpose"
): Option[] => {
  if (type === "action") {
    const defaultOntologyOptions: Option[] = [
      { value: "", label: "Choose action" },
      { value: "read", label: "Read" },
      { value: "write", label: "Write" },
      { value: "delete", label: "Delete" },
    ];

    const ontologyOption: Option = {
      value: ontology.id,
      label: `${ontology.name} (Action)`,
    };

    return [...defaultOntologyOptions, ontologyOption];
  }

  if (type === "purpose") {
    const defaultOntologyOptions: Option[] = [
      { value: "", label: "Choose purpose" },
      { value: "marketing", label: "Marketing" },
      { value: "legal", label: "Legal" },
      { value: "logistics", label: "Logistics" },
    ];

    const ontologyOption: Option = {
      value: ontology.id,
      label: `${ontology.name} (Purpose)`,
    };

    return [...defaultOntologyOptions, ontologyOption];
  }

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
