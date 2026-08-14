import en from "../../locales/en";
import es from "../../locales/es";
import el from "../../locales/el";
import { RequestData } from "../../src/components/Interfaces/Requests";

const baseUrl = process.env.FRONTEND_URL || "http://localhost:8019/api";
export function ExpiredChangePasswordEmail(token: string, lang?: string) {
    const acceptUrl = `${baseUrl}/changePassword/?token=${encodeURIComponent(token)}`;
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
        <div>
          ${t.expired_reset_password_text_1}
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
            ${t.update}
          </a>
        </div>
      </div>
    </body>
  </html>`);
}

export function ExpiredVerificationEmail(requestDetails: RequestData, token: string, lang?: string) {
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
            ${t.agree}
            </a>
        </div>
        </div>
    </body>
    </html>`);
}