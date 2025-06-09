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
// export const getFeatureDropdownValue = (
//   ontology: Ontology,
//   type: "action" | "purpose"
// ): Option[] => {
//   if (type === "action") {
//     return [{ value: ontology.id, label: `${ontology.name} (Action)` }];
//   }

//   if (type === "purpose") {
//     return [{ value: ontology.id, label: `${ontology.name} (Purpose)` }];
//   }

//   return [];
// };

export const getFeatureDropdownValue = async (
  ontologies: Ontology[],
  type: "action" | "purpose"
): Promise<Option[]> => {
  const store = $rdf.graph();

  const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
  const RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");

  for (const ontology of ontologies) {
    try {
      $rdf.parse(
        ontology.content,
        store,
        "http://example.org/base#", // base URI for parsing
        "text/turtle"
      );
    } catch (e) {
      console.error("Failed to parse ontology:", e);
    }
  }

  const labels = new Set<string>();

  // Loop through all statements to find entities of type Action or Purpose
  store.statements.forEach((st) => {
    if (
      st.predicate.equals(RDF("type")) &&
      st.object.value.toLowerCase().includes(type)
    ) {
      const subject = st.subject;
      const labelStatements = store.match(subject, RDFS("label"), null);
      labelStatements.forEach((lblSt) => {
        if (lblSt.object.termType === "Literal") {
          labels.add(lblSt.object.value);
        }
      });
    }
  });

  return Array.from(labels).map((label, index) => ({
    value: `${type}-${index}`,
    label,
  }));
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
