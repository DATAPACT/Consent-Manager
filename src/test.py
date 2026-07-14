import requests
import json
import argparse
from pathlib import Path
import jwt

parser = argparse.ArgumentParser()
parser.add_argument("--email", required=True)
parser.add_argument("--password", required=True)
parser.add_argument("--odrl")
parser.add_argument("--requestId")
parser.add_argument("--user_email", action="append")
args = parser.parse_args()

consent_manager_api_url = "https://dips.soton.ac.uk/datapact/consent-manager-api/api"

email = args.email
password = args.password

access_token = ""

params = {
        "email": email,
        "password": password,
    }

headers = {
    "Content-Type": "application/x-www-form-urlencoded"
}

session = requests.Session()

response = session.post(
    f"{consent_manager_api_url}/auth/login",
    headers=headers,
    data=params
)

if response.ok:
    response_data = response.json()
    token_data = response_data["user"]["apiToken"]
    access_token = token_data.get("access_token")
    decoded_token = jwt.decode(access_token, options={"verify_signature": False})
    print(f"Decoded access token: {decoded_token}")

    requester_data = {
        "requesterId": response_data.get("user")["uid"],
        "requesterName": response_data.get("user")["userData"]["name"],
        "requesterEmail": email
    }

    consent_manager_new_request_url = f"{consent_manager_api_url}/requests"
    consent_manager_send_request_url = f"{consent_manager_api_url}/requests/send/"

    request_id = None

    if args.odrl is not None:
        with open(args.odrl, "r", encoding="utf-8") as f:
            request_name = Path(args.odrl).stem
            odrl_policy = json.load(f)

            response = session.post(
                consent_manager_new_request_url,
                headers= {
                    "Authorization": f"Bearer {access_token}"
                },
                json={
                    "requestName": request_name,
                    "requester": requester_data,
                    "policy": odrl_policy
                },
            )

            if response.ok:
                new_request_response = response.json()
                request_id = new_request_response.get("id")
                print(f"Request created successfully with id: {request_id}")
            else:
                print(f"Request was not created. Error code: {response.status_code} {response.text}")
                exit()

    elif args.requestId is not None:
        request_id = args.requestId

    else:
        print(f"Request ID not provided. Terminating.")
        exit()

    user_emails = args.user_email
    print(f"User emails: {user_emails}")

    if request_id is not None:
        response = session.post(
            f"{consent_manager_api_url}/requests/{request_id}/send/",
            headers= {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            },
            json={
                "user_emails": user_emails
            }
        )

        print(response.json())
else:
    print(f"Login failed. Error code: {response.status_code} {response.text}")
    exit()

