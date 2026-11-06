#!/usr/bin/env python3
"""Prepare/check the parent Compose stack. Container operations require a hosted runner."""

import argparse
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import time
import urllib.parse
import urllib.request


SERVICES = [
    "mongo", "zookeeper", "kafka", "user-management-api", "user-management-web",
    "contract-service", "negotiation-api", "consent-manager-api", "consent-manager",
]


REQUIRED_CLIENTS = [
    "consent-manager", "user-management-api", "user-management-web",
    "contract-service", "negotiation-api",
]


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def prepare(root, host):
    runtime = root / ".cm-ci"
    if runtime.exists():
        raise RuntimeError(f"Refusing to replace existing CI state: {runtime}")
    required = ["docker-compose.yml", "keycloak/docker-compose.yml", "keycloak/Dockerfile",
                "keycloak/keycloak-dips-services-export/dips_services-realm.json",
                "Consent-Manager/Dockerfile.backend", "Consent-Manager/Dockerfile.frontend",
                "User-Management/Dockerfile", "Contract_Service/Dockerfile",
                "Negotiation-Tool/Dockerfile.api"]
    for filename in required:
        if not (root / filename).is_file():
            raise RuntimeError(f"Missing checkout file: {filename}")
    if not host:
        routes = json.loads(subprocess.check_output(
            ["ip", "-j", "route", "get", "1.1.1.1"], text=True))
        host = routes[0]["prefsrc"]
    address = ipaddress.IPv4Address(host)
    if address.is_loopback or address.is_unspecified:
        raise RuntimeError("Use a host IPv4 address reachable from Docker containers, not loopback")
    host = str(address)
    realm = json.loads((root / required[3]).read_text())
    realm_name = realm["realm"]
    if not re.fullmatch(r"[A-Za-z0-9_-]+", realm_name):
        raise RuntimeError("Unexpected realm name")
    existing_clients = {c["clientId"] for c in realm["clients"]}
    if not set(REQUIRED_CLIENTS).issubset(existing_clients):
        raise RuntimeError("The exported realm is missing required application clients")

    runtime.mkdir(mode=0o700)
    (runtime / "realm").mkdir()
    values = {
        "HOST_ADDR": host, "KEYCLOAK_HOST_ADDR": host, "ALLOWED_HOSTS": host,
        "REALMS_NAME": realm_name, "USE_EMULATOR": "false", "VITE_USE_EMULATOR": "false",
        "PORT": "8019", "CONSENT_MANAGER_BASE_PATH": "/consent-manager",
        "NEGOTIATION_WEB_BASE_PATH": "/negotiation", "MONGO_USER": "root",
        "MONGO_HOST": "mongo", "MONGO_PORT": "27017", "MONGO_DB": "dips_services",
        "USER_MONGO_DB": "dips_services", "KEYCLOAK_ADMIN_USERNAME": "ci-admin",
        "CONSUMER_DASHBOARD_USERNAME": "ci-consumer", "PROVIDER_DASHBOARD_USERNAME": "ci-provider",
        # SDK constructors need nonempty keys even though readiness checks never call them.
        "OPENAI_API_KEY": "sk-ci-placeholder-not-a-real-key",
        "OPENAI_AGENT_MODEL": "gpt-4o-mini", "RESEND_API_KEY": "re_ci_placeholder_not_a_real_key",
        "REPULINK_POSTGRES_USER": "ci", "REPULINK_POSTGRES_DB": "ci",
        "REPULINK_FIRST_SUPERUSER": "ci@example.invalid",
    }
    for name in ["MASTER_PASSWORD", "MONGO_PASSWORD", "CONSENT_MANAGER_SESSION_SECRET",
                 "EMAIL_LINK_SECRET", "KEYCLOAK_ADMIN_PASSWORD", "CI_MYSQL_PASSWORD",
                 "CI_MYSQL_ROOT_PASSWORD", "CONSUMER_DASHBOARD_PASSWORD",
                 "PROVIDER_DASHBOARD_PASSWORD", "REPULINK_POSTGRES_PASSWORD",
                 "REPULINK_SECRET_KEY", "REPULINK_FIRST_SUPERUSER_PASSWORD"]:
        values[name] = secrets.token_hex(24)
        if os.environ.get("GITHUB_ACTIONS") == "true":
            print(f"::add-mask::{values[name]}")
    (runtime / "environment.env").write_text("".join(f"{k}={v}\n" for k, v in values.items()))
    (runtime / "environment.env").chmod(0o600)
    write_json(runtime / "state.json", {"root": str(root), "project": "cm-ci-" + secrets.token_hex(5)})

    # Generate fresh signing keys; discard exported integrations, accounts and mail settings.
    for key in ["users", "federatedUsers", "components", "identityProviders",
                "identityProviderMappers", "smtpServer"]:
        realm.pop(key, None)
    realm["sslRequired"] = "none"  # Only for the disposable HTTP environment.
    realm["attributes"] = {"frontendUrl": f"http://{host}:9090"}
    ui_origins = {
        "consent-manager": f"http://{host}:5174",
        "user-management-web": f"http://{host}:8801",
        "negotiation-web": f"http://{host}:8001",
        "contract-service": f"http://{host}:8866",
    }
    for client in realm["clients"]:
        client.pop("registrationAccessToken", None)
        if "secret" in client:
            client["secret"] = secrets.token_hex(24)
        if client["clientId"] in ui_origins:
            origin = ui_origins[client["clientId"]]
            client.update(rootUrl=origin, baseUrl=origin, adminUrl="",
                          redirectUris=[origin + "/*"], webOrigins=[origin])
            client.setdefault("attributes", {})["post.logout.redirect.uris"] = origin + "/*"
    write_json(runtime / "realm" / f"{realm_name}-realm.json", realm)

    keycloak_override = {"services": {
        "mysql": {
            "container_name": "${COMPOSE_PROJECT_NAME}-mysql", "restart": "no",
            "environment": {"MYSQL_PASSWORD": "${CI_MYSQL_PASSWORD}",
                            "MYSQL_ROOT_PASSWORD": "${CI_MYSQL_ROOT_PASSWORD}"},
            "healthcheck": {
                "test": ["CMD-SHELL", 'MYSQL_PWD="$${MYSQL_PASSWORD}" mysql -h 127.0.0.1 -u keycloak -D keycloak -e "SELECT 1"'],
                "interval": "5s", "timeout": "5s", "retries": 40, "start_period": "30s"}},
        "keycloak": {
            "container_name": "${COMPOSE_PROJECT_NAME}-keycloak", "restart": "no",
            "depends_on": {"mysql": {"condition": "service_healthy"}},
            "environment": {"KC_BOOTSTRAP_ADMIN_USERNAME": "${KEYCLOAK_ADMIN_USERNAME}",
                            "KC_BOOTSTRAP_ADMIN_PASSWORD": "${KEYCLOAK_ADMIN_PASSWORD}",
                            "KC_DB_PASSWORD": "${CI_MYSQL_PASSWORD}",
                            "KC_HOSTNAME": "http://${KEYCLOAK_HOST_ADDR}:9090"},
            "volumes": [f"{runtime / 'realm'}:/opt/keycloak/data/import:ro"],
            "command": ["start-dev", "--import-realm"]}}}
    write_json(runtime / "keycloak.override.json", keycloak_override)
    app_override = {
        "services": {name: {"container_name": "${COMPOSE_PROJECT_NAME}-" + name,
                            "restart": "no"} for name in SERVICES},
        "networks": {"dips-local": {"name": "${COMPOSE_PROJECT_NAME}-network"}},
    }
    # No real external calls are needed for startup; direct AI clients to a closed local port.
    for name in ["contract-service", "negotiation-api"]:
        app_override["services"][name]["environment"] = {"OPENAI_BASE_URL": "http://127.0.0.1:9"}
    app_override["services"]["kafka"]["healthcheck"] = {
        "test": ["CMD-SHELL", "kafka-topics --bootstrap-server localhost:9092 --list >/dev/null"],
        "interval": "10s", "timeout": "10s", "retries": 20, "start_period": "30s",
    }
    app_override["services"]["negotiation-api"]["depends_on"] = {
        "kafka": {"condition": "service_healthy"},
    }
    app_override["services"]["user-management-web"]["command"] = [
        "sh", "-c", "python manage.py migrate --noinput && "
        "python manage.py runserver 0.0.0.0:8801 --nostatic --noreload",
    ]
    write_json(runtime / "application.override.json", app_override)
    revisions = {}
    for name in [".", "Consent-Manager", "User-Management", "Contract_Service", "Negotiation-Tool"]:
        revisions[name] = subprocess.check_output(
            ["git", "-C", str(root / name), "rev-parse", "HEAD"], text=True).strip()
    write_json(runtime / "revisions.json", revisions)
    print("Prepared disposable CI configuration; existing .env files were not read or changed.")


