import { getOntologies } from "../services/api";
import * as rdflib from "rdflib";

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
          //const response = await fetch(downloadURL);
          const response = await fetch(downloadURL, {
            mode: 'cors',
            headers: {
              'Access-Control-Allow-Origin':'*'
            }
          });
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

export const getFeatureDropdownValue = async (
  ontologies: Ontology[],
  type: "action" | "purpose"
): Promise<Option[]> => {
  const store = rdflib.graph();

  for (const ontology of ontologies) {
      const textStream = ontology.content;
      const rdf_formats = ["text/turtle", "text/n3", "application/rdf+xml", "application/ld+json", "application/n-quads", "application/n-triples",  "application/xml", "application/json"];

      let success = false;
      for (let mimetype of rdf_formats) {
        try{
          rdflib.parse(textStream, store, "http://example.org/base#", mimetype);
          success = true
          break;
        }
        catch (e){
          console.log("Tried: ", mimetype);
          continue;
        }
      }
      if (!success) {
        console.error("Failed to parse ontology:", ontology.name);
      } 
  }

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
    return ans.map((binding) => ({
      value: binding['?variable'].value,
      label: binding['?value'].value,
    }));
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
    return ans.map((binding) => ({
      value: binding['?variable'].value,
      label: binding['?value'].value,
    }));
  }

  return [];
};

export const getAttributeDropdownValue = async (
  ontologies: Ontology[],
): Promise<Option[]> => {
  const store = rdflib.graph();

  for (const ontology of ontologies) {
      const textStream = ontology.content;
      const rdf_formats = ["text/turtle", "text/n3", "application/rdf+xml", "application/ld+json", "application/n-quads", "application/n-triples",  "application/xml", "application/json"];

      let success = false;
      for (let mimetype of rdf_formats) {
        try{
          rdflib.parse(textStream, store, "http://example.org/base#", mimetype);
          success = true
          break;
        }
        catch (e){
          console.log("Tried: ", mimetype);
          continue;
        }
      }
      if (!success) {
        console.error("Failed to parse ontology:", ontology.name);
      } 
  }
  const sparql_left_operands_query = `
    SELECT ?value 
    WHERE {
    ?variable <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/odrl/2/LeftOperand> . 
    ?variable <http://www.w3.org/2000/01/rdf-schema#label> ?value . }`;
    const query = rdflib.SPARQLToQuery(sparql_left_operands_query, false, store);
    //@ts-ignore
    let ans = store.querySync(query);
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

export const getOperandDropdownValue = (): Option[] => {
  return [
    { value: "", label: "Choose an operator" },
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
