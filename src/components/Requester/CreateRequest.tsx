import styles from "../../css/CreateRequest.module.css";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useState, useEffect } from "react";

import { addRequest } from "../../helperFunctions/AddRequest";

// dropdowns
import {
  getFeatureDropdownValue,
  getAttributeDropdownValue,
  getOperandDropdownValue,
  fetchOntologies,
  Ontology,
  Option,
} from "../../helperFunctions/RequestDropdowns";

// permissions utils
import { usePermissions } from "../../helperFunctions/PermissionsUtils";

function CreateRequest() {
  const navigate = useNavigate(); // Initialize navigate

  // steps
  const [step, setStep] = useState(0);
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);
  const stepTitles = ["Ontologies Selection", "Permissions", "Review & Submit"];

  // onotlogies
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [selectedOntologies, setSelectedOntologies] = useState<Ontology[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    requestName: "",
  });

  const [actionOptions, setActionOptions] = useState<Option[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<Option[]>([]);

  useEffect(() => {
    const loadOntologies = async () => {
      try {
        const data = await fetchOntologies();
        setOntologies(data);

        const defaultOntology = data.find((o) => o.id === "default");
        if (defaultOntology) {
          setSelectedOntologies([defaultOntology]);
        }
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      }
    };

    loadOntologies();
  }, []); // Empty dependencies to run once initially

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

  const handleDoubleClick = (id: string) => {
    const existing = selectedOntologies.find((o) => o.id === id);
    if (existing) return;
    const ontology = ontologies.find((o) => o.id === id);
    if (ontology) {
      setSelectedOntologies([...selectedOntologies, ontology]);
    }
  };

  const removeOntology = (id: string) => {
    setSelectedOntologies(selectedOntologies.filter((o) => o.id !== id));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addRequest({
      ...formData,
      selectedOntologies,
      permissions,
    });
    if (result.success) {
      navigate("/requesterBase/RequesterRequests");
    } else {
      alert("Error creating request");
    }
  };

  const {
    permissions,
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

  const allFieldsFilled = permissions.every(
    (permission) =>
      permission.dataset.trim() !== "" &&
      permission.action.trim() !== "" &&
      permission.purpose.trim() !== ""
  );

  return (
    <div className={`${styles.dashboard} container w-50`}>
      <Link
        className="text-decoration-none"
        to="/requesterBase/requesterRequests"
        role="button"
      >
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
      </Link>

      <h3 className="mt-4">Create request</h3>
      <p>Create a new request by specifying the necessary details.</p>

      <hr />

      {/* progress bar with step titles */}
      <div className="mb-4">
        <div className="d-flex justify-content-between mb-1">
          {stepTitles.map((title, index) => (
            <div
              key={index}
              className="text-center flex-fill"
              style={{ fontSize: "0.875rem" }}
            >
              <div
                style={{
                  color: index <= step ? "#000" : "#ccc",
                  fontWeight: index === step ? "bold" : "normal",
                }}
              >
                {title}
              </div>
            </div>
          ))}
        </div>

        <div className="progress mt-3">
          <div
            className={`${styles.progressBar} progress-bar`}
            role="progressbar"
            style={{ width: `${((step + 1) / stepTitles.length) * 100}%` }}
            aria-valuenow={((step + 1) / stepTitles.length) * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {stepTitles[step]}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: name and ontologies */}
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
                id="requestName"
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
                aria-label="Ontology select"
                onDoubleClick={(e) => handleDoubleClick(e.currentTarget.value)}
                disabled={ontologies.length === 0}
              >
                {ontologies.length === 0 ? (
                  <option disabled>Loading custom ontologies...</option>
                ) : (
                  <>
                    <option className="mb-2" disabled selected>
                      Double-click to select
                    </option>
                    {ontologies
                      .filter((ontology) => ontology.id !== "default")
                      .map(({ id, name }) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                  </>
                )}
              </select>

              <div style={{ marginTop: "1rem" }}>
                {selectedOntologies.map(({ id, name }) =>
                  id === "default" ? (
                    <span
                      key={id}
                      className="border bg-light px-2 py-1 me-2 text-muted"
                      style={{ cursor: "not-allowed" }}
                    >
                      {name}
                    </span>
                  ) : (
                    <span
                      key={id}
                      className="border px-2 py-1 me-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => removeOntology(id)}
                    >
                      {name} <span style={{ marginLeft: 5 }}>&times;</span>
                    </span>
                  )
                )}
              </div>

              <div className="alert alert-warning mt-3" role="alert">
                Select one or more ontologies. If the ontology you're looking
                for isn't listed,{" "}
                <Link
                  to="/requesterBase/ontologies"
                  className="text-decoration-underline"
                >
                  go to the Ontologies page
                </Link>{" "}
                to upload it. The default ontology will always be used, even if
                you don't select any ontologies.
              </div>

              {/* <div style={{ marginTop: "2rem" }}>
            {selectedOntologies.map(({ id, content }) => (
              <div key={id} style={{ marginBottom: "1.5rem" }}>
                <h4>Ontology Content (ID: {id})</h4>
                <pre
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {content}
                </pre>
              </div>
            ))}
          </div> */}
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

        {/* Step 2: permissions */}
        {step === 1 && (
          <>
            {/* Render multiple permissions */}
            {permissions.map((permission, index) => (
              <div key={permission.id} className="mb-3 mt-4">
                <div className="border p-4">
                  <div className="d-flex mb-2">
                    <div className="me-auto">
                      <h5>Permission {index + 1}</h5>
                    </div>
                    <div>
                      {/* Remove permission button (disables for the first permission) */}
                      {permission.id !== permissions[0].id && (
                        <a
                          href="#"
                          className="text-danger text-decoration-none"
                          type="button"
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
                      value={permission.dataset}
                      onChange={(e) =>
                        updateDataset(permission.id, e.target.value)
                      }
                      type="text"
                      className={`${styles.formInput} form-control`}
                      placeholder="Dataset URL"
                      required
                    />
                  </div>

                  {/* Dataset Refinements */}
                  {permission.datasetRefinements.map((item) => (
                    <div className="row mt-2 mb-3" key={item.id}>
                      <div className="d-flex mb-3 mt-3">
                        <h6 className="me-auto">Dataset Refinement</h6>
                        <i
                          className="fa-solid fa-trash"
                          onClick={() =>
                            removeDatasetRefinement(permission.id, item.id)
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
                          value={item.attribute || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              item.id,
                              "attribute",
                              e.target.value
                            )
                          }
                          required
                        >
                          {getAttributeDropdownValue().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
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
                          value={item.instance || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              item.id,
                              "instance",
                              e.target.value
                            )
                          }
                          required
                        >
                          {getOperandDropdownValue().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
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
                          value={item.value || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              item.id,
                              "value",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addDatasetRefinement(permission.id)}
                    className={`${styles.secondaryButton} btn btn-sm mt-3`}
                    disabled={!permission.dataset} // Disable button if dataset URL is empty
                  >
                    Add dataset refinement
                  </button>

                  <div className="row mt-4">
                    <div className="col">
                      {/* Action Select */}
                      <div className="mb-3">
                        <label className={`${styles.formLabel} form-label`}>
                          Action
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          aria-label="Default select example"
                          value={permission.action}
                          onChange={(e) =>
                            updateAction(permission.id, e.target.value)
                          }
                          required
                        >
                          {/* Ontology-based options */}
                          {actionOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Refinements */}
                      {permission.actionRefinements.map((item) => (
                        <div className="row mt-2 mb-3" key={item.id}>
                          <div className="d-flex mb-3 mt-3">
                            <h6 className="me-auto">Action Refinement</h6>
                            <i
                              className="fa-solid fa-trash"
                              onClick={() =>
                                removeActionRefinement(permission.id, item.id)
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
                              value={item.attribute || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  item.id,
                                  "attribute",
                                  e.target.value
                                )
                              }
                              required
                            >
                              {getAttributeDropdownValue().map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
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
                              value={item.instance || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  item.id,
                                  "instance",
                                  e.target.value
                                )
                              }
                              required
                            >
                              {getOperandDropdownValue().map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              Value
                            </label>
                            <input
                              value={item.value || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  item.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              type="text"
                              className={`${styles.formInput} form-control`}
                              required
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addActionRefinement(permission.id)}
                        className={`${styles.secondaryButton} btn btn-sm mt-3`}
                        disabled={!permission.action} // Disable button if no action is selected
                      >
                        Add action refinement
                      </button>
                    </div>

                    <div className="col">
                      {/* Purpose Select */}
                      <div className="mb-3">
                        <label className={`${styles.formLabel} form-label`}>
                          Purpose
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          aria-label="Default select example"
                          value={permission.purpose}
                          onChange={(e) =>
                            updatePurpose(permission.id, e.target.value)
                          }
                          required
                        >
                          {/* Ontology-based options */}
                          {purposeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Purpose Refinements */}
                      {permission.purposeRefinements.map((item) => (
                        <div className="row mt-2 mb-3" key={item.id}>
                          <div className="d-flex mb-3 mt-3">
                            <h6 className="me-auto">Purpose Refinement</h6>
                            <i
                              className="fa-solid fa-trash"
                              onClick={() =>
                                removePurposeRefinement(permission.id, item.id)
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
                              value={item.attribute || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  item.id,
                                  "attribute",
                                  e.target.value
                                )
                              }
                              required
                            >
                              {getAttributeDropdownValue().map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
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
                              value={item.instance || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  item.id,
                                  "instance",
                                  e.target.value
                                )
                              }
                              required
                            >
                              {getOperandDropdownValue().map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
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
                              value={item.value || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  item.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addPurposeRefinement(permission.id)}
                        className={`${styles.secondaryButton} btn btn-sm mt-3`}
                        disabled={!permission.purpose} // Disable button if no action is selected
                      >
                        Add purpose refinement
                      </button>
                    </div>
                  </div>

                  {/* Constraints Refinements */}
                  {permission.constraintRefinements.map((item) => (
                    <div className="row mt-3 mb-3" key={item.id}>
                      <div className="d-flex mb-3 mt-3">
                        <h6 className="me-auto">Constraint</h6>
                        <i
                          className="fa-solid fa-trash"
                          onClick={() =>
                            removeConstraintRefinement(permission.id, item.id)
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
                          value={item.attribute || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              item.id,
                              "attribute",
                              e.target.value
                            )
                          }
                          required
                        >
                          {getAttributeDropdownValue().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
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
                          value={item.instance || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              item.id,
                              "instance",
                              e.target.value
                            )
                          }
                          required
                        >
                          {getOperandDropdownValue().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
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
                          value={item.value || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              item.id,
                              "value",
                              e.target.value
                            )
                          }
                          required
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

        {/* Step 3 */}
        {step === 2 && (
          <>
            <p className="text-muted mt-4">
              Bofore you create your request please make sure that all your
              permissions and refinements are correct. Wrong values can lead to
              rejection by the data owner. <br />
              <br /> If you're not sure please contact the data owner or see our{" "}
              <a href="#">Guidline seciton</a>.
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
              Create Request
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default CreateRequest;
