import styles from "../../css/CreateRequest.module.css";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useState, useEffect } from "react";

import { addRequest } from "../../helperFunctions/AddRequest";
import { useAuth } from "../../AuthContext";

// dropdowns
import {
  getFeatureDropdownValue,
  getAttributeDropdownValue,
  getOperandDropdownValue,
  fetchOntologies,
  Ontology,
  Option,
  loadGraph,
} from "../../helperFunctions/RequestDropdowns";

// permissions utils
import { usePermissions } from "../../helperFunctions/PermissionsUtils";
import { renderPermissionsPreview } from "../../utils/renderPermissions";
import { useTranslation } from "react-i18next";

function CreateRequest() {
  const navigate = useNavigate(); // Initialize navigate
  const { t } = useTranslation();
  const { user } = useAuth();

  // steps
  const [step, setStep] = useState(0);
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);
  const stepTitles = [t("ontologies_selection"), t("permissions"), t("review_and_submit")];

  // ontologies
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [selectedOntologies, setSelectedOntologies] = useState<Ontology[]>([]);

  const [, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    requestName: "",
    extraText: "",
    emailText: "",
  });

  const [actionOptions, setActionOptions] = useState<Option[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<Option[]>([]);
  const [actionRefinementsOptions, setActionRefinementsOptions] = useState<Option[]>([]);
  const [purposeRefinementsOptions, setPurposeRefinementsOptions] = useState<Option[]>([]);
  const [datasetRefinementsOptions, setDatasetRefinementsOptions] = useState<Option[]>([]);
  const [generalRefinementsOptions, setGeneralRefinementsOptions] = useState<Option[]>([]);

  useEffect(() => {
    const loadOntologies = async () => {
      if (!user) {
        setError("User not authenticated");
        return;
      }

      try {
        const data = await fetchOntologies(user.uid);
        setOntologies(data);

        const defaultOntology = data.filter((o) => o.isDefault === true);
        if (defaultOntology) {
          setSelectedOntologies(defaultOntology);
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
      const store = await loadGraph(selectedOntologies);
      const actions = await getFeatureDropdownValue(
        store,
        "action"
      );
      const purposes = await getFeatureDropdownValue(
        store,
        "purpose"
      );
      // NOTE: Currently, we load all left operands for all refinements. In the future, we might want to retrieve left operands that are valid with respect to the current ODRL element.
      const actionRefinements = await getAttributeDropdownValue(store);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert(t("user_not_authenticated"));
      return;
    }

    const result = await addRequest({
      ...formData,
      selectedOntologies,
      permissions,
    }, user);
    
    if (result.success) {
      navigate("/requesterBase/RequesterRequests");
    } else {
      alert(t("error_creating_request"));
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
        <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;{t("back")}
      </Link>

      <h3 className="mt-4">{t("create_request")[0] + t("create_request").slice(1).toLowerCase()}</h3>
      <p>{t("create_new_request_text")}</p>

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
                {t("request_name")}
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
                  <option disabled>{t("loading_custom_ontologies")}</option>
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
                      className="border bg-light px-2 py-1 me-2 text-muted"
                      style={{ cursor: "not-allowed" }}
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
              {t("next")}
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
                      <h5>{t("permission")} {index + 1}</h5>
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
                      value={permission.dataset}
                      onChange={(e) =>
                        updateDataset(permission.id, e.target.value)
                      }
                      type="text"
                      className={`${styles.formInput} form-control`}
                      placeholder={t("dataset_url")}
                      required
                    />
                  </div>

                  {/* Dataset Refinements */}
                  {permission.datasetRefinements.map((item) => (
                    <div className="row mt-2 mb-3" key={item.id}>
                      <div className="d-flex mb-3 mt-3">
                        <h6 className="me-auto">{t("dataset_refinement")}</h6>
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
                          {t("left_operand")}
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={item.leftOperand || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              item.id,
                              "leftOperand",
                              e.target.value
                            )
                          }
                          required
                        >
                          {datasetRefinementsOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
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
                          value={item.operator || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              item.id,
                              "operator",
                              e.target.value
                            )
                          }
                          required
                        >
                          {getOperandDropdownValue(t).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
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
                          value={item.rightOperand || ""}
                          onChange={(e) =>
                            updateDatasetRefinement(
                              permission.id,
                              item.id,
                              "rightOperand",
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
                    {t("add_dataset_refinement")}
                  </button>

                  <div className="row mt-4">
                    <div className="col">
                      {/* Action Select */}
                      <div className="mb-3">
                        <label className={`${styles.formLabel} form-label`}>
                          {t("action")}
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
                          <option disabled selected> -- {t("select_an_action")} -- </option>
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
                            <h6 className="me-auto">{t("action_refinement")}</h6>
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
                              {t("left_operand")}
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={item.leftOperand || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  item.id,
                                  "leftOperand",
                                  e.target.value
                                )
                              }
                              required
                            >
                              {actionRefinementsOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
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
                              value={item.operator || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  item.id,
                                  "operator",
                                  e.target.value
                                )
                              }
                              required
                            >
                              {getOperandDropdownValue(t).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col">
                            <label className={`${styles.formLabel} form-label`}>
                              {t("right_operand")}
                            </label>
                            <input
                              value={item.rightOperand || ""}
                              onChange={(e) =>
                                updateActionRefinement(
                                  permission.id,
                                  item.id,
                                  "rightOperand",
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
                        {t("add_action_refinement")}
                      </button>
                    </div>

                    <div className="col">
                      {/* Purpose Select */}
                      <div className="mb-3">
                        <label className={`${styles.formLabel} form-label`}>
                          {t("purpose")}
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
                          <option disabled selected> -- {t("select_a_purpose")} -- </option>
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
                            <h6 className="me-auto">{t("purpose_refinement")}</h6>
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
                              {t("left_operand")}
                            </label>
                            <select
                              className={`${styles.formInput} form-select`}
                              value={item.leftOperand || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  item.id,
                                  "leftOperand",
                                  e.target.value
                                )
                              }
                              required
                            >
                              {purposeRefinementsOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
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
                              value={item.operator || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  item.id,
                                  "operator",
                                  e.target.value
                                )
                              }
                              required
                            >
                              {getOperandDropdownValue(t).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
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
                              value={item.rightOperand || ""}
                              onChange={(e) =>
                                updatePurposeRefinement(
                                  permission.id,
                                  item.id,
                                  "rightOperand",
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
                        {t("add_purpose_refinement")}
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
                          {t("left_operand")}
                        </label>
                        <select
                          className={`${styles.formInput} form-select`}
                          value={item.leftOperand || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              item.id,
                              "leftOperand",
                              e.target.value
                            )
                          }
                          required
                        >
                          {generalRefinementsOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
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
                          value={item.operator || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              item.id,
                              "operator",
                              e.target.value
                            )
                          }
                          required
                        >
                          {getOperandDropdownValue(t).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
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
                          value={item.rightOperand || ""}
                          onChange={(e) =>
                            updateConstraintsRefinement(
                              permission.id,
                              item.id,
                              "rightOperand",
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

        {/* Step 3 */}
        {step === 2 && (
          <>
            {renderPermissionsPreview({
              ...formData,
              selectedOntologies,
              permissions,
            }, t)}
            <p className="text-muted mt-4">
              {t("create_request_text_1")} <br />
              <br /> {t("create_request_text_2")}{" "}
              <a href="#">{t("guideline_section")}</a>.
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
              {t("create_request")}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default CreateRequest;
