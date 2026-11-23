describe("Send request", () => {
    it("send request", () => {
        cy.visit("consent-manager/login");
        cy.env(["requester_email", "requester_password"]).then(({requester_email, requester_password}) => {
            cy.get(`input[type="email"]`).type(requester_email);
            cy.get(`input[type="password"]`).type(requester_password);
        })
        cy.get(`button[type="submit"]`).click();

        // Click on Manager under Ontologies
        cy.contains("h4", "Ontologies")
            .parent("div")
            .contains("a", "Manage")
            .click();
        cy.contains("a", `Upload ontology`).click();

        cy.contains("label", "Ontology name")
            .parent("div")
            .find('input[type="text"]')
            .type("cactus");
            
        cy.get('input[type="file"]')
            .selectFile('ontologies/CactusOntology.ttl');

        cy.contains("button", `Upload ontology`).click();

        cy.get("table").contains("tr", "cactus").should("exist");

        // Find the table and make sure the text in the first column says "cactus"
        cy.get("table tbody tr")
            .contains("td:first-child", "cactus")
            .parent("tr")
            .find('button[data-bs-target="#deleteOntologyModal"]')
            .click();

        cy.intercept("DELETE", "**/api/ontologies/**").as("deleteOntology");

        // The modal should be specific to cactus.
        cy.get("#deleteOntologyModal")
            .should("be.visible")
            .contains("Are you sure you want to delete cactus?");

        cy.get("#deleteOntologyModal")
            .contains("button", "Delete")
            .click();

        cy.wait("@deleteOntology").then((interception) => {
            expect(interception.response?.statusCode).to.equal(200);
        });

        cy.reload();

        // The ontology should no longer exist.
        cy.get("table").should("not.exist") || cy.get("table").contains("tr", "cactus").should("not.exist");

    });
});