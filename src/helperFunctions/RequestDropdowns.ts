import { getOntologies } from "../services/api";
import * as rdflib from "rdflib";
import { TFunction } from "i18next";

export interface Option {
  value: string;
  label: string;
  selected?: boolean;
}

export type Ontology = {
  _id: string;
  name: string;
  content: string;
  isDefault: boolean;
};

export const fetchOntologies = async (requesterUid?: string): Promise<Ontology[]> => {
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
      ontologyData.map(async (ontologyItem: Ontology) => {
        const { _id, name, content, isDefault } = ontologyItem;
        console.log(`Processing ontology ${_id}: ${name}, URL: ${content}`);

        if (!content) {
          console.warn(`No content for ontology ${_id}`);
          return { _id, name, content: "No content found" };
        }

        return { _id, name, content, isDefault};
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
// export const getFeatureDropdownValue = async (
//   ontologies: Ontology[],
//   type: "action" | "purpose"
// ): Promise<Option[]> => {
//   const result: Option[] = [];

//   for (const ontology of ontologies) {
//     if (type === "action") {
//       result.push({ value: ontology.id, label: `${ontology.name} (Action)` });
//     } else if (type === "purpose") {
//       result.push({ value: ontology.id, label: `${ontology.name} (Purpose)` });
//     }
//   }

//   return result;
// };

export const loadGraph = async (ontologies: Ontology[]): Promise<rdflib.Store> => {
  const store = rdflib.graph();
  for (const ontology of ontologies) {
      const textStream = JSON.stringify(ontology.content); //This is now guaranteed to be in JSON-LD.
      try {
        await new Promise<void>((resolve, reject) => {
          rdflib.parse(
            textStream,
            store,
            "http://example.org/base#",
            "application/ld+json",
            (error) => {
              if (error) {
                reject(error);
                return;
              }
              console.log("Parsing successful:", ontology.name);
              resolve();
            }
          );
        });
      } catch (e) {
        console.error("Failed to parse ontology:", ontology.name, e);
      }
  }
  return store;
}

export const getFeatureDropdownValue = async (
  store: rdflib.Store,
  type: "action" | "purpose"
): Promise<Option[]> => {
  const language = localStorage.getItem("language") || "en"; 
  console.log("Language:", language);

  if (type === "action") {
    // NOTE: Currently, we can only retrieve actions that are explicitly odrl:Action or dpv:Processing.
    const sparql_action_query = `
    SELECT DISTINCT ?variable ?value 
    WHERE { ?variable <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/odrl/2/Action> . 
    ?variable <http://www.w3.org/2000/01/rdf-schema#label> ?value . }`;
    const sparql_action_query_2 = `
    SELECT DISTINCT ?variable ?value 
    WHERE { ?variable <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/dpv/owl#Processing> . 
    ?variable <http://www.w3.org/2000/01/rdf-schema#label> ?value . }`;
    const query = rdflib.SPARQLToQuery(sparql_action_query, false, store);
    const query2 = rdflib.SPARQLToQuery(sparql_action_query_2, false, store);
    //@ts-ignore
    let ans = store.querySync(query);
    //@ts-ignore
    let ans2 = store.querySync(query2);
    ans = ans.concat(ans2);
    ans = ans.filter((binding) => (binding['?value'].language === language));
    return ans.map((binding, index) => (
      index === 0 ?
      {
        value: binding['?variable'].value,
        label: binding['?value'].value,
        selected: true,
      } : 
      {
        value: binding['?variable'].value,
        label: binding['?value'].value,
      }
    ));
  }

  if (type === "purpose") {
    const sparql_purpose_query = `
    SELECT ?value 
    WHERE {
    ?variable <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/dpv/owl#Purpose> . 
    ?variable <http://www.w3.org/2000/01/rdf-schema#label> ?value . }`;
    const query = rdflib.SPARQLToQuery(sparql_purpose_query, false, store);
    //@ts-ignore
    let ans = store.querySync(query);
    ans = ans.filter((binding) => (binding['?value'].language === language));
    return ans.map((binding, index) => (
      index === 0 ?
      {
        value: binding['?variable'].value,
        label: binding['?value'].value,
        selected: true,
      } : 
      {
        value: binding['?variable'].value,
        label: binding['?value'].value,
      }
    ));
  }

  return [];
};

export const getAttributeDropdownValue = async (
  store: rdflib.Store,
): Promise<Option[]> => {
  const language = localStorage.getItem("language") || "en";
  const sparql_left_operands_query = `
    SELECT ?value 
    WHERE {
    ?variable <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/odrl/2/LeftOperand> . 
    ?variable <http://www.w3.org/2000/01/rdf-schema#label> ?value . }`;
    const query = rdflib.SPARQLToQuery(sparql_left_operands_query, false, store);
    //@ts-ignore
    let ans = store.querySync(query);
    ans = ans.filter((binding) => (binding['?value'].language === language));
    if (ans.length > 0) {
      return ans.map((binding) => ({
      value: binding['?variable'].value,
      label: binding['?value'].value,
    }));
    }
  return [
    { value: "", label: "Choose attribute" },
    { value: "comercial", label: "Comercial" },
    { value: "personal", label: "Personal" },
    { value: "development", label: "Development" },
  ];
};

export const getOperandDropdownValue = (language: TFunction): Option[] => {
  return [
    { value: "", label: language("choose_an_operator") },
    { value: "odrl:eq", label: language("equals") },
    { value: "odrl:gt", label: language("gt") },
    { value: "odrl:gteq", label: language("geq") },
    { value: "odrl:hasPart", label: language("hasPart") },
    { value: "odrl:isA", label: language("isA") },
    { value: "odrl:isAllOf", label: language("isAllOf") },
    { value: "odrl:isAnyOf", label: language("isAnyOf") },
    { value: "odrl:isNoneOf", label: language("isNoneOf") },
    { value: "odrl:isPartOf", label: language("isPartOf") },
    { value: "odrl:lt", label: language("lt") },
    { value: "odrl:lteq", label: language("leq") },
    { value: "odrl:neq", label: language("neq") },
  ];
};

