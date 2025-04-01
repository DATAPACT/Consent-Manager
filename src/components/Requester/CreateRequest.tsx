import styles from "../../css/CreateRequest.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { auth, db } from "../../firebase";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";

// dropdowns
import {
  getActionDropdownValue,
  getPurposeDropdownValue,
  getAttributeDropdownValue,
  getOperandDropdownValue,
} from "../../helperFunctions/RequestDropdowns";

interface Refinement {
  id: number;
}

interface Rule {
  id: number;
  datasetRefinements: Refinement[];
  purposeRefinements: Refinement[];
  actionRefinements: Refinement[];
  constraintRefinements: Refinement[];
}

function CreateRequest() {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: Date.now(),
      datasetRefinements: [],
      purposeRefinements: [],
      actionRefinements: [],
      constraintRefinements: [],
    },
  ]);

  // Function to add a new rule
  const addRule = () => {
    setRules([
      ...rules,
      {
        id: Date.now(),
        datasetRefinements: [],
        purposeRefinements: [],
        actionRefinements: [],
        constraintRefinements: [],
      },
    ]);
  };

  // Function to remove a rule
  const removeRule = (id: number) => {
    if (id !== rules[0].id) {
      setRules(rules.filter((rule) => rule.id !== id));
    }
  };

  // Handle refinements for each rule
  const addDatasetRefinement = (ruleId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              datasetRefinements: [
                ...rule.datasetRefinements,
                { id: Date.now() },
              ],
            }
          : rule
      )
    );
  };

  const addPurposeRefinement = (ruleId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              purposeRefinements: [
                ...rule.purposeRefinements,
                { id: Date.now() },
              ],
            }
          : rule
      )
    );
  };

  const addActionRefinement = (ruleId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              actionRefinements: [
                ...rule.actionRefinements,
                { id: Date.now() },
              ],
            }
          : rule
      )
    );
  };

  const addConstraintRefinement = (ruleId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              constraintRefinements: [
                ...rule.constraintRefinements,
                { id: Date.now() },
              ],
            }
          : rule
      )
    );
  };

  // Remove refinement
  const removeDatasetRefinement = (ruleId: number, refinementId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              datasetRefinements: rule.datasetRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : rule
      )
    );
  };

  const removePurposeRefinement = (ruleId: number, refinementId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              purposeRefinements: rule.purposeRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : rule
      )
    );
  };

  const removeActionRefinement = (ruleId: number, refinementId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              actionRefinements: rule.actionRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : rule
      )
    );
  };

  const removeConstraintRefinement = (ruleId: number, refinementId: number) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              constraintRefinements: rule.constraintRefinements.filter(
                (item) => item.id !== refinementId
              ),
            }
          : rule
      )
    );
  };

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

      <form className="w-50">
        <div className="mb-3">
          <label className={`${styles.formLabel} form-label`}>
            Request name
          </label>
          <input
            type="text"
            className={`${styles.formInput} form-control`}
            id="requestName"
            name="requestName"
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
                  type="text"
                  className={`${styles.formInput} form-control`}
                  placeholder="Dataset URL"
                  required
                />
              </div>

              {/* Dataset Refinements */}
              {rule.datasetRefinements.map((item) => (
                <div className="row mt-3" key={item.id}>
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
                    <select className={`${styles.formInput} form-select`}>
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
                    <select className={`${styles.formInput} form-select`}>
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
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addDatasetRefinement(rule.id)}
                className={`${styles.primaryButton} btn btn-sm mt-3`}
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
                <div className="row mt-4" key={item.id}>
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
                    <select className={`${styles.formInput} form-select`}>
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
                    <select className={`${styles.formInput} form-select`}>
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
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addActionRefinement(rule.id)}
                className={`${styles.primaryButton} btn btn-sm mt-3`}
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
                <div className="row mt-4" key={item.id}>
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
                    <select className={`${styles.formInput} form-select`}>
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
                    <select className={`${styles.formInput} form-select`}>
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
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addPurposeRefinement(rule.id)}
                className={`${styles.primaryButton} btn btn-sm mt-3`}
              >
                Add purpose refinement
              </button>

              {/* Constraints Select */}
              <div className="mb-3 mt-4">
                <label className={`${styles.formLabel} form-label`}>
                  Constraints
                </label>
                <select
                  className={`${styles.formInput} form-select`}
                  aria-label="Default select example"
                >
                  <option selected>Choose constraints</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
              </div>

              {/* Constraints Refinements */}
              {rule.constraintRefinements.map((item) => (
                <div className="row mt-4" key={item.id}>
                  <div className="d-flex mb-3">
                    <h6 className="me-auto">Purpose Refinement</h6>
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
                    <select className={`${styles.formInput} form-select`}>
                      <option>Choose attribute</option>
                    </select>
                  </div>
                  <div className="col">
                    <label className={`${styles.formLabel} form-label`}>
                      Instance
                    </label>
                    <select className={`${styles.formInput} form-select`}>
                      <option>Choose instance</option>
                    </select>
                  </div>
                  <div className="col">
                    <label className={`${styles.formLabel} form-label`}>
                      Value
                    </label>
                    <input
                      type="text"
                      className={`${styles.formInput} form-control`}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addConstraintRefinement(rule.id)}
                className={`${styles.primaryButton} btn btn-sm mt-3`}
              >
                Add constraint refinement
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRule}
          className={`${styles.primaryButton} btn btn-sm`}
        >
          Add Rule
        </button>

        {/* 
        <button className={`${styles.primaryButton} btn mt-3`} type="submit">
          Create Request
        </button> */}
      </form>
    </div>
  );
}

export default CreateRequest;
