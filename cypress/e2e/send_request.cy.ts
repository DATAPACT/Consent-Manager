describe("Send request", () => {
    it("send request", () => {
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

        cy.get("#nav-drafts")
            .find('button:has(i.fa-solid.fa-ellipsis-vertical)')
            .click();

        cy.get("ul.dropdown-menu.show")
            .contains("a", "Send Request")
            .click();

        let alertCount = 0;

        cy.on("window:alert", (text) => {
            alertCount++;

            if (alertCount === 1) {
                expect(text).to.equal("Please input a valid email address.");
            } else if (alertCount === 2) {
                expect(text).to.equal("A user with this email has already been added.");
            }
        });

        cy.contains("label", "Add New Recipients")
            .parent()
            .find("input")
            .type("invalid_input");

        // Should alert the user that this is not a valid email address.

        cy.contains("label", "Add New Recipients")
            .parent()
            .find("button")
            .find("i.fa-plus")
            .parent("button")
            .click();

        cy.contains("label", "Add New Recipients")
            .parent()
            .find('input[placeholder="Type name or email to search..."]')
            .clear()
            .type("dummy_provider1@example.com");

        cy.contains("label", "Add New Recipients")
            .parent()
            .find("button")
            .find("i.fa-plus")
            .parent("button")
            .click();

        // Should alert the user that this is a duplicate email address.

        cy.contains("label", "Add New Recipients")
            .parent()
            .find('input[placeholder="Type name or email to search..."]')
            .clear()
            .type("dummy_provider1@example.com");

        cy.contains("label", "Add New Recipients")
            .parent()
            .find("button")
            .find("i.fa-plus")
            .parent("button")
            .click();

        cy.contains("label", "Add New Recipients")
            .parent()
            .find('input[placeholder="Type name or email to search..."]')
            .clear()
            .type("dummy_provider2@example.com");

        cy.contains("label", "Add New Recipients")
            .parent()
            .find("button")
            .find("i.fa-plus")
            .parent("button")
            .click();

        cy.contains("strong", "New Recipients to Add")
            .closest("div")
            .find("table")
            .find('input[placeholder="Unknown"]')
            .each((input) => cy.wrap(input).type("Dummy Provider"));

    });
});