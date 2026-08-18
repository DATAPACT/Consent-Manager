// Generic ODRL policy parser for consent management
import { ODRLPermission, ODRLPolicy } from "../components/Interfaces/ODRL";
import { Permission } from "../components/Interfaces/Requests";

export function permissionsToODRLPolicy(requestId: string, ownerId: string, requesterId: string, request: Permission[]) {
  let odrlPolicy : ODRLPolicy = {
    "@context": {
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "skos": "http://www.w3.org/2004/02/skos/core#",
      "odrl": "http://www.w3.org/ns/odrl/2/",
      "dpv": "https://w3id.org/dpv/owl#",
      "foaf": "http://xmlns.com/foaf/0.1/"},
    "@id": requestId,
    "@type": "odrl:Policy",
    "odrl:permission": []};

  for (let permission of request) {
    const constraints = permission.constraintRefinements.concat(permission.purposeRefinements);
    let temp_permission = {
      "odrl:action": {"rdf:value": {"@id": permission.action},
                      "odrl:refinement": permission.actionRefinements.map(
                        (refinement) =>
                        { const constraint = {
                          "odrl:leftOperand": {"@id": refinement.leftOperand},
                          "odrl:operator": {"@id": refinement.operator},
                          "odrl:rightOperand": refinement.rightOperand
                        }
                        return constraint
                        }
                      )},
      "odrl:target": {"odrl:source": {"@id": permission.dataset},
                      "odrl:refinement": permission.datasetRefinements.map(
                        (refinement) =>
                        { const constraint = {
                          "odrl:leftOperand": {"@id": refinement.leftOperand},
                          "odrl:operator": {"@id": refinement.operator},
                          "odrl:rightOperand": refinement.rightOperand
                        }
                        return constraint
                        }
                      )},
      "odrl:assignee": {"odrl:source": {"@id": requesterId}},
      "odrl:assigner": {"odrl:source": {"@id": ownerId}},
      "odrl:constraint": constraints.map(constraint => {
        return {
        "odrl:leftOperand": {"@id": constraint.leftOperand},
        "odrl:operator": {"@id": constraint.operator},
        "odrl:rightOperand": constraint.rightOperand
      }})
    }
    temp_permission["odrl:constraint"].push({
      "odrl:leftOperand": {"@id": "dpv:purpose"},
      "odrl:operator": {"@id": "odrl:eq"},
      "odrl:rightOperand": permission.purpose
    })
    odrlPolicy["odrl:permission"].push(temp_permission);
  }
  return odrlPolicy;
}

/**
 * Extract a human-readable name from any URI or ID
 */
