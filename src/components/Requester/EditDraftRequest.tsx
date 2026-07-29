// Full permission editing UI will now be included in step 1
// Replacing the placeholder with full implementation

// Due to message length limits, I'm splitting it into chunks.
// This update sets up the final step with proper controls.

// Next step will add the full permission section inside `step === 1`

import styles from "../../css/CreateRequest.module.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getRequest, updateRequest } from "../../services/api";
import { useAuth } from "../../AuthContext";

import {
  getFeatureDropdownValue,
  getAttributeDropdownValue,
  getOperandDropdownValue,
  fetchOntologies,
  Ontology,
  Option,
} from "../../helperFunctions/RequestDropdowns";

import { usePermissions } from "../../helperFunctions/PermissionsUtils";
import { useTranslation } from "react-i18next";

function EditDraftRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requestId } = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(0);
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);
  const stepTitles = [t("ontologies_selection"), t("permissions"), t("review_and_submit")];

  // const stepTitles = ["Ontologies Selection", "Permissions", "Review & Submit"];

  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [selectedOntologies, setSelectedOntologies] = useState<Ontology[]>([]);
  
  const [, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ requestName: "", extraText: "", emailText: "" });
  
  const [actionOptions, setActionOptions] = useState<Option[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<Option[]>([]);

  const [actionRefinementsOptions, setActionRefinementsOptions] = useState<Option[]>([]);
  const [purposeRefinementsOptions, setPurposeRefinementsOptions] = useState<Option[]>([]);
  const [datasetRefinementsOptions, setDatasetRefinementsOptions] = useState<Option[]>([]);
  const [generalRefinementsOptions, setGeneralRefinementsOptions] = useState<Option[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    console.log("Loading request.")
    const loadRequest = async () => {
      try {
        const result = await getRequest(requestId!);
        if (result.success) {
          const data = result.data;
          setFormData({ 
            requestName: data.requestName || "",
            extraText: data.extraText || "",
            emailText: data.emailText || "",
           });
          const ontologyDocs = ontologies.filter((ontology: any)=>{
            return data.selectedOntologies.some((setOntology: any) => setOntology._id === ontology._id );
          });
          setSelectedOntologies(ontologyDocs || []);
          setPermissions(data.permissions || []);
        }
      } catch (err) {
        console.error("Failed to load request:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [requestId, ontologies]);

  useEffect(() => {
    const loadOntologies = async () => {
      if (!user) {
        setError("User not authenticated");
        return;
      }

      try {
        const data = await fetchOntologies(user.uid);
        setOntologies(data);

        const defaultOntology = data.find((o) => o._id === "default");
        if (defaultOntology) {
          setSelectedOntologies([defaultOntology]);
        }
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      }
    };

    loadOntologies();
  }, [user]); // Depend on user to reload when auth state changes


  useEffect(() => {
    console.log("Loading actions and purposes for ontologies.");
    const loadDropdownValues = async () => {
      const actions = await getFeatureDropdownValue(
        selectedOntologies,
        "action"
      );
      const purposes = await getFeatureDropdownValue(
        selectedOntologies,
        "purpose"
      );
      // NOTE: Currently, we load all left operands for all refinements. In the future, we might want to retrieve left operands that are valid with respect to the current ODRL element.
      const actionRefinements = await getAttributeDropdownValue(selectedOntologies);
      const purposeRefinements = actionRefinements;
      const datasetRefinements = actionRefinements;
      const generalRefinements = actionRefinements;

      setActionOptions(actions);
      setPurposeOptions(purposes);
      setActionRefinementsOptions(actionRefinements);
      setPurposeRefinementsOptions(purposeRefinements);
      setDatasetRefinementsOptions(datasetRefinements);
      setGeneralRefinementsOptions(generalRefinements);
    };

    loadDropdownValues();
  }, [selectedOntologies]);

  const handleDoubleClick = (id: string) => {
    const existing = selectedOntologies.find((o) => o._id === id);
    if (existing) return;
    const ontology = ontologies.find((o) => o._id === id);
    if (ontology) {
      setSelectedOntologies([...selectedOntologies, ontology]);
    }
  };

  const removeOntology = (id: string) => {
    setSelectedOntologies(selectedOntologies.filter((o) => o._id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await updateRequest(requestId!, {
        ...formData,
        selectedOntologies,
        permissions,
        updatedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        navigate("/requesterBase/requesterRequests");
      } else {
        alert("Error updating request");
      }
    } catch (err) {
      console.error("Error updating request:", err);
      alert("Error updating request");
    }
  };

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

      <h3 className="mt-4">{t("edit_request")[0] + t("edit_request").slice(1).toLowerCase()}</h3>
      <p>{t("update_request_details")}</p>
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
        {step === 0 && (
          <>
            <div className="mb-3">
              <label className={`${styles.formLabel} form-label`}>
                {t("request_name")}
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
                {t("additional_terms")} ({t("optional")})
              </label>
              <textarea
                name="extraText"
                value={formData.extraText}
                className={`${styles.formInput} form-control`}
                id="extraText"
                onChange={handleChange}
                rows={4}
                placeholder={t("additional_terms_placeholder")}
              />
            </div>
            <div className="mb-3">
              <label className={`${styles.formLabel} form-label`}>
                {t("email_text")} ({t("optional")})
              </label>
              <textarea
                name="emailText"
                value={formData.emailText}
                className={`${styles.formInput} form-control`}
                id="emailText"
                onChange={handleChange}
                rows={4}
                placeholder={t("email_text_placeholder")}
              />
            </div>
            <div className="mb-3">
              <label className={`${styles.formLabel} form-label`}>
                {t("ontologies")}
              </label>
              <select
                className={`${styles.formInput} form-select`}
                size={5}
                aria-label="Ontology select"
                onDoubleClick={(e) => handleDoubleClick(e.currentTarget.value)}
                disabled={ontologies.length === 0}
              >
                {ontologies.length === 0 ? (
                  <option disabled>{t("loading_ontologies")}</option>
                ) : (
                  <>
                    <option className="mb-2" disabled selected>
                      {t("double_click_to_select")}
                    </option>
                    {ontologies
                      .filter((ontology) => ontology._id !== "default")
                      .map(({ _id, name }) => (
                        <option key={_id} value={_id}>
                          {name}
                        </option>
                      ))}
                  </>
                )}
              </select>

              <div style={{ marginTop: "1rem" }}>
                {selectedOntologies.map(({ _id, name }) =>
                  _id === "default" ? (
                    <span
                      key={_id}
                      className="border px-2 py-1 me-2 bg-light text-muted"
                      style={{ cursor: "not-allowed" }}
                      title="Default ontology cannot be removed"
                    >
                      {name}
                    </span>
                  ) : (
                    <span
                      key={_id}
                      className="border px-2 py-1 me-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => removeOntology(_id)}
                    >
                      {name} <span style={{ marginLeft: 5 }}>&times;</span>
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="alert alert-warning mt-3" role="alert">
              {t("selected_ontologies_text_1")}{" "}
              <Link
                to="/requesterBase/ontologies"
                className="text-decoration-underline"
              >
                {t("selected_ontologies_text_2")}
              </Link>{" "}
              {t("selected_ontologies_text_3")}
            </div>

            <button
              type="button"
              className={`${styles.primaryButton} btn mt-3 w-20`}
              onClick={nextStep}
              disabled={!formData.requestName.trim()}
            >
              {t("next")}
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
                      <h5>{t("permission")} {index + 1}</h5>
                    </div>
                    <div>
                      {permission.id !== permissions[0].id && (
                        <a
                          href="#"
                          className="text-danger text-decoration-none"
                          onClick={() => removePermission(permission.id)}
                        >
                          {t("delete_permission")}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className={`${styles.formLabel} form-label`}>
                      {t("dataset")}
                    </label>
                    <input
                      type="text"
                      className={`${styles.formInput} form-control`}
                      value={permission.dataset}
                      onChange={(e) =>
                        updateDataset(permission.id, e.target.value)
                      }
                      placeholder={t("dataset_url")}
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
                          {t("left_operand")}
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={ref.leftOperand || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              ref.id,
                              "leftOperand",
                              e.target.value
                            )
                          }
                        >
                          {datasetRefinementsOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <label className={`${styles.formLabel} form-label`}>
                          {t("operator")}
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={ref.operator || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              ref.id,
                              "operator",
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
                          {t("right_operand")}
                        </label>
                        <input
                          type="text"
                          className={`${styles.formInput} form-control`}
                          value={ref.rightOperand || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              ref.id,
                              "rightOperand",
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
                    {t("add_dataset_refinement")}
                  </button>

                  <div className="row mt-4">
                    <div className="col">
                      <label className={`${styles.formLabel} form-label`}>
                        {t("action")}
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
                              {t("left_operand")}
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={ref.leftOperand || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  ref.id,
                                  "leftOperand",
                                  e.target.value
                                )
                              }
                            >
                              {actionRefinementsOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              {t("operator")}
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={ref.operator || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  ref.id,
                                  "operator",
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
                              {t("right_operand")}
                            </label>
                            <input
                              className={`${styles.formInput} form-control`}
                              type="text"
                              value={ref.rightOperand || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  ref.id,
                                  "rightOperand",
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
                        {t("add_action_refinement")}
                      </button>
                    </div>

                    <div className="col">
                      <label className={`${styles.formLabel} form-label`}>
                        {t("purpose")}
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
                              {t("left_operand")}
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={ref.leftOperand || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  ref.id,
                                  "leftOperand",
                                  e.target.value
                                )
                              }
                            >
                              {purposeRefinementsOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              {t("operator")}
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={ref.operator || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  ref.id,
                                  "operator",
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
                              {t("right_operand")}
                            </label>
                            <input
                              className={`${styles.formInput} form-control`}
                              type="text"
                              value={ref.rightOperand || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  ref.id,
                                  "rightOperand",
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
                        {t("add_purpose_refinement")}
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
                          {t("left_operand")}
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={ref.leftOperand || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              ref.id,
                              "leftOperand",
                              e.target.value
                            )
                          }
                        >
                          {generalRefinementsOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <label className={`${styles.formLabel} form-label`}>
                          {t("operator")}
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={ref.operator || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              ref.id,
                              "operator",
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
                          {t("right_operand")}
                        </label>
                        <input
                          className={`${styles.formInput} form-control`}
                          type="text"
                          value={ref.rightOperand || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              ref.id,
                              "rightOperand",
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
                    {t("add_constraint")}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPermission}
              className={`${styles.secondaryButton} btn w-100`}
            >
              {t("add_permission")}
            </button>

            <button
              type="button"
              className={`${styles.secondaryButton} btn mt-3 w-20`}
              onClick={prevStep}
            >
              {t("previous")}
            </button>
            <button
              type="button"
              className={`${styles.primaryButton} btn mt-3 w-20 ms-2`}
              onClick={nextStep}
              disabled={!allFieldsFilled}
            >
              {t("next")}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-muted mt-4">
              {t("update_request_text_1")}
            </p>
            <button
              type="button"
              className={`${styles.secondaryButton} btn mt-3 w-20`}
              onClick={prevStep}
            >
              {t("previous")}
            </button>
            <button
              className={`${styles.primaryButton} btn mt-3 w-20 ms-2`}
              type="submit"
            >
              {t("update_request")}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default EditDraftRequest;
