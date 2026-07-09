import { getRequestPermissions } from "../../server/utils/policyParser";
import { RequestData } from "../../src/components/Interfaces/Requests";

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

function parsePermissionsToHTML(requestDetails: RequestData) {
  const parsedPermissions = getRequestPermissions(requestDetails);
  return parsedPermissions.map((permission, ruleIndex) => (
    `<div key=${ruleIndex}>
      <h5>Permission ${ruleIndex + 1}</h5>
      <h5>What's being requested</h5>
      <p>
        <strong>Dataset:</strong> The requester wants access to data
        from <strong>${permission.dataset}</strong>.
      </p>
      <p>
        <strong>Action:</strong> The requester wants to
        <strong>${permission.action}</strong> to this dataset.
      </p>

      <p>
        <strong>Purpose:</strong> This request is for
        <strong>${formatOperand(permission.purpose)}</strong> reasons.
      </p>

      ${permission.constraints && permission.constraints.length > 0 && (
        `<div>
          <h6>Policy Constraints:</h6>
          <ul>
            ${permission.constraints.map((constraint, i) => (
              `<li key=${i}>
                <small>
                  ${formatOperand(constraint.leftOperand)} ${formatOperand(constraint.operator)} ${formatOperand(constraint.rightOperand)}
                </small>
              </li>`
            ))}
          </ul>
        </div>`
      )}

      ${permission.datasetRefinements ? (
        `<div>
          <h5>Dataset conditions:</h5>
          <ul class="list-unstyled">
            ${permission.datasetRefinements.map((ref, i) => (
              `<li key=${i}>
                Data about <strong>${ref.leftOperand}</strong> items
                greater than <strong>${ref.rightOperand}</strong>.
              </li>`
            ))}
          </ul>
        </div>`
      ) : ""}

      ${permission.actionRefinements ? (
        `<div>
          <h5>Action conditions:</h5>
          <ul class="list-unstyled">
            ${permission.actionRefinements.map((ref, i) => (
              `<li key=${i}>
                Write access to <strong>${ref.leftOperand}</strong> items
                greater than <strong> ${ref.rightOperand}</strong>.
              </li>`
            ))}
          </ul>
        </div>`
      ) : ""}

      ${permission.purposeRefinements ? (
        `<div>
          <h5>Purpose conditions:</h5>
          <ul class="list-unstyled">
            ${permission.purposeRefinements.map((ref, i) => (
              `<li key=${i}>
                Data will be used for <strong>${ref.leftOperand}</strong>{" "}
                items greater than <strong>${ref.rightOperand}</strong>.
              </li>`
            ))}
          </ul>
        </div>`
      ) : ""}

      ${permission.constraintRefinements ? (
        `<div>
          <h5>Constraints:</h5>
          <ul class="list-unstyled">
            ${permission.constraintRefinements.map((ref, i) => (
              `<li key=${i}>
                Data should meet the constraint:{" "}
                <strong>${ref.leftOperand}</strong> ${ref.operator}{" "}
                <strong>${ref.rightOperand}</strong>.
              </li>`
            ))}
          </ul>
        </div>`
      ) : ""}
    </div>`
  ));
}

export function VerificationEmail(requestDetails: RequestData, token: string) {
    const baseUrl = "http://localhost:8019/api";
    const acceptUrl = `${baseUrl}/auth/verify/${token}`;
    return (
    `
    <html>
    <head>
    <style>
      .primaryButton {
      background-color: #000000;
      color: white;
      font-weight: 400;
      border-radius: 0;
      border-bottom-width: 2px;
      border-bottom-color: #262626;
    }

    .primaryButton:hover {
      background-color: #0681a3;
      color: white;
      font-weight: 400;
    }

    .dangerButton {
      background-color: #dc3545;
      color: white;
      border-radius: 0;
      font-weight: 400;
      border-bottom-width: 2px;
      border-bottom-color: #262626;
    }

    .list-unstyled {
      list-style: none;
      padding-left: 0;
      margin-left: 0;
    }
    </style>
    </head>
    <body>
    <div class="dashboard">
        <h3>Requester details</h5>
        <p>
          <i>Name:</i>
          ${requestDetails.requester?.requesterName}
        </p>
        <p>
          <i>Email address:</i>
          ${requestDetails.requester?.requesterEmail}
        </p>

        ${requestDetails.emailText}

        ${requestDetails.extraText}

        ${requestDetails.extraTerms}

        <text>Requester ${requestDetails.requester?.requesterName} has sent you a consent request.

        <div>
          By clicking on 'Accept', you agree for your email address to be registered in our system. This will allow us to keep track of consent requests you have accepted, rejected or revoked.
          If you are unsure whether to accept, please contact the data requester at ${requestDetails.requester?.requesterEmail}
        </div>

        <div style="margin-top:24px;">
          <a
            href="${acceptUrl}"
            class="primaryButton"
            style="
              display:inline-block;
              padding:12px 20px;
              text-decoration:none;
              margin-right:12px;
            "
          >
            Accept
          </a>
        </div>
      </div>
    </body>
  </html>`);
}

export function RequestEmail(requestDetails: RequestData, userId: string, token: string) {
    const baseUrl = "http://localhost:8019/api";
    const acceptUrl = `${baseUrl}/requests/${requestDetails._id}/accept/${userId}${token ? `/?token=${token}` : ""}`;
    const rejectUrl = `${baseUrl}/requests/${requestDetails._id}/reject/${userId}${token ? `/?token=${token}` : ""}`;
    return (
    `
    <html>
    <head>
    <style>
      .primaryButton {
      background-color: #0690b6;
      color: white;
      font-weight: 400;
      border-radius: 0;
      border-bottom-width: 2px;
      border-bottom-color: #262626;
    }

    .primaryButton:hover {
      background-color: #0681a3;
      color: white;
      font-weight: 400;
    }

    .dangerButton {
      background-color: #dc3545;
      color: white;
      border-radius: 0;
      font-weight: 400;
      border-bottom-width: 2px;
      border-bottom-color: #262626;
    }

    .list-unstyled {
      list-style: none;
      padding-left: 0;
      margin-left: 0;
    }
    </style>
    </head>
    <body>
    <div class="dashboard">
        <h3>Requester details</h5>
        <p>
          <i>Name:</i>
          ${requestDetails.requester?.requesterName}
        </p>
        <p>
          <i>Email address:</i>
          ${requestDetails.requester?.requesterEmail}
        </p>

        ${requestDetails.emailText}

        ${requestDetails.extraText}

        ${requestDetails.extraTerms}

        ${parsePermissionsToHTML(requestDetails)}

        <div>
          If you are unsure whether to accept, reject or negotiate the request,
          please contact the data provider at ${requestDetails.requester?.requesterEmail}
        </div>

        <div style="margin-top:24px;">
          <a
            href="${acceptUrl}"
            class="primaryButton"
            style="
              display:inline-block;
              padding:12px 20px;
              text-decoration:none;
              margin-right:12px;
            "
          >
            Accept
          </a>

          <a
            href="${rejectUrl}"
            class="dangerButton"
            style="
              display:inline-block;
              padding:12px 20px;
              text-decoration:none;
            "
          >
            Reject
          </a>
        </div>
      </div>
    </body>
  </html>`);
}

