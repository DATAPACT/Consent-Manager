import requests
import json
import argparse
from pathlib import Path
import jwt

parser = argparse.ArgumentParser()
parser.add_argument("--email", required=True)
parser.add_argument("--password", required=True)
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

    requesterId = response_data.get("user")["uid"]
    print(f"Requester ID is: {requesterId}")

    requester_data = {
        "requesterId": response_data.get("user")["uid"],
        "requesterName": response_data.get("user")["userData"]["name"],
        "requesterEmail": email
    }

    consent_manager_get_requests_url = f"{consent_manager_api_url}/requests"
    consent_manager_send_request_url = f"{consent_manager_api_url}/requests/send/"

    request_id = None

    response = session.get(
        f"{consent_manager_api_url}/requests?uid={requesterId}&role=requester",
        headers= {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        },
    )

    response_data = response.json()
    requestSet = response_data.get("requests")
    print(f"Raw JSON: {response_data}")

    aggregatedOwners = [{'requestId': request["_id"], 'ownersPending': request["ownersPending"], 'ownersAccepted': request["ownersAccepted"]} for request in requestSet]
    print(f"Aggregated results: {aggregatedOwners}")

else:
    print(f"Login failed. Error code: {response.status_code} {response.text}")
    exit()

