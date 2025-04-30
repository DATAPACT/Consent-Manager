import styles from "../../css/CreateRequest.module.css";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useState } from "react";

import { addRequest } from "../../helperFunctions/AddRequest";

// dropdowns
import {
  getFeatureDropdownValue,
  getAttributeDropdownValue,
  getOperandDropdownValue,
  getAttributeLabel,
  getInstanceLabel,
} from "../../helperFunctions/RequestDropdowns";

// permissions utils
import { usePermissions } from "../../helperFunctions/PermissionsUtils";

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
    const result = await addRequest({ ...formData, permissions });
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

      <form onSubmit={handleSubmit}>
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
                  onChange={(e) => updateDataset(permission.id, e.target.value)}
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
                      onChange={(e) => {
                        const Labelvalue = e.target.value;
                        const label = getAttributeLabel(Labelvalue);
                        updateDatasetRefinement(
                          permission.id,
                          item.id,
                          "attribute",
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
                      onChange={(e) => {
                        const Labelvalue = e.target.value;
                        const label = getAttributeLabel(Labelvalue);
                        updateDatasetRefinement(
                          permission.id,
                          item.id,
                          "instance",
                          Labelvalue,
                          label
                        );
                      }}
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
                      onChange={(e) => {
                        const Labelvalue = e.target.value;
                        const label = getAttributeLabel(Labelvalue);
                        updateDatasetRefinement(
                          permission.id,
                          item.id,
                          "value",
                          Labelvalue,
                          label
                        );
                      }}
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
                      {getFeatureDropdownValue("action").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
                      {getFeatureDropdownValue("purpose").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
        <br />

        <p className="text-muted mt-4">
          Bofore you submit your request please make sure that all your
          permissions and refinements are correct. Wrong values can lead to
          rejection by the data owner.
        </p>

        <button
          className={`${styles.primaryButton} btn mt-3 w-20`}
          type="submit"
        >
          Create Request
        </button>
      </form>
    </div>
  );
}

export default CreateRequest;