export function extractReadableName(id: string): string {
  if (!id) return "Unknown";

  // Remove common prefixes
  // let name = id.replace(/^(https?:\/\/[^\/]+\/[^\/]*\/|[a-zA-Z]+:|id:)/, "");
  let name = id.replace(/^(https?:\/\/[^\/]+(?:\/[^\/]+)*\/(?:[^\/]+#)?|[a-zA-Z]+:|id:)/, "");

  // Convert underscores to spaces, but be careful with camelCase
  name = name.replace(/_/g, " ");

  // Only add spaces before capital letters if they're not already separated
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Clean up multiple spaces and trim
  name = name.replace(/\s+/g, " ").trim();

  // Capitalize first letter of each word
  return name.replace(/\b\w/g, (l) => l.toUpperCase());
}

export function extractReadableOperator(id: string): string {
  const operators = [
    { value: "", label: "Choose an operator" },
    { value: "odrl:eq", label: "equals" },
    { value: "odrl:gt", label: "greater than" },
    { value: "odrl:gteq", label: "greater than or equal to" },
    { value: "odrl:hasPart", label: "has part" },
    { value: "odrl:isA", label: "is a" },
    { value: "odrl:isAllOf", label: "is all of" },
    { value: "odrl:isAnyOf", label: "is any of" },
    { value: "odrl:isNoneOf", label: "is none of" },
    { value: "odrl:isPartOf", label: "is part of" },
    { value: "odrl:lt", label: "less than" },
    { value: "odrl:lteq", label: "less than or equal to" },
    { value: "odrl:neq", label: "not equal to" },
  ];

    const operator_string = operators.filter(element => element.value === id);

    if (operator_string[0]) return operator_string[0].label
    else return id;
}

/**
 * Generic constraint parser - extracts all constraints without assuming structure
 */
export function parseConstraints(
  constraints: ODRLPermission["odrl:constraint"]
): Array<{
  leftOperand: string;
  operator: string;
  rightOperand: any;
  description: string;
}> {
  if (!constraints) return [];

  return constraints.map((constraint) => {
    const leftOperand = constraint["odrl:leftOperand"]?.["@id"] || "Unknown";
    const operator = constraint["odrl:operator"]?.["@id"] || "Unknown";
    const rightOperand = constraint["odrl:rightOperand"];

    // Create human-readable description
    let description = `${extractReadableName(
      leftOperand
    )} ${extractReadableName(operator)}`;

    if (Array.isArray(rightOperand)) {
      const values = rightOperand.map((r) => {
        if (typeof r === "object" && r["@id"])
          return extractReadableName(r["@id"]);
        if (typeof r === "object" && r["@value"]) return r["@value"];
        return String(r);
      });
      description += ` ${values.join(", ")}`;
    } else if (typeof rightOperand === "object") {
      // Handle @list structure
      if (rightOperand["@list"]) {
        const values = rightOperand["@list"].map((r: any) => {
          if (typeof r === "object" && r["@id"])
            return extractReadableName(r["@id"]);
          if (typeof r === "object" && r["@value"]) return r["@value"];
          return String(r);
        });
        description += ` ${values.join(", ")}`;
      } else if (rightOperand["@id"]) {
        description += ` ${extractReadableName(rightOperand["@id"])}`;
      } else if (rightOperand["@value"]) {
        description += ` ${rightOperand["@value"]}`;
      } else {
        description += ` ${JSON.stringify(rightOperand)}`;
      }
    }

    return {
      leftOperand: extractReadableName(leftOperand),
      operator: extractReadableOperator(operator),
      rightOperand,
      description,
    };
  });
}

/**
 * Generic assignee parser - extracts all assignee info without assuming structure
 */
export function parseAssignees(
  assignee: ODRLPermission["odrl:assignee"]
): Array<{
  source: string;
  refinements?: Array<{
    leftOperand: string;
    operator: string;
    rightOperand: any;
    description: string;
  }>;
}> {
  if (!assignee) return [];

  const source = assignee["odrl:source"]?.["@id"] || "Unknown";

  const result = {
    source: extractReadableName(source),
    refinements: undefined as any,
  };

  if (assignee["odrl:refinement"]) {
    const refinement = assignee["odrl:refinement"];
    const leftOperand = refinement["odrl:leftOperand"]?.["@id"] || "Unknown";
    const operator = refinement["odrl:operator"]?.["@id"] || "Unknown";
    const rightOperand = refinement["odrl:rightOperand"];

    let description = `${extractReadableName(
      leftOperand
    )} ${extractReadableName(operator)}`;

    if (Array.isArray(rightOperand)) {
      description += ` ${rightOperand.join(", ")}`;
    } else {
      description += ` ${rightOperand}`;
    }

    result.refinements = [
      {
        leftOperand: extractReadableName(leftOperand),
        operator: extractReadableName(operator),
        rightOperand,
        description,
      },
    ];
  }

  return [result];
}

/**
 * Convert ODRL policy to permission format for display (generic approach)
 */
export function parseODRLPolicy(policy: ODRLPolicy | null): Permission[] {
  if (!policy || !policy["odrl:permission"]) {
    return [];
  }

  return policy["odrl:permission"].map((permission) => {
    // Extract basic permission components generically
    const action = extractReadableName(
      permission["odrl:action"]["rdf:value"]["@id"]
    );
    const dataset = extractReadableName(
      permission["odrl:target"]["odrl:source"]["@id"]
    );

    const actionRefinements = parseConstraints(permission["odrl:action"]["odrl:refinement"]);

    const datasetRefinements = parseConstraints(permission["odrl:target"]["odrl:refinement"]);

    // Parse constraints generically (excluding purpose)
    const constraints = parseConstraints(permission["odrl:constraint"]).filter((o) => !o.leftOperand.toLowerCase().includes("purpose"));

    // Parse assignees generically
    const assignees = parseAssignees(permission["odrl:assignee"]);

    // Extract purpose from constraints (look for Purpose-related constraints)
    const purposeConstraints = constraints.filter(
      (c) =>
        c.leftOperand.toLowerCase().includes("purpose")
    );

    let purpose = "General use";
    if (purposeConstraints.length > 0) {
      const purposeValues = purposeConstraints
        .map((c) => {
          const rightOp = c.rightOperand;

          // Handle @list structure (JSON-LD ordered list)
          if (rightOp && typeof rightOp === "object" && rightOp["@list"]) {
            return rightOp["@list"]
              .map((p: any) => {
                if (typeof p === "object" && p["@id"])
                  return extractReadableName(p["@id"]);
                if (typeof p === "object" && p["@value"]) return p["@value"];
                return String(p);
              })
              .join(", ");
          }

          // Handle regular array
          if (Array.isArray(rightOp)) {
            return rightOp
              .map((p) => {
                if (typeof p === "object" && p["@id"])
                  return extractReadableName(p["@id"]);
                if (typeof p === "object" && p["@value"]) return p["@value"];
                return String(p);
              })
              .join(", ");
          }

          // Handle single object with @id
          if (typeof rightOp === "object" && rightOp["@id"]) {
            return extractReadableName(rightOp["@id"]);
          }

          // Handle single object with @value
          if (typeof rightOp === "object" && rightOp["@value"]) {
            return rightOp["@value"];
          }

          // Fallback for primitives
          return String(rightOp);
        })
        .join(", ");
      purpose = extractReadableName(purposeValues) || "General use";
    }

    return {
      dataset,
      action,
      purpose,
      datasetRefinements: datasetRefinements,
      actionRefinements: actionRefinements,
      purposeRefinements: [],
      constraintRefinements: [],
      constraints, // Generic constraint info
      assignees, // Generic assignee info
    };
  });
}

/**
 * Check if a request has an ODRL policy
 */
export function hasODRLPolicy(request: any): boolean {
  return !!(
    request.policy &&
    request.policy["@context"] &&
    request.policy["odrl:permission"]
  );
}

/**
 * Get permissions from either ODRL policy or legacy permissions array
 */
export function getRequestPermissions(request: any): Permission[] {
  // If request has ODRL policy, parse it
  if (hasODRLPolicy(request)) {
    return parseODRLPolicy(request.policy);
  }

  // Fallback to legacy permissions array
  if (request.permissions && Array.isArray(request.permissions)) {
    return request.permissions.map((perm: any) => ({
      dataset: perm.dataset || "Unknown dataset",
      action: perm.action || "Unknown action",
      purpose: perm.purpose || "Unknown purpose",
      datasetRefinements: perm.datasetRefinements || [],
      actionRefinements: perm.actionRefinements || [],
      purposeRefinements: perm.purposeRefinements || [],
      constraintRefinements: perm.constraintRefinements || [],
    }));
  }

  return [];}