class Environment:
    def __init__(self, root):
        self.root = root
        self.runtime = root / ".cm-ci"
        self.state = json.loads((self.runtime / "state.json").read_text())
        if self.state["root"] != str(root):
            raise RuntimeError("CI state belongs to a different checkout")
        self.values = dict(line.split("=", 1) for line in
                           (self.runtime / "environment.env").read_text().splitlines())
        self.env = {k: v for k, v in os.environ.items() if not k.startswith("COMPOSE_")}
        self.env.update(self.values)

    def hosted_only(self):
        workspace = Path(os.environ.get("GITHUB_WORKSPACE", "/nonexistent")).resolve()
        if (os.environ.get("GITHUB_ACTIONS") != "true"
                or os.environ.get("RUNNER_ENVIRONMENT") != "github-hosted"
                or not self.root.is_relative_to(workspace) or self.root == workspace):
            raise RuntimeError("Container operations are restricted to a disposable GitHub-hosted runner")

    def compose(self, project, *args, capture=False, check=True):
        keycloak = project == "keycloak"
        directory = self.root / "keycloak" if keycloak else self.root
        override = "keycloak" if keycloak else "application"
        command = ["docker", "compose", "--project-directory", str(directory),
                   "--env-file", str(self.runtime / "environment.env"),
                   "-p", self.state["project"] + ("-kc" if keycloak else "-app"),
                   "-f", str(directory / "docker-compose.yml"),
                   "-f", str(self.runtime / f"{override}.override.json"), *args]
        return subprocess.run(command, env=self.env, text=True, check=check,
                              stdout=subprocess.PIPE if capture else None,
                              stderr=subprocess.STDOUT if capture else None)

    def validate(self):
        for project in ["keycloak", "application"]:
            result = self.compose(project, "config", "--format", "json", capture=True)
            config = json.loads(result.stdout)
            services = ["mysql", "keycloak"] if project == "keycloak" else SERVICES
            for name in services:
                service = config["services"][name]
                build = service.get("build")
                if build:
                    context = Path(build["context"])
                    if not (context / build.get("dockerfile", "Dockerfile")).is_file():
                        raise RuntimeError(f"Missing build context for {name}")
                for dependency in service.get("depends_on", {}):
                    if dependency not in services:
                        raise RuntimeError(f"Unaccounted dependency: {name} -> {dependency}")
            if project == "application":
                if config["networks"]["dips-local"]["name"] == "dips-local":
                    raise RuntimeError("CI must not reuse the local network")
        print("Both Compose configurations and required build contexts validated.")

    def discovery(self):
        return (f'http://{self.values["KEYCLOAK_HOST_ADDR"]}:9090/realms/'
                f'{self.values["REALMS_NAME"]}/.well-known/openid-configuration')

    def start(self):
        self.hosted_only()
        self.validate()
        self.compose("keycloak", "up", "-d", "--wait", "--wait-timeout", "300", "mysql")
        self.compose("keycloak", "up", "-d", "--build", "keycloak")
        wait_http("Keycloak realm", self.discovery(), timeout=300)
        self.compose("application", "up", "-d", "--build", "--wait", "--wait-timeout", "300",
                     "consent-manager", "user-management-web")

    def check(self):
        self.hosted_only()
        discovery = json.loads(wait_http("Keycloak realm", self.discovery()))
        expected = self.discovery().removesuffix("/.well-known/openid-configuration")
        if discovery["issuer"] != expected:
            raise RuntimeError("Keycloak issuer does not match application configuration")
        host = self.values["HOST_ADDR"]
        for label, port, path in [
            ("User Management API", 8800, "/health"), ("Contract Service", 8866, "/docs"),
            ("Negotiation API", 8002, "/docs"), ("Consent-Manager API", 8019, "/health"),
            ("Consent-Manager frontend", 5174, "/consent-manager/"),
            ("User Management web", 8801, "/user-management/")]:
            wait_http(label, f"http://{host}:{port}{path}")
        # Verify the actual container-to-Keycloak route, not only host access.
        self.compose("application", "exec", "-T", "consent-manager-api", "node", "-e",
                     "fetch(process.env.KEYCLOAK_URL + '/realms/' + process.env.KEYCLOAK_REALM + "
                     "'/.well-known/openid-configuration', {signal: AbortSignal.timeout(10000)})"
                     ".then(async r => {if (!r.ok) throw Error('Keycloak HTTP ' + r.status); "
                     "const d = await r.json(); if (d.issuer !== process.env.KEYCLOAK_URL + "
                     "'/realms/' + process.env.KEYCLOAK_REALM) throw Error('Issuer mismatch');})"
                     ".catch(e => {console.error(e.message); process.exit(1);});")
        self.compose("application", "exec", "-T", "user-management-api", "python", "-c",
                     "import os,urllib.request; "
                     "urllib.request.urlopen(os.environ['KEYCLOAK_ISSUER'] + "
                     "'/.well-known/openid-configuration', timeout=10).read()")
        # Check bootstrap credentials and required imported clients without creating test accounts.
        base = f'http://{self.values["KEYCLOAK_HOST_ADDR"]}:9090'
        data = urllib.parse.urlencode({"grant_type": "password", "client_id": "admin-cli",
                                      "username": self.values["KEYCLOAK_ADMIN_USERNAME"],
                                      "password": self.values["KEYCLOAK_ADMIN_PASSWORD"]}).encode()
        with urllib.request.urlopen(base + "/realms/master/protocol/openid-connect/token", data, timeout=15) as response:
            token = json.load(response)["access_token"]
        request = urllib.request.Request(base + "/admin/realms/" + self.values["REALMS_NAME"] + "/clients",
                                         headers={"Authorization": "Bearer " + token})
        with urllib.request.urlopen(request, timeout=15) as response:
            clients = {c["clientId"] for c in json.load(response)}
        if not set(REQUIRED_CLIENTS).issubset(clients):
            raise RuntimeError("Required clients were not imported")
        result = "Environment startup checks passed. Jaime's feature tests have not been run.\n"
        (self.runtime / "readiness.txt").write_text(result)
        print(result)
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as summary:
                summary.write(result)

    def logs(self):
        self.hosted_only()
        artifacts = self.runtime / "artifacts"
        artifacts.mkdir(exist_ok=True)
        sensitive = [v for k, v in self.values.items()
                     if any(word in k for word in ["PASSWORD", "SECRET", "KEY"]) and len(v) >= 8]
        for project in ["keycloak", "application"]:
            for name, args in [("status", ["ps", "--all"]),
                               ("logs", ["logs", "--no-color", "--tail", "500"])]:
                output = self.compose(project, *args, capture=True, check=False).stdout
                for value in sensitive:
                    output = output.replace(value, "[REDACTED]")
                (artifacts / f"{project}-{name}.txt").write_text(output)
        for name in ["revisions.json", "readiness.txt"]:
            source = self.runtime / name
            if source.exists():
                (artifacts / name).write_text(source.read_text())
        print("Saved redacted logs and revision information; configuration/realm files are excluded.")

    def stop(self):
        self.hosted_only()
        failed = False
        for project in ["application", "keycloak"]:
            result = self.compose(project, "down", "--volumes", "--remove-orphans", check=False)
            failed = failed or result.returncode != 0
        if failed:
            raise RuntimeError("One or more Compose projects could not be cleaned up")


def wait_http(label, url, timeout=90):
    deadline = time.monotonic() + timeout
    while True:
        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                if response.status == 200:
                    body = response.read()
                    print(f"Ready: {label}")
                    return body
        except (OSError, ValueError):
            pass
        if time.monotonic() >= deadline:
            raise RuntimeError(f"Readiness timed out: {label} ({url})")
        time.sleep(3)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["prepare", "validate", "start", "check", "logs", "stop"])
    parser.add_argument("--root", type=Path, required=True, help="Disposable dips-local-dev checkout")
    parser.add_argument("--host", help="Runner IPv4 address; preparation only (otherwise detected)")
    args = parser.parse_args()
    root = args.root.resolve()
    if args.action == "prepare":
        prepare(root, args.host)
    elif args.action in ["stop", "logs"] and not (root / ".cm-ci/state.json").exists():
        print("No prepared CI environment; nothing to collect or stop.")
    else:
        getattr(Environment(root), args.action)()


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, RuntimeError, subprocess.CalledProcessError) as error:
        # Do not print captured Compose config: it contains disposable credentials.
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
