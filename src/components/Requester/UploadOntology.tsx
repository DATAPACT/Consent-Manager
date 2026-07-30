import styles from "../../css/Ontology.module.css";

// libraries
import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useAuth } from "../../AuthContext";
import { uploadOntology } from "../../services/api";
import { useTranslation } from "react-i18next";

const UploadOntology: React.FC = () => {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !file) {
      setError("Ontology name and file are required");
      return;
    }

    if (!user) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);

      const result = await uploadOntology({
        requesterUid: user.uid,
        ontologyName: name,
        ontologyDescription: "", // You can add a description field if needed
        ontologyFile: file
      });

      if (result.success) {
        setName("");
        setFile(null);
        setError("");
        alert(t("ontology_uploaded_successfully"));
        navigate("/requesterBase/Ontologies");
      } else {
        setError(result.error || "Error uploading ontology");
      }
    } catch (err: any) {
      setError(err.message || "Error uploading ontology");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <Link
        className="text-decoration-none"
        to="/requesterBase/Ontologies"
        role="button"
      >
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;{t("back")}
      </Link>

      <h3 className="mt-4">{t("upload_ontology")}</h3>
      <p>
        {t("upload_ontology_text_1")}
      </p>

      <hr />

      <form className="w-50" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className={`${styles.formLabel} form-label`}>
            {t("ontology_name")}
          </label>
          <input
            type="text"
            className={`${styles.formInput} form-control`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className={`${styles.formLabel} form-label`}>
            {t("ontology_file")}
          </label>
          <input
            type="file"
            accept=".rdf,.owl,.ttl,.xml,.jsonld,.json"
            className={`${styles.formInput} form-control`}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        <div className="mt-4">
          <button
            type="submit"
            className={`${styles.primaryButton} btn`}
            disabled={loading}
          >
            {loading ? `${t("uploading")}...` : t("upload_ontology")}
          </button>
        </div>
      </form>

      {error && <p className="text-danger mt-3">{error}</p>}

      <h5 className="mt-5">{t("uploading_an_ontology")}</h5>
      <p>
        {t("upload_ontology_text_2")}
      </p>

      <h5 className="mt-4">{t("what_happens_next")}</h5>
      <p>
        {t("upload_ontology_text_3")}
      </p>
    </div>
  );
};

export default UploadOntology;
