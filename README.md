# Consent Manager setup and run instructions

## Prerequisites

- Download and install [Node.js](https://nodejs.org/en)
- Follow the instructions to setup the [DIPS Local Development](https://github.com/DIPS-Tools/dips-local-dev)

## Setup and run

1. **Clone the project:**

```bash
  git clone https://github.com/EU-UPCAST/upconsent.git
```

2. **Navigate into the project directory:**

```bash
  cd upconsent
```

3. **Install the required libraries**

```bash
  npm install
```

> **Note:** Mac users: If you face permission errors, you might need **sudo npm install**.

4. **Start the development server:**

```bash
  npm run dev
```

> **Note:** Mac users: If you face permission errors, you might need **sudo npm run dev**.

5. **Open the project in your browser:**

- Once the server starts, a localhost URL (usually http://localhost:3000) will be shown in the terminal.
- Press Ctrl + Click on the URL or copy and paste it into your browser.

The project should now be running locally.

## Using the Consent Manager GUI

### Creating an account

0. Open [http://localhost:5173/consent-manager](http://localhost:5173/consent-manager) (by default).
1. Click on "Get Started".
2. Click on "Continue as a data owner" or "Continue as a data requester".
3. Fill the corresponding form and click on "Register".

### As a Data Requester

0. Register as a data requester.
1. Sign in with your credentials.
2. Under Ontologies, click on "Manage". If you have already uploaded ontologies before, you may skip to step 5.
3. Click on "Upload ontology"
4. Fill the form by uploading an OWL ontology, giving it a name, then click on "Upload Ontology".
5. Under Requests, click on "Manage".
6. Click on New Request.
7. Fill the form, then click on "Create Request" when finished.
8. Find your request under Drafts and click on "Send", or under Sent and click on "Send to more".
9. Type email addresses under "Add New Recipients" and click on the plus sign next to it to add more users to send the request. Finally click on "Send Request".

### As a Data Owmer

0. Register as a data owner.
1. Sign in with your credentials.
2. Under Pending requests, click on "Manage". If there are no pending requests, you may skip to step 5.
3. Click on "See details" next to a request.
4. Read the Request details, then click on "Accept", "Negotiate" or "Reject".
5. Under Accepted requests, click on "Manage".
6. Click on "View details" next to a request.
7. Click on "Show Contract" to view a machine-readable contract or "Download Contract" to download a PDF contract.
8. If you wish to revoke your consent for a request, follow step 5 and click on "Revoke" next to the request.

## Using the Consent Manager API

The default base URL for the Consent Manager endpoint is [http://localhost:8019/consent-manager-api/api](http://localhost:8019/consent-manager-api/api). Documentation is available at /docs.

### Creating an account

Make a POST request to {API_BASE_URL}/auth/register with the following minimum requirements shown in this example:

```
{
  "email": "new_user@example.com",
  "password": "password123#",
  "name": "Hugh Mann",
  "role": "requester",
  "type": "consumer",
}
```

For a data owner, replace "requester" with "owner" and "consumer" with "provider".

### As a Data Requester

0. Register as a data requester.
1. Sign in by making a POST request to {API_BASE_URL}/auth/login following the example:

```
const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-login-source": "ui",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
```
2. Create a request by making a POST request to {API_BASE_URL}/requests following the example:
```
const response = await fetch(`${API_BASE_URL}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(data),
    });
```

Where data must contain the attributes:
- policy: a JSON-LD ODRL Policy as per samplePolicy.json.
- requester:
```
{
  "requesterId": the MongoDB Object ID of the requester.
  "requesterName": the requester's name.
  "requesterEmail": the requester's email address.
}
```

These values can be retrieved from the response to the login API call in step 1.

3. Send the request by making a POST request to {API_BASE_URL}/requests/{id}, where id is the MongoDB Object ID of the request, as per the example:
```
const response = await fetch(`${API_BASE_URL}/requests/{id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(
        { "user_emails": user_emails }
      ),
    });
```

You can check the status of the request by making a GET request to {API_BASE_URL}/requests/{id}.

```
{
  "id":"123456789",
  "data":{
    "_id":"123456789",
    "requestName":"samplePolicy",
    "requester":{
      "requesterId":"987654321",
      "requesterName":"data consumer",
      "requesterEmail":"requester1@example.com"},
    "policy":{...},
    "selectedOntologies":[...],
    "createdAt":"Wednesday 15 July 2026 09:18",
    "sentAt":"",
    "status":"rejected",
    "owners":[...],
    "ownersAccepted":[...],
    "ownersRejected":[...],
    "ownersPending":[...],
    "contractId":"135792468"
  },
  "success":true
}
```

### Demo

src/test.py is a Python script that provides a CLI that encapsulates steps 1-3 for a data requester. 

#### Usage
```
python test.py --email email --password password --odrl samplePolicy.json --user-email user_email1 --user-email user_email2 ...
```
Or if you know the ID for the request you want to send:
```
python test.py --email email --password password --requestId request_id --user-email user_email1 --user_email2 ...
```

- email: The email address of the requester.
- password: The requester's password.
- odrl: The path to a JSON file for an ODRL policy.
- requestId: The MongoDB Object ID of a request object. 
- user_email: The email address of a data owner. Allows multiple instances.

