// Full permission editing UI will now be included in step 1
// Replacing the placeholder with full implementation

// Due to message length limits, I'm splitting it into chunks.
// This update sets up the final step with proper controls.

// Next step will add the full permission section inside `step === 1`

import styles from "../../css/CreateRequest.module.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

import {
  getFeatureDropdownValue,
  getAttributeDropdownValue,
  getOperandDropdownValue,
  fetchOntologies,
  Ontology,
  Option,
} from "../../helperFunctions/RequestDropdowns";

import { usePermissions } from "../../helperFunctions/PermissionsUtils";

function EditDraftRequest() {
  const navigate = useNavigate();
  const { requestId } = useParams();

  const [step, setStep] = useState(0);
  const stepTitles = ["Ontologies Selection", "Permissions", "Review & Submit"];

  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [selectedOntologies, setSelectedOntologies] = useState<Ontology[]>([]);
  const [formData, setFormData] = useState({ requestName: "" });
  const [actionOptions, setActionOptions] = useState<Option[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    permissions,
    setPermissions,
    addPermission,
    removePermission,
    addDatasetRefinement,
    addPurposeRefinement,
    addActionRefinement,
    addConstraintRefinement,
    removeDatasetRefinement,
    removePurposeRefinement,
    removeActionRefinement,
    removeConstraintRefinement,
    updateDataset,
    updateDatasetRefinement,
    updateAction,
    updatePurpose,
    updateActionRefinement,
    updatePurposeRefinement,
    updateConstraintsRefinement,
  } = usePermissions();

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const loadOntologies = async () => {
      try {
        const data = await fetchOntologies();
        setOntologies(data);
      } catch (err) {
        console.error("Error loading ontologies", err);
      }
    };
    loadOntologies();
  }, []);

  useEffect(() => {
    const loadDropdownValues = async () => {
      const actions = await getFeatureDropdownValue(
        selectedOntologies,
        "action"
      );
      const purposes = await getFeatureDropdownValue(
        selectedOntologies,
        "purpose"
      );
      setActionOptions(actions);
      setPurposeOptions(purposes);
    };
    loadDropdownValues();
  }, [selectedOntologies]);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const docRef = doc(db, "requests", requestId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({ requestName: data.requestName || "" });
          setSelectedOntologies(data.selectedOntologies || []);
          setPermissions(data.permissions || []);
        }
      } catch (err) {
        console.error("Failed to load request:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "requests", requestId!), {
        ...formData,
        selectedOntologies,
        permissions,
        updatedAt: new Date().toISOString(),
      });
      navigate("/requesterBase/requesterRequests");
    } catch (err) {
      console.error("Error updating request:", err);
      alert("Error updating request");
    }
  };

  if (loading) return <div>Loading...</div>;

  const allFieldsFilled = permissions.every(
    (p) => p.dataset.trim() && p.action.trim() && p.purpose.trim()
  );

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <Link
        to="/requesterBase/requesterRequests"
        className="text-decoration-none"
      >
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
      </Link>

      <h3 className="mt-4">Edit Request</h3>
      <p>Update your request details below.</p>
      <hr />

      <form onSubmit={handleSubmit}>
        {step === 0 && (
          <>
            <div className="mb-3">
              <label className={`${styles.formLabel} form-label`}>
                Request name
              </label>
              <input
                name="requestName"
                value={formData.requestName}
                type="text"
                className={`${styles.formInput} form-control`}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className={`${styles.formLabel} form-label`}>
                Ontologies
              </label>
              <select
                className={`${styles.formInput} form-select`}
                size={5}
                defaultValue=""
                onDoubleClick={(e) => {
                  const selected = ontologies.find(
                    (o) => o.id === e.currentTarget.value
                  );
                  if (
                    selected &&
                    !selectedOntologies.find((o) => o.id === selected.id)
                  ) {
                    setSelectedOntologies([...selectedOntologies, selected]);
                  }
                }}
              >
                <option value="" disabled>
                  Double-click to select
                </option>
                {ontologies
                  .filter(
                    (ontology) =>
                      !selectedOntologies.some((o) => o.id === ontology.id)
                  )
                  .map(({ id, name }) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
              </select>

              <div style={{ marginTop: "1rem" }}>
                {selectedOntologies.map(({ id, name }) =>
                  id === "default" ? (
                    <span
                      key={id}
                      className="border px-2 py-1 me-2 bg-light text-muted"
                      style={{ cursor: "not-allowed" }}
                      title="Default ontology cannot be removed"
                    >
                      {name}
                    </span>
                  ) : (
                    <span
                      key={id}
                      className="border px-2 py-1 me-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setSelectedOntologies(
                          selectedOntologies.filter((o) => o.id !== id)
                        )
                      }
                    >
                      {name} <span>&times;</span>
                    </span>
                  )
                )}
              </div>
            </div>

            <button
              type="button"
              className={`${styles.primaryButton} btn mt-3 w-20`}
              onClick={nextStep}
              disabled={!formData.requestName.trim()}
            >
              Next
            </button>
          </>
        )}

        {step === 1 && (
          <>
            {permissions.map((permission, index) => (
              <div key={permission.id} className="mb-3 mt-4">
                <div className="border p-4">
                  <div className="d-flex mb-2">
                    <div className="me-auto">
                      <h5>Permission {index + 1}</h5>
                    </div>
                    <div>
                      {permission.id !== permissions[0].id && (
                        <a
                          href="#"
                          className="text-danger text-decoration-none"
                          onClick={() => removePermission(permission.id)}
                        >
                          Delete permission
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className={`${styles.formLabel} form-label`}>
                      Dataset
                    </label>
                    <input
                      type="text"
                      className={`${styles.formInput} form-control`}
                      value={permission.dataset}
                      onChange={(e) =>
                        updateDataset(permission.id, e.target.value)
                      }
                      placeholder="Dataset URL"
                      required
                    />
                  </div>

                  {permission.datasetRefinements.map((ref) => (
                    <div className="row mt-2 mb-3" key={ref.id}>
                      <div className="d-flex mb-3 mt-3">
                        <h6 className="me-auto">Dataset Refinement</h6>
                        <i
                          className="fa-solid fa-trash"
                          onClick={() =>
                            removeDatasetRefinement(permission.id, ref.id)
                          }
                          style={{ cursor: "pointer" }}
                        ></i>
                      </div>
                      <div className="col">
                        <label className={`${styles.formLabel} form-label`}>
                          Attribute
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={ref.attribute || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              ref.id,
                              "attribute",
                              e.target.value
                            )
                          }
                        >
                          {getAttributeDropdownValue().map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <label className={`${styles.formLabel} form-label`}>
                          Instance
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={ref.instance || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              ref.id,
                              "instance",
                              e.target.value
                            )
                          }
                        >
                          {getOperandDropdownValue().map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <label className={`${styles.formLabel} form-label`}>
                          Value
                        </label>
                        <input
                          type="text"
                          className={`${styles.formInput} form-control`}
                          value={ref.value || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              ref.id,
                              "value",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className={`${styles.secondaryButton} btn btn-sm mt-3`}
                    onClick={() => addDatasetRefinement(permission.id)}
                    disabled={!permission.dataset}
                  >
                    Add dataset refinement
                  </button>

                  <div className="row mt-4">
                    <div className="col">
                      <label className={`${styles.formLabel} form-label`}>
                        Action
                      </label>
                      <select
                        className={`${styles.formInput} form-select`}
                        value={permission.action}
                        onChange={(e) =>
                          updateAction(permission.id, e.target.value)
                        }
                      >
                        {actionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {permission.actionRefinements.map((ref) => (
                        <div className="row mt-2 mb-3" key={ref.id}>
                          <div className="d-flex mb-3 mt-3">
                            <h6 className="me-auto">Action Refinement</h6>
                            <i
                              className="fa-solid fa-trash"
                              onClick={() =>
                                removeActionRefinement(permission.id, ref.id)
                              }
                              style={{ cursor: "pointer" }}
                            ></i>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              Attribute
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={ref.attribute || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  ref.id,
                                  "attribute",
                                  e.target.value
                                )
                              }
                            >
                              {getAttributeDropdownValue().map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              Instance
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={ref.instance || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  ref.id,
                                  "instance",
                                  e.target.value
                                )
                              }
                            >
                              {getOperandDropdownValue().map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              Value
                            </label>
                            <input
                              className={`${styles.formInput} form-control`}
                              type="text"
                              value={ref.value || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  ref.id,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addActionRefinement(permission.id)}
                        className={`${styles.secondaryButton} btn btn-sm mt-3`}
                        disabled={!permission.action}
                      >
                        Add action refinement
                      </button>
                    </div>

                    <div className="col">
                      <label className={`${styles.formLabel} form-label`}>
                        Purpose
                      </label>
                      <select
                        className={`${styles.formInput} form-select`}
                        value={permission.purpose}
                        onChange={(e) =>
                          updatePurpose(permission.id, e.target.value)
                        }
                      >
                        {purposeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {permission.purposeRefinements.map((ref) => (
                        <div className="row mt-2 mb-3" key={ref.id}>
                          <div className="d-flex mb-3 mt-3">
                            <h6 className="me-auto">Purpose Refinement</h6>
                            <i
                              className="fa-solid fa-trash"
                              onClick={() =>
                                removePurposeRefinement(permission.id, ref.id)
                              }
                              style={{ cursor: "pointer" }}
                            ></i>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              Attribute
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={ref.attribute || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  ref.id,
                                  "attribute",
                                  e.target.value
                                )
                              }
                            >
                              {getAttributeDropdownValue().map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              Instance
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={ref.instance || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  ref.id,
                                  "instance",
                                  e.target.value
                                )
                              }
                            >
                              {getOperandDropdownValue().map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              Value
                            </label>
                            <input
                              className={`${styles.formInput} form-control`}
                              type="text"
                              value={ref.value || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  ref.id,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addPurposeRefinement(permission.id)}
                        className={`${styles.secondaryButton} btn btn-sm mt-3`}
                        disabled={!permission.purpose}
                      >
                        Add purpose refinement
                      </button>
                    </div>
                  </div>

                  {permission.constraintRefinements.map((ref) => (
                    <div className="row mt-3 mb-3" key={ref.id}>
                      <div className="d-flex mb-3 mt-3">
                        <h6 className="me-auto">Constraint</h6>
                        <i
                          className="fa-solid fa-trash"
                          onClick={() =>
                            removeConstraintRefinement(permission.id, ref.id)
                          }
                          style={{ cursor: "pointer" }}
                        ></i>
                      </div>
                      <div className="col">
                        <label className={`${styles.formLabel} form-label`}>
                          Attribute
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={ref.attribute || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              ref.id,
                              "attribute",
                              e.target.value
                            )
                          }
                        >
                          {getAttributeDropdownValue().map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <label className={`${styles.formLabel} form-label`}>
                          Instance
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={ref.instance || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              ref.id,
                              "instance",
                              e.target.value
                            )
                          }
                        >
                          {getOperandDropdownValue().map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <label className={`${styles.formLabel} form-label`}>
                          Value
                        </label>
                        <input
                          className={`${styles.formInput} form-control`}
                          type="text"
                          value={ref.value || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              ref.id,
                              "value",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addConstraintRefinement(permission.id)}
                    className={`${styles.dashedButton} btn btn-sm w-100 mt-4`}
                  >
                    Add constraint
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPermission}
              className={`${styles.secondaryButton} btn w-100`}
            >
              Add Permission
            </button>

            <button
              type="button"
              className={`${styles.secondaryButton} btn mt-3 w-20`}
              onClick={prevStep}
            >
              Previous
            </button>
            <button
              type="button"
              className={`${styles.primaryButton} btn mt-3 w-20 ms-2`}
              onClick={nextStep}
              disabled={!allFieldsFilled}
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-muted mt-4">
              Before you update your request, ensure all values are accurate.
              Incorrect information may cause rejection by the data owner.
            </p>
            <button
              type="button"
              className={`${styles.secondaryButton} btn mt-3 w-20`}
              onClick={prevStep}
            >
              Previous
            </button>
            <button
              className={`${styles.primaryButton} btn mt-3 w-20 ms-2`}
              type="submit"
            >
              Update Request
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default EditDraftRequest;
