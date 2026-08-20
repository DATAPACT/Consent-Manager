import { getRequestPermissions } from "./policyParser";
import { Request } from "../components/Interfaces/Requests";
import { RequestForm } from "../helperFunctions/PermissionsUtils";
import { Option } from "../helperFunctions/RequestDropdowns";
import { TFunction } from "i18next";

function formatOperand(operand: any, labels: Option[]): string {
    if (!operand) return "";

    if (typeof operand === "string") {
      const entry = labels.find((o) => o.value === operand);
      if (entry) {
        return entry.label;
      }
      else {
        return operand;
      }
    }

    // JSON-LD object with @id
    if (operand["@id"]) {
      if (labels.find((o) => o.value === operand["@id"])) {
        return labels.find((o) => o.value === operand["@id"])?.label || operand["@id"].replace(/^.*:/, "");
      }
      else {
        return operand["@id"].replace(/^.*:/, ""); // strip prefix like cactus:
      }
    }    

    // JSON-LD object with @value
    if (operand["@value"]) {
      return operand["@value"];
    }

    // JSON-LD object with @list
    if (operand["@list"]) {
      return operand["@list"]
        .map((item: any) => formatOperand(item, labels))
        .join(", ");
    }

    // Plain array of objects
    if (Array.isArray(operand)) {
      return operand.map((item) => formatOperand(item, labels)).join(", ");
    }

    return String(operand);
  }

