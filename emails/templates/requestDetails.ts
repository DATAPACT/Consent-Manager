import { getRequestPermissions } from "../../server/utils/policyParser";
import type { RequestData } from "../../src/components/Interfaces/Requests";
import en from "../../locales/en";
import es from "../../locales/es";
import el from "../../locales/el";

const baseUrl = process.env.VITE_API_BASE_URL || "http://localhost:8019/api";

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

function parsePermissionsToHTML(requestDetails: RequestData, t: any) {
  const parsedPermissions = getRequestPermissions(requestDetails);
  return parsedPermissions.map((permission, ruleIndex) => (
    `<div key=${ruleIndex}>
      <h5>${t.permission} ${ruleIndex + 1}</h5>
      <h5>${t.render_permissions_text_1_prefix} ${t.render_permissions_text_1_suffix}</h5>
      <p>
        <strong>Dataset:</strong> ${t.render_permissions_text_2_prefix} <strong>${permission.dataset}</strong>. ${t.render_permissions_text_2_suffix}
      </p>
      <p>
        <strong>Action:</strong> ${t.render_permissions_text_3_prefix}
        <strong>${permission.action}</strong> ${t.render_permissions_text_3_suffix}
      </p>

      <p>
        <strong>Purpose:</strong> ${t.render_permissions_text_4_prefix}
        <strong>${formatOperand(permission.purpose)}</strong> ${t.render_permissions_text_4_suffix}.
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

export function VerificationEmail(requestDetails: RequestData, token: string, lang?: string) { 
    let t;
    switch (lang){
      case "en":
        t = en;
        break;
      case "es":
        t = es;
        break;
      case "el":
        t = el;
        break;
      default:
        t = en;
    }
    console.log(`Language: ${lang}`);

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
        <h3>${t.requester_details}</h5>
        <p>
          <i>${t.name}:</i>
          ${requestDetails.requester?.requesterName}
        </p>
        <p>
          <i>${t.email_address}:</i>
          ${requestDetails.requester?.requesterEmail}
        </p>

        ${requestDetails.emailText? requestDetails.emailText : ""}

        ${requestDetails.extraText? requestDetails.extraText : ""}

        ${requestDetails.extraTerms? requestDetails.extraTerms : ""}

        <text>${t.requester} ${requestDetails.requester?.requesterName} ${t.email_template_text_1}

        <div>
          ${t.email_template_disclaimer} ${requestDetails.requester?.requesterEmail}
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
            ${t.agree_to_use_system}
          </a>
        </div>
      </div>
    </body>
  </html>`);
}

export function RequestEmail(requestDetails: RequestData, userId: string, token: string, lang?: string) {
    const acceptUrl = `${baseUrl}/requests/${requestDetails._id}/accept/${userId}${token ? `/?token=${token}` : ""}`;
    const rejectUrl = `${baseUrl}/requests/${requestDetails._id}/reject/${userId}${token ? `/?token=${token}` : ""}`;
    let t = en;
    switch (lang){
      case "en":
        t = en;
        break;
      case "es":
        t = es;
        break;
      case "el":
        t = el;
        break;
      default:
        t = en;
    }
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
        <h3>${t.requester_details}</h5>
        <p>
          <i>${t.name}:</i>
          ${requestDetails.requester?.requesterName}
        </p>
        <p>
          <i>${t.email_address}:</i>
          ${requestDetails.requester?.requesterEmail}
        </p>

        ${requestDetails.emailText? requestDetails.emailText : ""}

        ${requestDetails.extraText? requestDetails.extraText : ""}

        ${requestDetails.extraTerms? requestDetails.extraTerms : ""}

        ${parsePermissionsToHTML(requestDetails, t)}

        <div>
          ${t.pending_request_disclaimer.trim().endsWith(".") ? t.pending_request_disclaimer.trim().slice(0,-1) : t.pending_request_disclaimer} at ${requestDetails.requester?.requesterEmail}
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
            ${t.accept}
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
            ${t.reject}
          </a>
        </div>
      </div>
    </body>
  </html>`);
}

