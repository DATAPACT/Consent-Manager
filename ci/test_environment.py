"""Regression checks for isolation and CI realm preparation;
no Docker daemon needed."""

import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("environment", Path(__file__).with_name("environment.py"))
environment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(environment)


class EnvironmentTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="cm-ci-test-")
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        for filename in ["docker-compose.yml", "keycloak/docker-compose.yml", "keycloak/Dockerfile",
                         "Consent-Manager/Dockerfile.backend", "Consent-Manager/Dockerfile.frontend",
                         "User-Management/Dockerfile", "Contract_Service/Dockerfile",
                         "Negotiation-Tool/Dockerfile.api"]:
            path = self.root / filename
            path.parent.mkdir(parents=True, exist_ok=True)
            path.touch()
        self.source = self.root / "keycloak/keycloak-dips-services-export/dips_services-realm.json"
        self.source.parent.mkdir()
        self.source.write_text(json.dumps({
            "realm": "dips_services", "sslRequired": "external",
            "users": [{"username": "developer"}], "smtpServer": {"password": "live-password"},
            "components": {"key-provider": "existing-signing-key"},
            "identityProviders": [{"alias": "external"}],
            "attributes": {"frontendUrl": "http://old-host:9090"},
            "clients": [{"clientId": name, "secret": "existing-client-secret",
                         "redirectUris": ["http://old-host/*"]}
                        for name in environment.REQUIRED_CLIENTS],
        }))
        (self.root / ".env").write_text("MASTER_PASSWORD=local-do-not-use\n")

    def prepare(self):
        with patch.object(environment.subprocess, "check_output", return_value="a" * 40 + "\n"), \
                patch.dict(os.environ, {"GITHUB_ACTIONS": "false"}):
            environment.prepare(self.root, "192.0.2.10")

    def test_preparation_preserves_local_files_and_replaces_exported_credentials(self):
        original = self.source.read_bytes()
        self.prepare()
        self.assertEqual(self.source.read_bytes(), original)
        self.assertEqual((self.root / ".env").read_text(), "MASTER_PASSWORD=local-do-not-use\n")
        runtime = self.root / ".cm-ci"
        realm = json.loads((runtime / "realm/dips_services-realm.json").read_text())
        for key in ["users", "smtpServer", "components", "identityProviders"]:
            self.assertNotIn(key, realm)
        client = next(c for c in realm["clients"] if c["clientId"] == "consent-manager")
        self.assertEqual(client["redirectUris"], ["http://192.0.2.10:5174/*"])
        self.assertNotEqual(client["secret"], "existing-client-secret")
        self.assertEqual(realm["sslRequired"], "none")
        self.assertNotIn("local-do-not-use", (runtime / "environment.env").read_text())
        self.assertEqual((runtime / "environment.env").stat().st_mode & 0o777, 0o600)

    def test_prepare_refuses_overwrite(self):
        self.prepare()
        with self.assertRaisesRegex(RuntimeError, "Refusing to replace"):
            self.prepare()

    def test_missing_client_fails_before_creating_runtime(self):
        realm = json.loads(self.source.read_text())
        realm["clients"] = []
        self.source.write_text(json.dumps(realm))
        with self.assertRaisesRegex(RuntimeError, "missing required"):
            self.prepare()
        self.assertFalse((self.root / ".cm-ci").exists())

    def test_local_container_operations_are_blocked_before_docker_call(self):
        self.prepare()
        with patch.dict(os.environ, {"GITHUB_ACTIONS": "false"}), \
                patch.object(environment.subprocess, "run") as run:
            instance = environment.Environment(self.root)
            for action in ["start", "check", "logs", "stop"]:
                with self.assertRaisesRegex(RuntimeError, "GitHub-hosted"):
                    getattr(instance, action)()
            run.assert_not_called()

    def test_parent_shell_values_cannot_override_ci_credentials(self):
        self.prepare()
        with patch.dict(os.environ, {"MASTER_PASSWORD": "live-password", "COMPOSE_FILE": "wrong.yml"}):
            instance = environment.Environment(self.root)
        self.assertNotEqual(instance.env["MASTER_PASSWORD"], "live-password")
        self.assertNotIn("COMPOSE_FILE", instance.env)

    def test_cleanup_attempts_both_projects_even_if_first_fails(self):
        self.prepare()
        instance = environment.Environment(self.root)
        with patch.object(instance, "hosted_only"), patch.object(instance, "compose") as compose:
            compose.return_value.returncode = 1
            with self.assertRaisesRegex(RuntimeError, "cleaned up"):
                instance.stop()
            self.assertEqual([c.args[0] for c in compose.call_args_list], ["application", "keycloak"])

    def test_readiness_timeout_fails(self):
        with patch.object(environment.urllib.request, "urlopen", side_effect=OSError("offline")):
            with self.assertRaisesRegex(RuntimeError, "Readiness timed out"):
                environment.wait_http("unavailable", "http://192.0.2.10", timeout=0)


if __name__ == "__main__":
    unittest.main()
