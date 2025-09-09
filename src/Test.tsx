import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
