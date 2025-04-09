import styles from "../../css/CreateRequest.module.css";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useState } from "react";

import { addRequest } from "../../helperFunctions/AddRequest";

// dropdowns
import {
  getActionDropdownValue,
  getPurposeDropdownValue,
  getAttributeDropdownValue,
  getOperandDropdownValue,
  getAttributeLabel,
  getInstanceLabel,
} from "../../helperFunctions/RequestDropdowns";

// rules utils
import { useRules } from "../../helperFunctions/RulesUtils";

function CreateRequest() {
  const navigate = useNavigate(); // Initialize navigate
  const [formData, setFormData] = useState({
    requestName: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addRequest({ ...formData, rules });
    if (result.success) {
      navigate("/requesterBase/RequesterRequests");
    } else {
      alert("Error creating request");
    }
  };

  const {
    rules,
    addRule,
    removeRule,
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
  } = useRules();

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

      <form onSubmit={handleSubmit} className="w-50">
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

        {/* Render multiple rules */}
        {rules.map((rule, index) => (
          <div key={rule.id} className="mb-3 mt-4">
            <div className="border p-4">
              <div className="d-flex mb-2">
                <div className="me-auto">
                  <h5>Rule {index + 1}</h5>
                </div>
                <div>
                  {/* Remove rule button (disables for the first rule) */}
                  {rule.id !== rules[0].id && (
                    <a
                      href="#"
                      className="text-danger text-decoration-none"
                      type="button"
                      onClick={() => removeRule(rule.id)}
                    >
                      Delete rule
                    </a>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className={`${styles.formLabel} form-label`}>
                  Dataset
                </label>
                <input
                  value={rule.dataset}
                  onChange={(e) => updateDataset(rule.id, e.target.value)}
                  type="text"
                  className={`${styles.formInput} form-control`}
                  placeholder="Dataset URL"
                  required
                />
              </div>

              {/* Dataset Refinements */}
              {rule.datasetRefinements.map((item) => (
                <div className="row mt-2 mb-3" key={item.id}>
                  <div className="d-flex mb-3 mt-3">
                    <h6 className="me-auto">Dataset Refinement</h6>
                    <i
                      className="fa-solid fa-trash"
                      onClick={() => removeDatasetRefinement(rule.id, item.id)}
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
                      onChange={(e) => {
                        const Labelvalue = e.target.value;
                        const label = getAttributeLabel(Labelvalue);
                        updateDatasetRefinement(
                          rule.id,
                          item.id,
                          "value",
                          Labelvalue,
                          label
                        );
                      }}
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
                          rule.id,
                          item.id,
                          "instance",
                          e.target.value,
                          "label"
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
                          rule.id,
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
                onClick={() => addDatasetRefinement(rule.id)}
                className={`${styles.secondaryButton} btn btn-sm mt-3`}
              >
                Add dataset refinement
              </button>

              {/* Action Select */}
              <div className="mb-3 mt-4">
                <label className={`${styles.formLabel} form-label`}>
                  Action
                </label>
                <select
                  className={`${styles.formInput} form-select`}
                  aria-label="Default select example"
                  value={rule.action}
                  onChange={(e) => updateAction(rule.id, e.target.value)}
                  required
                >
                  {getActionDropdownValue().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Refinements */}
              {rule.actionRefinements.map((item) => (
                <div className="row mt-2 mb-3" key={item.id}>
                  <div className="d-flex mb-3 mt-3">
                    <h6 className="me-auto">Action Refinement</h6>
                    <i
                      className="fa-solid fa-trash"
                      onClick={() => removeActionRefinement(rule.id, item.id)}
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
                          rule.id,
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
                          rule.id,
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
                          rule.id,
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
                onClick={() => addActionRefinement(rule.id)}
                className={`${styles.secondaryButton} btn btn-sm mt-3`}
              >
                Add action refinement
              </button>

              {/* Purpose Select */}
              <div className="mb-3 mt-4">
                <label className={`${styles.formLabel} form-label`}>
                  Purpose
                </label>
                <select
                  className={`${styles.formInput} form-select`}
                  aria-label="Default select example"
                  value={rule.purpose}
                  onChange={(e) => updatePurpose(rule.id, e.target.value)}
                  required
                >
                  {getPurposeDropdownValue().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose Refinements */}
              {rule.purposeRefinements.map((item) => (
                <div className="row mt-2 mb-3" key={item.id}>
                  <div className="d-flex mb-3 mt-3">
                    <h6 className="me-auto">Purpose Refinement</h6>
                    <i
                      className="fa-solid fa-trash"
                      onClick={() => removePurposeRefinement(rule.id, item.id)}
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
                          rule.id,
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
                          rule.id,
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
                          rule.id,
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
                onClick={() => addPurposeRefinement(rule.id)}
                className={`${styles.secondaryButton} btn btn-sm mt-3`}
              >
                Add purpose refinement
              </button>

              {/* Constraints Refinements */}
              {rule.constraintRefinements.map((item) => (
                <div className="row mt-2 mb-3" key={item.id}>
                  <div className="d-flex mb-3 mt-3">
                    <h6 className="me-auto">Constraint</h6>
                    <i
                      className="fa-solid fa-trash"
                      onClick={() =>
                        removeConstraintRefinement(rule.id, item.id)
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
                          rule.id,
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
                          rule.id,
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
                          rule.id,
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
                onClick={() => addConstraintRefinement(rule.id)}
                className={`${styles.dashedButton} btn btn-sm w-100 mt-4`}
              >
                Add constraint
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRule}
          className={`${styles.secondaryButton} btn w-100`}
        >
          Add Rule
        </button>
        <br />

        <p className="text-muted mt-4">
          Bofore you submit your request please make sure that all your rules
          and refinements are correct. Wrong values can lead to rejection by the
          data owner.
        </p>

        <button
          className={`${styles.primaryButton} btn mt-3 w-100`}
          type="submit"
        >
          Create Request
        </button>
      </form>
    </div>
  );
}

export default CreateRequest;
