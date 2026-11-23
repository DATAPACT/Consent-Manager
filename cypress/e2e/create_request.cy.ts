describe("Login page", () => {
  it("create request", () => {
    cy.visit("consent-manager/login");
    cy.env(["requester_email", "requester_password"]).then(({requester_email, requester_password}) => {
        cy.get(`input[type="email"]`).type(requester_email);
        cy.get(`input[type="password"]`).type(requester_password);
    })
    cy.get(`button[type="submit"]`).click();

    // Click on Manager under Requests
    cy.contains("h4", "Requests")
        .parent("div")
        .contains("a", "Manage")
        .click();
    cy.contains("a", `New request`).click();

    // Under Create Request
    cy.get(`button`).contains("Next").should("be.disabled"); 

    cy.get(`input#requestName`).type("Cypress test");
    cy.get(`textarea#extraText`).type("Generic additional terms.");
    cy.get(`textarea#emailText`).type("This is the text that will appear in an email.");
    
    cy.get('select[aria-label="Ontology select"]')
        .find("option")
        .contains("cactus")
        .dblclick();

    cy.get(`button`).contains("Next").click();
    cy.get(`button`).contains("Next").should("be.disabled");
    cy.contains("button", "Add dataset refinement").should("be.disabled");

    cy.get(`form`).get(`input[placeholder="Dataset URL"]`).type("http://example.com/health/dataset");
    cy.contains("button", "Add dataset refinement").click();

    cy.contains("label", "Action").parent("div").find(`select`).select(5);
    cy.contains("label", "Purpose").parent("div").find(`select`).select(5);

    cy.get(`button`).contains("Next").should("be.disabled");

    cy.contains("h6", "Dataset Refinement").parent("div").parent("div").contains("label", "Attribute").parent("div").find(`select`).select(2);
    cy.contains("h6", "Dataset Refinement").parent("div").parent("div").contains("label", "Operator").parent("div").find(`select`).select(2);
    cy.contains("h6", "Dataset Refinement").parent("div").parent("div").contains("label", "Value").parent("div").find(`input[type="text"]`).type("Fifteen");

    cy.get(`button`).contains("Next").click();

    // Check what the permission should say.
    cy.contains("The requester wants access to data from http://example.com/health/dataset");
    cy.contains("The requester wants to Notice to this dataset.");
    cy.contains("This request is for Combat Climate Change reasons");

  });
})