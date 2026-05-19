import KeyCloak from "keycloak-js"

const keycloak = new KeyCloak({
    url: import.meta.env.KEYCLOAK_URI || "",
    realm: import.meta.env.KEYCLOAK_REALM || "",
    clientId: import.meta.env.KEYCLOAK_CLIENT_ID || ""
});

try {
    const authenticated = await keycloak.init();
    if (authenticated) {
        console.log('User is authenticated');
    }
    else {
        console.log('User is not authenticated');
    }
} catch (error) {
    console.error('Failed to initialise adapter:', error);
}

export default keycloak