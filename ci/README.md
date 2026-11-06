# Consent-Manager environment startup

This is stage one of Paolo's request: build a fresh environment on a GitHub-hosted
Ubuntu runner and verify that its services are ready. It does not run Jaime's
feature tests, create application users, or verify consent operations.

## What runs

The workflow checks out `DIPS-Tools/dips-local-dev` first, then places the
Consent-Manager revision under test and the three dependency repositories inside
it. Keycloak's Dockerfile, Compose file and realm export come from the parent
repository's `keycloak/` directory.

```text
dips-local-dev/
  docker-compose.yml
  Consent-Manager/
  User-Management/
  Contract_Service/
  Negotiation-Tool/
  keycloak/
  .cm-ci/                  generated configuration, not committed
```

Two Compose projects run:

- Keycloak and MySQL, with automatic realm import and database readiness checks.
- Consent-Manager frontend/API, User Management web/API, Contract Service,
  Negotiation API, MongoDB, Kafka and Zookeeper.

Negotiation API, Kafka and Zookeeper are included because the parent Compose file
declares them as dependencies of Consent-Manager. The unrelated Policy Editor,
RepuLink, Mongo Express and Negotiation web services are not started. The latter
will need adding if future tests navigate to the negotiation UI.

The User Management frontend runs Django migrations before starting. MongoDB
starts empty; no business data is seeded.

## First GitHub run

1. Review and commit this branch, `consent-manager-environment-setup`.
2. In the Consent-Manager GitHub repository, open **Settings → Secrets and
   variables → Actions** and add `CI_REPO_READ_TOKEN`. Dependencies span two
   organizations, so one fine-grained token cannot read private repositories in
   both. The current single-secret design can use a classic token with `repo`
   scope if both organizations permit it; this permission is broader than
   read-only. Alternatively, adapt the checkout steps to use two fine-grained
   tokens with **Contents: read**, one per organization. See the
   [detailed authentication steps](../docs/build_github_action_workflow.md#5-github-authentication-name-and-secret).
   Organization approval/SSO authorization may be required. Never paste the
   token into a script, workflow file, commit or chat.
3. Push this branch. Its push trigger starts **Consent-Manager environment
   startup**. Existing repository-sync automation only targets
   `dips-branch-mongodb`, so this branch does not match that trigger.
4. Open **Actions**, select the run, and inspect the startup and readiness steps.
   A successful run explicitly says that Jaime's feature tests have not run.
5. Download the `cm-environment-<run>-<attempt>` artifact if troubleshooting is
   needed. It contains bounded, redacted logs, service status and checked-out
   revisions, not the generated environment or realm files.

`workflow_dispatch` is also configured, but GitHub normally requires the workflow
to exist on the repository's default branch for its manual trigger to be available.
Use the branch push trigger for the first run. Pull-request and default-branch
push triggers are deliberately deferred until the initial setup has been proven
and the target branch/fork policy agreed. Do not use `pull_request_target` to run
untrusted code with the dependency token.

## Configuration and isolation

`environment.py prepare` creates `.cm-ci/environment.env` and Compose overrides.
It never reads or modifies the parent's `.env`. It supplies the variable names
required by the current Compose setup using disposable credentials. Every Compose
command uses this explicit env file and a unique project name; the application
network and container names are overridden too.

The runner IPv4 address is used for both `HOST_ADDR` and `KEYCLOAK_HOST_ADDR`.
Keycloak advertises that exact URL, and readiness checks verify issuer consistency
and access from the Consent-Manager and User Management API containers. Published
ports match local development, including Keycloak 9090, Consent-Manager API 8019,
frontend 5174, and User Management API 8800.

The CI realm is derived from the parent's export. Exported users, signing-key
components, identity providers and SMTP settings are removed; client secrets are
regenerated. Application redirect URLs and web origins use the runner address.
Keycloak generates fresh signing keys. HTTP is allowed in this disposable realm;
these settings are not intended for production. No real email or OpenAI keys are
required. Dummy nonempty keys allow SDK initialization; OpenAI clients are pointed
at a closed local port. AI and email functionality are outside these checks.

Container operations (`start`, `check`, `logs`, `stop`) refuse to run outside a
GitHub-hosted runner's workspace. Do not remove this guard to run beside an existing
deployment: published ports remain fixed. Logs and cleanup have `always()` workflow
conditions, and cleanup attempts both projects even if one fails. Abrupt runner
termination may bypass cleanup; the hosted runner itself is disposable.

## Verification without starting containers

Run the script regression checks from Consent-Manager:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s ci -p 'test_*.py' -v
```

For Compose validation, first assemble a **separate temporary checkout** using
the directory layout above, then run:

```bash
python3 ci/environment.py prepare --root /tmp/cm-check/dips-local-dev --host 192.0.2.10
python3 ci/environment.py validate --root /tmp/cm-check/dips-local-dev
```

The example IP is a documentation address for configuration validation only.
On GitHub the address is detected automatically. `validate` uses `docker compose
config`, validates required build paths and dependency coverage, and does not start
containers or print expanded credentials. It needs Docker Compose installed.
Preparation refuses to overwrite existing `.cm-ci` state.

Passing these checks proves configuration validity, not successful image builds or
runtime startup. Only an actual GitHub run validates those.

## Versions and adding tests

`dependencies.json` pins the parent and dependency Git commits to the revisions
present during implementation. Update them intentionally and check their GitHub
availability with the first run. Consent-Manager always uses the workflow's own
revision. Action releases use explicit version tags. Existing upstream Dockerfiles
and image tags are reused; npm/pip resolution and base image tags can still change,
so this is not a fully immutable image build.

When Jaime's tests are available, add his install/run command after **Check
environment readiness** and before log collection. Agree on realm users, roles,
MongoDB fixtures and external-service requirements before enabling those tests.
Upload test reports separately and preserve the unconditional cleanup steps.

References: [multi-repository checkout](https://github.com/actions/checkout),
[Keycloak realm import](https://www.keycloak.org/server/importExport),
[Keycloak hostname configuration](https://www.keycloak.org/server/hostname),
[Compose readiness](https://docs.docker.com/compose/how-tos/startup-order/).
