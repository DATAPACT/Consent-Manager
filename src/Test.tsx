import React, { useEffect, useState } from "react";
import { getOntologies } from "./services/api";

type Ontology = {
  id: string;
  content: string;
};

const Test = () => {
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOntologies = async () => {
      try {
        // Fetch ontologies without specific user filter to get all ontologies
        const result = await getOntologies();
        
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch ontologies");
        }

        const ontologiesData = await Promise.all(
          result.ontologies.map(async (ontologyItem: any) => {
            const { id, downloadURL } = ontologyItem;
            if (!downloadURL) {
              return { id, content: "No download URL found" };
            }
            try {
              const response = await fetch(downloadURL);
              if (!response.ok) throw new Error("Failed to fetch file");
              const text = await response.text();
              return { id, content: text };
            } catch (e: any) {
              return {
                id,
                content: `Error fetching file: ${e.message}`,
              };
            }
          })
        );

        setOntologies(ontologiesData);
        if (ontologiesData.length > 0) {
          setSelectedId(ontologiesData[0].id); // select first by default
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchOntologies();
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(e.target.value);
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Select Ontology</h2>
      {ontologies.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <>
          <select value={selectedId} onChange={handleSelectChange}>
            {ontologies.map(({ id }) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>

          <div style={{ marginTop: "2rem" }}>
            <h3>Ontology Content (ID: {selectedId})</h3>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {ontologies.find((o) => o.id === selectedId)?.content ||
                "No content"}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default Test;
