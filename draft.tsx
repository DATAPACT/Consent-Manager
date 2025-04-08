import styles from "../../css/CreateRequest.module.css";
import { Link } from "react-router-dom";
import { useState } from "react";

import { addRequest } from "../../helperFunctions/AddRequest";

// dropdowns
import {
  getActionDropdownValue,
  getPurposeDropdownValue,
  getAttributeDropdownValue,
  getOperandDropdownValue,
} from "../../helperFunctions/RequestDropdowns";

// rules utils
import { useRules } from "../../helperFunctions/RulesUtils";

function CreateRequest() {
  const [formData, setFormData] = useState<RequestData>({
    title: "",
    description: "",
    rules: [
      {
        dataset: {
          dataset_name: "",
          dataset_refinements: [
            {
              attribute: "",
              dataset_attribute_label: "",
              operator: "",
              dataset_operator_label: "",
              value: "",
            },
          ],
        },
      },
    ],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addRequest(formData);
    if (result.success) {
      alert("Request added with ID: " + result.id);
      // Optionally reset the form here
    } else {
      alert("Error adding request");
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
            name="title"
            value={formData.request_name}
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
                className={`${styles.secondaryButton} btn btn-sm mt-3`}
              >
                Add dataset refinement
              </button>

              {/* Action Select */}
              {/* <div className="mb-3 mt-4">
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
              </div> */}

              {/* Action Refinements */}
              {/* {rule.actionRefinements.map((item) => (
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
                className={`${styles.secondaryButton} btn btn-sm mt-3`}
              >
                Add action refinement
              </button> */}

              {/* Purpose Select */}
              {/* <div className="mb-3 mt-4">
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
              </div> */}

              {/* Purpose Refinements */}
              {/* {rule.purposeRefinements.map((item) => (
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
                className={`${styles.secondaryButton} btn btn-sm mt-3`}
              >
                Add purpose refinement
              </button> */}
              <br />
              <br />

              {/* Constraints Select */}

              {/* Constraints Refinements */}
              {/* {rule.constraintRefinements.map((item) => (
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
                className={`${styles.dashedButton} btn btn-sm w-100 mt-4`}
              >
                Add constraint
              </button> */}
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

        <button className={`${styles.primaryButton} btn mt-3`} type="submit">
          Create Request
        </button>
      </form>
    </div>
  );
}

export default CreateRequest;

// I'm gonna explain you the structure of a request. then I will show you the code and I want you to add me the logic of adding the request in the database (firebase):

// a request has:

// - a name
// - the id of the requester that creates it
// - the name of the requester that creates it
// - the email of the requester that creates it
// - a creation timestamp
// - a status (by default is “draft”)
// - one or more rules where each rule has:
// - a rule id
// -a dataset (just text input) where the dataset has: none or more dataset refinements, where each dataset refinement has: an attribute, an instance and a value.
// -an action (just text input) where the action has: none or more action refinements, where each action refinement has: an attribute, an instance and a value.
// - a purpose (just text input) where the purpose has: none or more purpose refinements, where each purpose refinement has: an attribute, an instance and a value.
// - none or more constraints where each constraint has: an attribute, an instance and a value.

// first of all just show me a representation of this structure (like a json type)
