import { getRequestPermissions } from "./policyParser";
import { Request } from "../components/Interfaces/Requests";


function formatOperand(operand: any): string {
    if (!operand) return "";

    if (typeof operand === "string") return operand;

    // JSON-LD object with @id
    if (operand["@id"]) {
      return operand["@id"].replace(/^.*:/, ""); // strip prefix like cactus:
    }

    // JSON-LD object with @value
    if (operand["@value"]) {
      return operand["@value"];
    }

    // JSON-LD object with @list
    if (operand["@list"]) {
      return operand["@list"]
        .map((item: any) => formatOperand(item))
        .join(", ");
    }

    // Plain array of objects
    if (Array.isArray(operand)) {
      return operand.map((item) => formatOperand(item)).join(", ");
    }

    return String(operand);
  }

export default function renderPermissions(requestDetails: Request) {
    
    // Parse permissions from ODRL policy or fallback to legacy permissions
    const parsedPermissions = getRequestPermissions(requestDetails);

    return parsedPermissions.map((permission, ruleIndex) => (
      <div key={ruleIndex} className="mb-4 mt-4">
        <h5>Permission {ruleIndex + 1}</h5>
        <h5 className="mt-4">What's being requested</h5>
        <p>
          <strong>Dataset:</strong> The requester wants access to data
          from <strong>{permission.dataset}</strong>.
        </p>
        <p>
          <strong>Action:</strong> The requester wants to{" "}
          <strong>{permission.action}</strong> to this dataset.
        </p>
        <p>
          <strong>Purpose:</strong> This request is for{" "}
          <strong>{formatOperand(permission.purpose)}</strong> reasons.
        </p>

        {/* Show generic ODRL constraints */}
        {permission.constraints && permission.constraints.length > 0 && (
          <div className="mt-3">
            <h6>Policy Constraints:</h6>
            <ul className="list-unstyled ms-3">
              {permission.constraints.map((constraint, i) => (
                <li key={i} className="mb-1">
                  <small className="text-muted">
                    • {formatOperand(constraint.leftOperand)}{" "}
                    {formatOperand(constraint.operator)}{" "}
                    {formatOperand(constraint.rightOperand)}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show generic ODRL assignees */}
        {permission.assignees && permission.assignees.length > 0 && (
          <div className="mt-3">
            <h6>Assigned To:</h6>
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
        )}

        {permission.datasetRefinements?.length > 0 && (
          <div>
            <h5>Dataset conditions:</h5>
            <ul className="list-unstyled">
              {permission.datasetRefinements.map((ref, i) => (
                <li key={i}>
                  Data about <strong>{ref.leftOperand}</strong> items
                  greater than <strong>{ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.actionRefinements?.length > 0 && (
          <div>
            <h5>Action conditions:</h5>
            <ul className="list-unstyled">
              {permission.actionRefinements.map((ref, i) => (
                <li key={i}>
                  Write access to <strong>{ref.leftOperand}</strong> items
                  greater than <strong> {ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.purposeRefinements?.length > 0 && (
          <div>
            <h5>Purpose conditions:</h5>
            <ul className="list-unstyled">
              {permission.purposeRefinements.map((ref, i) => (
                <li key={i}>
                  Data will be used for <strong>{ref.leftOperand}</strong>{" "}
                  items greater than <strong>{ref.rightOperand}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission.constraintRefinements?.length > 0 && (
          <div>
            <h5>Constraints:</h5>
            <ul className="list-unstyled">
              {permission.constraintRefinements.map((ref, i) => (
                <li key={i}>
                  Data should meet the constraint:{" "}
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