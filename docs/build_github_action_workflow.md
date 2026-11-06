# Consent-Manager GitHub Actions Environment Setup and Readiness Testing

Implementation branch: `consent-manager-environment-setup`  
Workflow: **Consent-Manager environment startup**

## 1. Purpose and current status

This document describes the configuration, execution, validation and operation of
the Consent-Manager environment setup workflow. The workflow recreates the
application environment on a GitHub-hosted runner and verifies service readiness.
The scope is divided into two stages:

1. **Environment setup:** check out the repositories, generate CI configuration,
   start Keycloak and the application services, check readiness, collect logs,
   and remove the temporary environment.
2. **Application testing:** install and run automated feature tests after the environment
   is ready, prepare the users/data they require, and publish test reports.

CI means **Continuous Integration**. In this project, GitHub runs the setup on a
temporary Ubuntu machine in response to a configured event. It does not connect
to or deploy onto the developer's existing Docker environment.

**Validation status: a successful GitHub Actions environment run has been reported.**
The run completed without errors in **5 minutes 26 seconds** using Ubuntu 22.04.5
LTS, kernel `6.8.0-1070-azure`, and Docker Compose `v2.38.2`. This is an observed
run duration, not a performance guarantee. The application feature-test suite has
not yet been integrated.

[//]: # (An earlier MongoDB startup failure on the Ubuntu 24.04 runner was resolved for)

[//]: # (the successful run by selecting `ubuntu-22.04`. Section 12 records the diagnosis)

[//]: # (and the runner compatibility considerations.)

A passing environment check establishes service readiness within the checks
implemented here. Login, consent creation and contract operations require
separate application tests.

## 2. Existing local development layout

The local setup uses the parent Compose file, with Consent-Manager cloned inside
`dips-local-dev`. Keycloak has its own Compose file within the parent repository:

```text
/opt/local_test/dips-local-dev/
├── .env
├── docker-compose.yml
├── Consent-Manager/
├── User-Management/
├── Contract_Service/
├── Negotiation-Tool/
└── keycloak/
    ├── Dockerfile
    ├── docker-compose.yml
    └── keycloak-dips-services-export/
        └── dips_services-realm.json
```

The workflow preserves this relative directory structure on the GitHub runner.
It uses the **parent** `dips-local-dev/docker-compose.yml` for the application
stack, not the separate Compose files inside Consent-Manager.

The CI configuration follows the variable names required by the parent Compose
file. Local `.env` credential values are not copied into the runner configuration.

## 3. Files added for the workflow

Paths below are relative to Consent-Manager:

| File | Purpose |
| --- | --- |
| [`.github/workflows/environment-check.yml`](../.github/workflows/environment-check.yml) | Defines triggers, checkouts, setup, checks, artifacts and cleanup |
| [`ci/dependencies.json`](../ci/dependencies.json) | Records repository names and pinned dependency commits |
| [`ci/environment.py`](../ci/environment.py) | Implements `prepare`, `validate`, `start`, `check`, `logs` and `stop` |
| [`ci/test_environment.py`](../ci/test_environment.py) | Tests configuration isolation, guard conditions and failure handling |
| [`ci/README.md`](../ci/README.md) | Short operational guide |

The implementation uses a single Python script with subcommands rather than
separate shell scripts for each stage. It uses Python's standard library; the
helper tests do not need a Python package installation.

## 4. Branch and dependency versions

The branch was created from the local latest branch `dips-branch-mongodb` of Consent-Manager:

```bash
cd /opt/local_test/dips-local-dev/Consent-Manager
git switch -c consent-manager-environment-setup
```

That branch now exists. To return to it, use the following command instead of
trying to create it again:

```bash
git switch consent-manager-environment-setup
```

The initial dependency manifest contains these revisions:

| Component | Repository |  
| --- | --- |  
| Parent environment | `DIPS-Tools/dips-local-dev` | 
| User Management | `DATAPACT/User-Management` | 
| Contract Service | `DATAPACT/Contract_Service` |
| Negotiation Tool | `DATAPACT/Negotiation-Tool` |

`ci/dependencies.json` is the source of truth if these revisions change later.
Consent-Manager itself uses the workflow revision being tested, not a fixed
dependency SHA.

Pinning Git commits makes the source combination repeatable. Existing Docker
image tags and npm/pip dependency resolution are still used, so this is not a
fully immutable build. Changes made only in a local dependency checkout will not
appear in CI: publish the dependency change and update its manifest SHA.

## 5. GitHub authentication: Name and Secret

The workflow checks out dependencies from **two organizations**: `DIPS-Tools`
and `DATAPACT`. The workflow's default `GITHUB_TOKEN` is scoped to its own
repository and cannot automatically read other private repositories.

The current workflow expects this repository secret:

| GitHub field | Value |
| --- | --- |
| **Name** | `CI_REPO_READ_TOKEN` |
| **Secret** | The actual GitHub-generated access token |


### Token scope across organizations

One fine-grained personal access token cannot access private repositories owned
by both organizations. Authentication must account for the separate repository
owners.

There are two approaches:

| Approach | Workflow change needed? | Permissions |
| --- | --- | --- |
| One classic personal access token | No; works with the current single-secret design if organization policy permits | `repo` scope; broader than read-only |
| Two fine-grained tokens, one per organization | Yes; use a separate secret in the appropriate checkout steps | Contents: read on the selected repositories |

The name `CI_REPO_READ_TOKEN` describes how the workflow uses the token. It does
not make a classic token read-only. See [GitHub's token documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

### Configure the current single-secret workflow

1. In your personal GitHub settings, open **Developer settings → Personal access
   tokens → Tokens (classic)**.
2. Choose **Generate new token (classic)**.
3. Give it a descriptive note, such as `Consent-Manager CI dependencies`.
4. Choose an expiration appropriate to your organization, for example 30 days.
5. Select the `repo` scope, then generate the token.
6. If required, authorize the token for the organizations' SSO. Your account must
   already have access to the repositories. Organization policy may prohibit
   classic tokens; in that case use the two-token approach or a GitHub App.
7. Open the **Consent-Manager repository receiving the push**, then
   **Settings → Secrets and variables → Actions → New repository secret**.
8. Enter `CI_REPO_READ_TOKEN` as Name and paste the generated token into Secret.
9. Select **Add secret**.

Do not commit the token or paste it into chat, logs or documentation. Replace
the repository secret when its token expires or is rotated. Checkout steps use
`persist-credentials: false` so checkout authentication is not retained in Git
configuration. [GitHub repository-secret instructions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)

The current workflow explicitly requires this secret even if some dependencies
are public. Supporting an entirely public setup without a token would require
adjusting that check.

## 6. GitHub Actions execution model and repository access

### Trigger and runner lifecycle

A workflow is the YAML definition stored in
`.github/workflows/environment-check.yml`. It specifies the events that start
a run, the runner to use, and the ordered job steps. A runner is the machine
that executes those steps.

For the configured push trigger, execution follows this sequence:

```text
Commit changes locally
        ↓
Push to consent-manager-environment-setup on GitHub
        ↓
GitHub starts the workflow job on a temporary Ubuntu 22.04 VM
        ↓
Print runner OS/kernel and check out the required repositories
        ↓
Generate CI configuration and validate the two Compose projects
        ↓
Build/start Keycloak, Consent-Manager and their dependencies
        ↓
Check service readiness
        ↓
Collect logs, upload artifacts and remove the temporary containers/volumes
```

A local `git commit` does not trigger GitHub Actions. The commit must be pushed
to a branch matched by the workflow. The manual trigger is an additional entry
point, subject to the default-branch requirement described below.

The VM contains a fresh job workspace identified by `$GITHUB_WORKSPACE`.
GitHub does not read the developer's `/opt/...` directory or use the
developer's running containers. Source files must be available in the repositories
and revisions selected by the workflow. The VM is temporary; this workflow does
not publish a persistent application endpoint for users to visit after the run.

### Runner configuration

The workflow currently has these settings:

| Setting | Current value |
| --- | --- |
| Runner | `ubuntu-22.04`, GitHub-hosted |
| Job timeout | 60 minutes |
| Push trigger | `consent-manager-environment-setup` branch only |
| Manual trigger | `workflow_dispatch` |
| Default token permission | `contents: read` |
| Concurrency | One active run per workflow concurrency group/ref; newer runs cancel earlier ones |
| Checkout action | `actions/checkout@v7.0.1` |
| Artifact action | `actions/upload-artifact@v7.0.2` |
| Artifact retention | 7 days |

The job selects the runner using:

```yaml
jobs:
  environment:
    name: Build and check environment
    runs-on: ubuntu-22.04
```

The first step, **Show runner OS and Docker kernel**, records the operating-system
release, host kernel, Docker kernel and Compose version. The Ubuntu release label
does not pin a particular kernel version. Retain these diagnostics when updating
the runner image or investigating a container startup failure.

### How Compose files and Dockerfiles reach the VM

The workflow uses `actions/checkout` to download repositories into the runner's
workspace. It checks out the parent environment repository at the manifest SHA,
then places each application repository at the nested path expected by Compose.
The repository token authorizes access to the private dependency repositories.

Checking out `DIPS-Tools/dips-local-dev` provides both
`docker-compose.yml` and the `keycloak/` directory, including its Compose file,
Dockerfile and exported realm. Keycloak is therefore supplied by the parent
checkout; it is not downloaded from the developer's local machine.

The runner assembles this layout:

```text
$GITHUB_WORKSPACE/
├── consent-manager-ci/          workflow revision, used to run CI helpers
└── dips-local-dev/              pinned parent repository
    ├── docker-compose.yml
    ├── Consent-Manager/         workflow revision, used as application source
    │   ├── Dockerfile.frontend
    │   └── Dockerfile.backend
    ├── User-Management/         pinned dependency
    │   └── Dockerfile
    ├── Contract_Service/        pinned dependency
    │   └── Dockerfile
    ├── Negotiation-Tool/        pinned dependency
    │   └── Dockerfile.api
    ├── keycloak/                supplied by the parent checkout
    │   ├── docker-compose.yml
    │   ├── Dockerfile
    │   └── keycloak-dips-services-export/
    │       └── dips_services-realm.json
    └── .cm-ci/                  generated state and configuration
```

The two Consent-Manager checkouts are intentional: one provides helper scripts
outside the environment tree, while the other supplies the application at the
relative path expected by Compose.

The parent is checked out **before** the nested repositories. Checking out and
cleaning the parent afterwards could remove the nested checkouts.

### How Docker Compose uses the checked-out files

A Compose file defines services, build contexts, images, ports, volumes,
environment variables and dependencies. A Dockerfile defines how to build an
individual container image. Compose uses the build paths to find the Dockerfiles
inside the downloaded repositories.

For example, the parent Compose configuration specifies:

```yaml
consent-manager-api:
  build:
    context: ./Consent-Manager
    dockerfile: Dockerfile.backend
```

The selected project directory is `$GITHUB_WORKSPACE/dips-local-dev`, so the
build context resolves to its `Consent-Manager/` directory. Docker reads
`Consent-Manager/Dockerfile.backend` and builds the API image from that context.
For the Keycloak Compose project, the project directory is
`$GITHUB_WORKSPACE/dips-local-dev/keycloak`; its `context: .` selects that
directory and its Dockerfile.

Services defined with an `image:` setting, such as MongoDB, use a registry image
instead of a Dockerfile from an application checkout. Docker pulls the image
when needed.

The helper script selects the files explicitly for each project:

| Project | Base Compose file | Generated CI override |
| --- | --- | --- |
| Application | `dips-local-dev/docker-compose.yml` | `.cm-ci/application.override.json` |
| Keycloak | `dips-local-dev/keycloak/docker-compose.yml` | `.cm-ci/keycloak.override.json` |

Both commands also select `.cm-ci/environment.env` and a generated project name.
Application builds and runtime bind mounts therefore read the runner's checked-out
files. Editing a local dependency is insufficient to change a run: push that
dependency change and update its SHA in `ci/dependencies.json`.

### Manual and pull-request triggers

The manual trigger normally requires the workflow to exist on the repository's
default branch. The branch push trigger is available for initial development.
Pull-request and default-branch push triggers have not yet been added. When
adding pull-request checks, account for the fact that fork runs generally do not
receive repository secrets; do not execute untrusted PR code with privileged
`pull_request_target` credentials.

## 7. Prepare the CI configuration

The workflow runs:

```bash
python3 consent-manager-ci/ci/environment.py prepare \
  --root "$GITHUB_WORKSPACE/dips-local-dev"
```

Preparation verifies the required files and Keycloak clients, detects the
runner's IPv4 address, and generates:

```text
.cm-ci/
├── environment.env
├── state.json
├── revisions.json
├── application.override.json
├── keycloak.override.json
└── realm/
    └── dips_services-realm.json
```

The JSON override files are Compose configuration files; Compose accepts their
JSON structure. Preparation refuses to overwrite existing `.cm-ci` state.

The generated variables include:

| Group | Examples and purpose |
| --- | --- |
| Addresses | `HOST_ADDR`, `KEYCLOAK_HOST_ADDR`, `ALLOWED_HOSTS` use the runner address |
| Application paths | `/consent-manager` and `/negotiation` |
| Realm | `REALMS_NAME` comes from the exported realm |
| MongoDB | Database names, container hostname, port, and generated root password |
| Application secrets | Generated master password, session secret and email-link secret |
| Keycloak/MySQL | Generated administrator and database passwords |
| External SDK configuration | Dummy OpenAI/Resend keys for startup; no real service credentials |

The parent `.env` is not read or modified by the preparation script. Every
Compose invocation selects `.cm-ci/environment.env` explicitly, and the script
overrides matching inherited environment variables with generated values.

Configuration files contain disposable secrets and are not uploaded as artifacts.
The generated env file uses mode `0600`, and generated runtime state is kept
under a restricted directory. Do not publish that directory.

## 8. Keycloak initialization and networking

The original Keycloak Compose setup starts a server but does not import the
application realm automatically. The CI override adds:

- A MySQL readiness check that executes a database query.
- A healthy-database dependency for Keycloak.
- A mount into `/opt/keycloak/data/import`.
- The startup command `start-dev --import-realm`.
- Generated database/admin credentials and an explicit advertised hostname.

The CI realm is derived from the parent export. Exported users, signing-key
components, identity providers and SMTP configuration are removed. Existing
client secrets are regenerated. Redirect URLs and web origins for the relevant
web clients are adapted to the runner address. Keycloak generates fresh signing
keys. No application test users are seeded at this stage.

The CI realm uses `sslRequired: none` for this disposable HTTP environment.
This is not a production Keycloak configuration. The source realm export and
the local Keycloak deployment are unchanged.

Both browser-facing URLs and container requests use the runner's reachable IPv4
address and the published Keycloak port `9090`. Using `localhost` inside an
application container would point at that container, not the separate Keycloak
container. An explicit hostname keeps Keycloak's token issuer consistent with
the application configuration.

Readiness checks verify realm discovery from the runner and from the
Consent-Manager/User Management API containers. Relevant upstream guidance:
[realm imports](https://www.keycloak.org/server/importExport) and
[hostname configuration](https://www.keycloak.org/server/hostname).

## 9. Build, start and check the services

After generating configuration, the workflow runs `validate`, then `start`.
Startup follows this sequence:

1. Start Keycloak's MySQL service and wait for readiness.
2. Build/start Keycloak with realm import enabled.
3. Poll the realm discovery endpoint, allowing up to 300 seconds.
4. Build/start `consent-manager` and `user-management-web` with their declared
   dependencies, using Compose `--wait --wait-timeout 300`.
5. Run the separate `check` command after startup succeeds.

The effective main-stack startup command has this form; the script adds the
explicit env file, project name and both Compose file paths:

```bash
docker compose up -d --build --wait --wait-timeout 300 \
  consent-manager user-management-web
```

The application stack includes:

| Service | Role / runner port where published |
| --- | --- |
| `consent-manager` | Frontend, `5174` |
| `consent-manager-api` | API, `8019` |
| `user-management-api` | User Management API, `8800` |
| `user-management-web` | User Management frontend, `8801` |
| `contract-service` | Contract API, `8866` |
| `negotiation-api` | Negotiation API, `8002` |
| `mongo` | Application database, `27018` |
| `kafka` | Event broker |
| `zookeeper` | Kafka dependency |

Negotiation API is required by the existing Consent-Manager dependency chain,
and brings Kafka/Zookeeper into the environment. The CI override adds a Kafka
broker readiness check and makes Negotiation API wait for it. User Management
web runs `python manage.py migrate --noinput` before starting Django.

Policy Editor, RepuLink, Mongo Express and Negotiation web are not started.
Future tests that navigate to Negotiation web will need that service added.

The `check` command verifies:

- Keycloak realm discovery and the expected issuer URL.
- User Management API `/health`, Contract Service `/docs`, and Negotiation API `/docs`.
- Consent-Manager API `/health` and frontend `/consent-manager/`.
- User Management web `/user-management/`.
- Container-to-Keycloak connectivity.
- Keycloak bootstrap administrator authentication and presence of required clients.

These are startup/readiness checks, not feature tests. For example, a successful
`/docs` response does not prove a contract can be created. Real AI/email
functionality is excluded: dummy keys are provided, and OpenAI clients are
directed to a closed local port.

## 10. Validation performed during implementation

The following implementation checks passed:

- Seven helper regression tests.
- Python syntax checks.
- Workflow YAML parsing and embedded shell syntax checks.
- Both merged Compose configurations in a separate temporary checkout.
- Expected build paths and dependency coverage.
- Merged Kafka/MySQL health dependency conditions and Django migration command.
- Shared credential consistency between Keycloak/MySQL and User Management.
- Manifest commits matching the temporary dependency checkouts.

Run the helper tests without starting containers:

```bash
cd /opt/local_test/dips-local-dev/Consent-Manager
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s ci -p 'test_*.py' -v
```

For configuration validation, first assemble a separate temporary checkout with
the layout in section 2. Then, from Consent-Manager, run:

```bash
python3 ci/environment.py prepare \
  --root /tmp/cm-check/dips-local-dev --host 192.0.2.10
python3 ci/environment.py validate \
  --root /tmp/cm-check/dips-local-dev
```

`192.0.2.10` is an example address for offline configuration validation, not a
working runtime address. The temporary repositories must exist before these
commands are run. `validate` invokes Compose configuration rendering, not
container startup. Do not print the fully expanded configuration in shared logs
because it includes credentials.

The script intentionally refuses `start`, `check`, `logs` and `stop` outside a
GitHub-hosted runner workspace. Fixed published ports could conflict with the
existing local deployment even though container/network names are unique.

No local containers were started or stopped during the implementation checks.
Configuration validation and runtime validation are separate: rendering a valid
Compose configuration does not prove that an image can start on the runner kernel.

The reported successful runtime validation used:

| Item | Observed result |
| --- | --- |
| Runner label | `ubuntu-22.04` |
| Operating system | Ubuntu 22.04.5 LTS |
| Host and Docker kernel | `6.8.0-1070-azure` |
| Architecture | `x86_64` |
| Docker Compose | `v2.38.2` |
| Workflow result | Completed without errors |
| Run duration | 5 minutes 26 seconds |

These observations establish a successful environment setup run. They do not
extend the checks to application features that are not part of the workflow.

## 11. Commit, push and inspect a run

Ensure the repository secret is configured before pushing. Review the files:

```bash
cd /opt/local_test/dips-local-dev/Consent-Manager
git branch --show-current
git status --short
git add .github/workflows/environment-check.yml ci/ docs/build_github_action_workflow.md
git diff --cached --stat
git diff --cached
```

Commit only if the staged changes are the ones intended. If the workflow is
already committed, use a message describing the new documentation or fix:

```bash
git commit -m "Document Consent-Manager GitHub Actions environment setup"
git push -u origin consent-manager-environment-setup
```

The branch push starts **Consent-Manager environment startup**. In GitHub,
open **Actions**, select the run, and inspect **Build and check environment**.
Later changes on the same branch can be pushed with `git push`.

Re-running an old workflow run uses its original revision. To test a code fix,
commit and push the fix, then inspect the newly triggered run.

The existing repository-sync workflow targets `dips-branch-mongodb`; the new
environment branch does not match that trigger.

## 12. MongoDB kernel compatibility and troubleshooting

### Diagnosis and verified runner change

The initial Ubuntu 24.04 run reached Keycloak readiness but MongoDB exited with
code 1. The MongoDB service log identified the compatibility failure:

```text
MongoDB cannot start: Linux kernel versions 6.19 and newer has a known
incompatibility with this version of MongoDB.
```

The diagnostic step showed Ubuntu 24.04.5 LTS with kernel
`7.0.0-1017-azure`. Docker reported the same kernel. This identified an
image/kernel compatibility failure rather than a missing Compose file or a
repository authentication failure.

The workflow runner was changed from `ubuntu-24.04` to `ubuntu-22.04`. The
subsequent run used kernel `6.8.0-1070-azure` and completed without errors.
The runner change resolved the observed startup failure without modifying the
local MongoDB deployment or disabling authentication.

MongoDB documents the affected kernel range and compatibility updates in its
[release notes](https://www.mongodb.com/docs/v8.0/release-notes/8.0/) and
[SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912). Check the exact
MongoDB build and kernel when changing either dependency; an Ubuntu version
label alone is not a permanent compatibility guarantee.

### Locate runner diagnostics

In the repository, open **Actions → Consent-Manager environment startup → the
relevant run → Build and check environment → Show runner OS and Docker kernel**.
This step executes:

```bash
cat /etc/os-release
uname -a
docker info --format 'Docker kernel: {{.KernelVersion}}; OS: {{.OperatingSystem}}; architecture: {{.Architecture}}'
docker compose version
```

Inspect a run created from the updated workflow revision. Re-running an older
revision does not add newly committed diagnostic steps to that revision.

### Investigate subsequent failures

For future failures, use service logs to identify the cause before changing
configuration:

1. Open **Actions → the failed run**.
2. Confirm **Collect diagnostic logs** and **Upload diagnostic logs** ran.
3. Under **Artifacts**, download `cm-environment-<run_id>-<run_attempt>`.
4. Open `application-logs.txt` and locate the lines for `app-mongo`.
5. Read MongoDB's startup error and the preceding context. Compare its status
   with `application-status.txt` and record the revisions from `revisions.json`.
6. Choose a targeted fix based on those logs, validate it, commit/push it, and
   inspect the new run. Do not change the local database or disable authentication
   merely to work around the summary error.

If no artifact exists, inspect the collection/upload steps. Failure before
preparation produces no runtime state, so the collection script may legitimately
have nothing to collect. Artifacts also expire after seven days.

Other useful checks:

| Symptom | First evidence to inspect |
| --- | --- |
| Missing `CI_REPO_READ_TOKEN` | Repository secret name and which repository received the push |
| Dependency checkout denied/not found | Token access, expiration, organization policy/SSO and manifest repository/ref |
| Keycloak readiness timeout | `keycloak-logs.txt`, MySQL status and realm import errors |
| Application image build fails | Build output in the workflow step; container logs may not exist yet |
| Issuer mismatch or container connection failure | Generated address strategy, Keycloak hostname and container connectivity check |
| New fix appears ineffective | Confirm the run's commit and dependency SHAs rather than re-running an old revision |

The MongoDB kernel compatibility issue described above is resolved for the
reported Ubuntu 22.04 run. Any later startup failure requires assessment of its
own logs and image/kernel versions.

## 13. Logs and cleanup

Log collection, artifact upload and cleanup each use `if: always()` so they are
attempted after a failed earlier step. Expected artifact files are:

```text
application-status.txt
application-logs.txt
keycloak-status.txt
keycloak-logs.txt
revisions.json
readiness.txt          only after readiness checks succeed
```

Logs are bounded to the last 500 lines per service, with known generated secret
values redacted. Do not assume this removes every possible sensitive value if
new tests or integrations later introduce additional data.

Cleanup runs Compose `down --volumes --remove-orphans` for the generated
application project and then the generated Keycloak project. Both are attempted
if the first command returns a failure. This intentionally removes disposable
test databases. Do not run those commands against the existing local deployment.

Abrupt runner termination can prevent cleanup steps from executing; the
GitHub-hosted runner is itself temporary. The workflow is not intended for a
shared or persistent self-hosted runner without further changes.

## 14. Integrating automated application tests

Application test integration requires the test repository/branch or files,
installation and execution commands, expected URLs, required accounts/roles,
and test data definitions.

Then:

1. Add deterministic test-user and database fixture setup as needed.
2. Install the test runner and any browser dependencies.
3. Add the test command after **Check environment readiness**.
4. Preserve nonzero test exit codes so failures fail the job.
5. Upload reports/screenshots separately from service logs.
6. Keep log collection and cleanup unconditional.
7. After reliable runs, agree on pull-request/default-branch triggers and handling
   of private dependencies for fork contributions.

Do not add `npm test` as a placeholder: at implementation time Consent-Manager's
`package.json` had no `test` script. The actual command must come from the test
suite being integrated.

## 15. Completion criteria

Stage one is complete when a fresh GitHub-hosted runner can check out the intended
revisions, build/start both Compose projects, import the realm without manual
configuration, pass all readiness checks, retain diagnostic artifacts, and clean
up the disposable resources.

Stage two is complete only after the agreed application tests run and report
their results. Keep the workflow's environment-readiness result distinct from
application test coverage.
