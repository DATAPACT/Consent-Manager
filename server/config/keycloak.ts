import { Keycloak } from "keycloak-backend";
import * as dotenv from "dotenv";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config({path: ".env"});

const keycloak_base_url = process.env.KEYCLOAK_URL || "127.0.0.1:8000";
const keycloak_realm = process.env.KEYCLOAK_REALM || "";

const keycloak = new Keycloak({
    keycloak_base_url: process.env.KEYCLOAK_URL || "",
    realm: process.env.KEYCLOAK_REALM || "",
    client_id: process.env.KEYCLOAK_CLIENT_ID || ""
});

const JWKS = createRemoteJWKSet(
    new URL(
        `${keycloak_base_url}/realms/${keycloak_realm}/protocol/openid-connect/certs`
    )
);

export const login = async (email: string, password: string) => {
  try {
    const params = new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID || "",
        grant_type: "password",
        username: email,
        password: password,
        scope: "openid email profile",
    });
    const response = await fetch(`${keycloak_base_url}/realms/${keycloak_realm}/protocol/openid-connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body: params,
    });

    if (!response.ok) {
        console.error("Error with login:",response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const verify = async (token: string) => {
    try{
        const { payload, protectedHeader } = await jwtVerify(token, JWKS, {issuer: `${keycloak_base_url}/realms/${keycloak_realm}`});
        console.log("Payload is:",payload);
        console.log("Protected header is:",protectedHeader);
        return {email: payload.email, type: payload.user_type};
    }
    catch(error) {
        console.log("Verifying error:",error);
    }
}

export default keycloak