export default function renderPermissions(requestDetails: Request, t: TFunction, labels: Option[]) {
    
    // Parse permissions from ODRL policy or fallback to legacy permissions
    const parsedPermissions = getRequestPermissions(requestDetails);

    return parsedPermissions.map((permission, ruleIndex) => (
      <div key={ruleIndex} className="mb-4 mt-4">
        <h5>{t("permission")} {ruleIndex + 1}</h5>
        <h5 className="mt-4">{t("render_permissions_text_1_prefix")} {t("render_permissions_text_1_suffix")}</h5>
        <p>
          <strong>{t("dataset")}:</strong> {t("render_permissions_text_2_prefix")}{" "} 
          <strong>{formatOperand(permission.dataset, labels)}</strong> {t("render_permissions_text_2_suffix")}
        </p>
        <p>
          <strong>{t("action")}:</strong> {t("render_permissions_text_3_prefix")}{" "} 
          <strong>{formatOperand(permission.action, labels)}</strong> {t("render_permissions_text_3_suffix")}
        </p>
        <p>
          <strong>{t("purpose")}:</strong> {t("render_permissions_text_4_prefix")}{" "}
          <strong>{formatOperand(permission.purpose, labels)}</strong> {t("render_permissions_text_4_suffix")}
        </p>

        {/* Show generic ODRL constraints */}
        {permission.constraints && permission.constraints.length > 0 && (
          <div className="mt-3">
            <h6>{t("constraints")}:</h6>
            <ul className="list-unstyled ms-3">
              {permission.constraints.map((constraint, i) => (
                <li key={i} className="mb-1">
                  <small className="text-muted">
                    • {formatOperand(constraint.leftOperand, labels)}{" "}
                    {formatOperand(constraint.operator, labels)}{" "}
                    {formatOperand(constraint.rightOperand, labels)}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show generic ODRL assignees */}
        {/* {permission.assignees && permission.assignees.length > 0 && (
          <div className="mt-3">
            <h6>{t("assigned_to")}:</h6>
            {permission.assignees.map((assignee, i) => (
              <div key={i} className="ms-3">
                <p className="mb-1">
                  <strong>{assignee.source}</strong>
                </p>
                {assignee.refinements &&
                  assignee.refinements.map((ref, j) => (
                    <p key={j} className="mb-1 ms-2">
                      <small className="text-muted">
                        └ {ref.description}
                      </small>
                    </p>
                  ))}
              </div>
            ))}
          </div>
        )} */}

        {permission.datasetRefinements?.length > 0 && (
          <div>
            <h5>{t("dataset_refinements")}:</h5>
            <ul className="list-unstyled">
              {permission.datasetRefinements.map((ref, i) => (
                <li key={i}>
                  <strong>{ref.leftOperand}</strong> {t(ref.operator)} <strong>{ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.actionRefinements?.length > 0 && (
          <div>
            <h5>{t("action_refinements")}:</h5>
            <ul className="list-unstyled">
              {permission.actionRefinements.map((ref, i) => (
                <li key={i}>
                  <strong>{ref.leftOperand}</strong> {t(ref.operator)} <strong> {ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.purposeRefinements?.length > 0 && (
          <div>
            <h5>{t("purpose_refinements")}:</h5>
            <ul className="list-unstyled">
              {permission.purposeRefinements.map((ref, i) => (
                <li key={i}>
                  <strong>{ref.leftOperand}</strong>{" "}
                  {t(ref.operator)} <strong>{ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.constraintRefinements?.length > 0 && (
          <div>
            <h5>{t("constraints")}:</h5>
            <ul className="list-unstyled">
              {permission.constraintRefinements.map((ref, i) => (
                <li key={i}>
                  <strong>{ref.leftOperand}</strong> {t(ref.operator)}{" "}
                  <strong>{ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ));
        
  }

export function renderPermissionsPreview(requestDetails: RequestForm, t: TFunction, labels: Option[]) {
    
    // Parse permissions from ODRL policy or fallback to legacy permissions
    const parsedPermissions = getRequestPermissions(requestDetails);

    return parsedPermissions.map((permission, ruleIndex) => (
      <div key={ruleIndex} className="mb-4 mt-4">
        <h5>{t("permission")} {ruleIndex + 1}</h5>
        <h5 className="mt-4">{t("render_permissions_text_1_prefix")} {t("render_permissions_text_1_suffix")}</h5>
        <p>
          <strong>{t("dataset")}:</strong> {t("render_permissions_text_2_prefix")}{" "} 
          <strong>{formatOperand(permission.dataset, labels)}</strong> {t("render_permissions_text_2_suffix")}
        </p>
        <p>
          <strong>{t("action")}:</strong> {t("render_permissions_text_3_prefix")}{" "} 
          <strong>{formatOperand(permission.action, labels)}</strong> {t("render_permissions_text_3_suffix")}
        </p>
        <p>
          <strong>{t("purpose")}:</strong> {t("render_permissions_text_4_prefix")}{" "}
          <strong>{formatOperand(permission.purpose, labels)}</strong> {t("render_permissions_text_4_suffix")}
        </p>

        {/* Show generic ODRL constraints */}
        {permission.constraints && permission.constraints.length > 0 && (
          <div className="mt-3">
            <h6>{t("constraints")}:</h6>
            <ul className="list-unstyled ms-3">
              {permission.constraints.map((constraint, i) => (
                <li key={i} className="mb-1">
                  <small className="text-muted">
                    • {formatOperand(constraint.leftOperand, labels)}{" "}
                    {formatOperand(constraint.operator, labels)}{" "}
                    {formatOperand(constraint.rightOperand, labels)}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.datasetRefinements?.length > 0 && (
          <div>
            <h5>{t("dataset_refinements")}:</h5>
            <ul className="list-unstyled">
              {permission.datasetRefinements.map((ref, i) => (
                <li key={i}>
                  <strong>{ref.leftOperand}</strong> {t(ref.operator)} <strong>{ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.actionRefinements?.length > 0 && (
          <div>
            <h5>{t("action_refinements")}:</h5>
            <ul className="list-unstyled">
              {permission.actionRefinements.map((ref, i) => (
                <li key={i}>
                  <strong>{ref.leftOperand}</strong> {t(ref.operator)} <strong> {ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.purposeRefinements?.length > 0 && (
          <div>
            <h5>{t("purpose_refinements")}:</h5>
            <ul className="list-unstyled">
              {permission.purposeRefinements.map((ref, i) => (
                <li key={i}>
                  <strong>{ref.leftOperand}</strong>{" "}
                  {t(ref.operator)} <strong>{ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.constraintRefinements?.length > 0 && (
          <div>
            <h5>{t("constraints")}:</h5>
            <ul className="list-unstyled">
              {permission.constraintRefinements.map((ref, i) => (
                <li key={i}>
                  <strong>{ref.leftOperand}</strong> {ref.operator}{" "}
                  <strong>{ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ));
        
  }