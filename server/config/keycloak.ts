import { Keycloak } from "keycloak-backend";
import * as dotenv from "dotenv";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "./database.service";
import { JWTExpired } from "jose/errors";

dotenv.config({path: ".env"});

const keycloak_base_url = process.env.KEYCLOAK_URL || "127.0.0.1:8000";
const keycloak_realm = process.env.KEYCLOAK_REALM || "";

const keycloak = new Keycloak({
    keycloak_base_url: process.env.KEYCLOAK_URL || "",
    realm: process.env.KEYCLOAK_REALM || "",
    client_id: process.env.KEYCLOAK_CLIENT_ID || ""
});

interface KeycloakTokenResponse {
  access_token: any;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  session_state: string;
  scope: string;
}

interface VerificationResponse {
    email?: string, 
    type?: string, 
    uid?: string, 
    success: boolean,
    reason?: string,
}

const JWKS = createRemoteJWKSet(
    new URL(
        `${keycloak_base_url}/realms/${keycloak_realm}/protocol/openid-connect/certs`
    )
);

export const login = async (email: string, password: string): Promise<KeycloakTokenResponse> => {
  try {
    const params = new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID || "",
        grant_type: "password",
        username: email,
        password: password,
        scope: "openid email profile",
    });
    console.log("Attempting to fetch: ",`${keycloak_base_url}/realms/${keycloak_realm}/protocol/openid-connect/token`);
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

    return (await response.json()) as KeycloakTokenResponse;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const verify = async (token: string): Promise<VerificationResponse> => {
    try{
        const { payload } = await jwtVerify(token, JWKS, {issuer: `${keycloak_base_url}/realms/${keycloak_realm}`});
        const userDoc = await db.collection("users").findOne({username_email: {$eq: payload.email}});
        console.log("JWT Verification Payload is: ", payload);

        if (!userDoc) {
            console.log("User not found");
            return {success: false, reason: "User not found"};
        }
        else{
            return {email: payload.email as string, type: payload.user_type as string, uid: userDoc._id.toString(), success: true};
        }
    }
    catch(error) {
        console.log("Verifying error:",error);
        if (error instanceof JWTExpired) {
            return {success: false, reason: "Token expired"}
        }
        else{
            return {success: false, reason: error as string}
        }
        
    }
}

export default keycloak