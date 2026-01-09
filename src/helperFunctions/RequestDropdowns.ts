import { getOntologies } from "../services/api";

export interface Option {
  value: string;
  label: string;
}

export type Ontology = {
  id: string;
  name: string;
  content: string;
};

export const fetchOntologies = async (requesterUid?: string): Promise<Ontology[]> => {
  if (!requesterUid) throw new Error("User not authenticated");

  try {
    console.log("Fetching ontologies for user:", requesterUid);
    
    // Fetch ontologies for this requester via Express API
    const result = await getOntologies(requesterUid);
    
    console.log("API response:", result);
    
    if (!result.success) {
      throw new Error("Failed to fetch ontologies");
    }

    const ontologyData = result.ontologies || [];
    console.log("Ontology data:", ontologyData);

    if (ontologyData.length === 0) {
      console.log("No ontologies found for user");
      return [];
    }

    // Process ontologies and fetch their content
    const ontologyDocs = await Promise.all(
      ontologyData.map(async (ontologyItem: any) => {
        const { id, name, downloadURL } = ontologyItem;
        console.log(`Processing ontology ${id}: ${name}, URL: ${downloadURL}`);

        if (!downloadURL) {
          console.warn(`No download URL for ontology ${id}`);
          return { id, name, content: "No download URL found" };
        }

        try {
          console.log(`Fetching content from: ${downloadURL}`);
          const response = await fetch(downloadURL);
          if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
          const text = await response.text();
          console.log(`Successfully fetched content for ${id}, length: ${text.length}`);
          return { id, name, content: text };
        } catch (e: any) {
          console.error(`Error fetching content for ${id}:`, e);
          return {
            id,
            name,
            content: `Error fetching file: ${e.message}`,
          };
        }
      })
    );

    const filteredDocs = ontologyDocs.filter(Boolean) as Ontology[];
    console.log("Final processed ontologies:", filteredDocs);
    return filteredDocs;
  } catch (error) {
    console.error("Error in fetchOntologies:", error);
    throw error;
  }
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
