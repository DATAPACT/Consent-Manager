import * as $rdf from "rdflib";
import { getFirestore, getDoc, doc } from "firebase/firestore";
import { auth } from "../firebase";

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
  const currentUser = auth.currentUser;

  if (!currentUser) throw new Error("User not authenticated");

  // Fetch the requester's document
  const requesterRef = doc(db, "requesters", currentUser.uid);
  const requesterSnap = await getDoc(requesterRef);

  if (!requesterSnap.exists()) throw new Error("Requester document not found");

  const requesterData = requesterSnap.data();
  const ontologyIds: string[] = requesterData.ontologies || [];

  if (ontologyIds.length === 0) return [];

  // Fetch only the ontologies the user belongs to
  const ontologyDocs = await Promise.all(
    ontologyIds.map(async (id) => {
      const ontDocRef = doc(db, "ontologies", id);
      const ontSnap = await getDoc(ontDocRef);
      if (!ontSnap.exists()) return null;

      const data = ontSnap.data();
      const name = data.name || id;

      if (!data.fileURL) {
        return { id, name, content: "No fileURL found" };
      }

      try {
        const response = await fetch(data.fileURL);
        if (!response.ok) throw new Error("Failed to fetch file");
        const text = await response.text();
        return { id, name, content: text };
      } catch (e: any) {
        return {
          id,
          name,
          content: `Error fetching file: ${e.message}`,
        };
      }
    })
  );

  return ontologyDocs.filter(Boolean) as Ontology[];
};

// dropdown options of the custom ontologies
// the default ontology is always fetched by default
export const getFeatureDropdownValue = async (
  ontologies: Ontology[],
  type: "action" | "purpose"
): Promise<Option[]> => {
  const result: Option[] = [];

  for (const ontology of ontologies) {
    if (type === "action") {
      result.push({ value: ontology.id, label: `${ontology.name} (Action)` });
    } else if (type === "purpose") {
      result.push({ value: ontology.id, label: `${ontology.name} (Purpose)` });
    }
  }

  return result;
};

// export const getFeatureDropdownValue = async (
//   ontologies: Ontology[],
//   type: "action" | "purpose"
// ): Promise<Option[]> => {
//   const store = $rdf.graph();

//   for (const ontology of ontologies) {
//     try {
//       $rdf.parse(
//         ontology.content,
//         store,
//         "http://example.org/base#",
//         "text/turtle"
//       );
//     } catch (e) {
//       console.error("Failed to parse ontology:", e);
//     }
//   }

//   const literals = new Set<string>();
//   store.statements.forEach((st) => {
//     if (st.object.termType === "Literal") {
//       const value = st.object.value.toLowerCase();
//       if (value.startsWith("a")) {
//         literals.add(st.object.value);
//       }
//     }
//   });

//   const words = Array.from(literals);

//   if (type === "action") {
//     return words.map((word, index) => ({
//       value: `action-${index}`,
//       label: word,
//     }));
//   }

//   if (type === "purpose") {
//     return words.map((word, index) => ({
//       value: `purpose-${index}`,
//       label: word,
//     }));
//   }

//   return [];
// };

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
