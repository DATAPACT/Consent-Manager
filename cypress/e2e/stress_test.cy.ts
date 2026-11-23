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

        for (let i = 0; i < 20; i++) {
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
                .type(`dummy_provider${i}@example.com`);

            cy.contains("label", "Add New Recipients")
                .parent()
                .find("button")
                .find("i.fa-plus")
                .parent("button")
                .click();   
        }

        cy.contains("label", "Add New Recipients")
            .parent()
            .find("button")
            .find("i.fa-plus")
            .parent("button")
            .click();

        cy.env(["provider_email"]).then(({provider_email}) => {
            cy.contains("label", "Add New Recipients")
            .parent()
            .find('input[placeholder="Type name or email to search..."]')
            .clear()
            .type(provider_email);
        });
    
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
            .each((input, i) => cy.wrap(input).type(`Dummy Provider${i}`));

        cy.contains("button", "Send Request").click();
    });
});