describe("Login page", () => {
  it("loads the login page", () => {
    cy.visit("consent-manager/login");

    cy.contains("Login").should("be.visible");
    cy.env(["requester_email", "requester_password"]).then(({requester_email, requester_password}) => {
        cy.get(`input[type="email"]`).type(requester_email);
        cy.get(`input[type="password"]`).type(requester_password);
    })
    cy.get(`button[type="submit"]`).click();
    cy.url().should("include", "/requesterDashboard");

  });
  it("unsuccessful login", () => {
    cy.visit("consent-manager/login");

    cy.env(["requester_email", "requester_password"]).then(({requester_email, requester_password}) => {
        cy.get(`input[type="email"]`).type(requester_email);
        const wrong_password = (requester_password as string).substring(0, requester_password.length - 1);
        cy.get(`input[type="password"]`).type(wrong_password);
    })
    cy.get(`button[type="submit"]`).click();
  });
});