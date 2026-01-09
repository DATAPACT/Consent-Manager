// Generic ODRL policy parser for consent management

interface PolicyPermission {
  dataset: string;
  action: string;
  purpose: string;
  datasetRefinements: any[];
  actionRefinements: any[];
  purposeRefinements: any[];
  constraintRefinements: any[];
  constraints?: Array<{
    leftOperand: string;
    operator: string;
    rightOperand: any;
    description: string;
  }>;
  assignees?: Array<{
    source: string;
    refinements?: Array<{
      leftOperand: string;
      operator: string;
      rightOperand: any;
      description: string;
    }>;
  }>;
}

interface ODRLPermission {
  "odrl:action": {
    "rdf:value": {
      "@id": string;
    };
  };
  "odrl:target": {
    "odrl:source": {
      "@id": string;
    };
  };
  "odrl:assignee"?: {
    "odrl:source": {
      "@id": string;
    };
    "odrl:refinement"?: {
      "odrl:leftOperand": {
        "@id": string;
      };
      "odrl:operator": {
        "@id": string;
      };
      "odrl:rightOperand": string[];
    };
  };
  "odrl:constraint"?: Array<{
    "odrl:leftOperand": {
      "@id": string;
    };
    "odrl:operator": {
      "@id": string;
    };
    "odrl:rightOperand": any;
  }>;
}

interface ODRLPolicy {
  "@context": any;
  "@id": string;
  "@type": string;
  "odrl:permission": ODRLPermission[];
}

/**
 * Extract a human-readable name from any URI or ID
 */
export function extractReadableName(id: string): string {
  if (!id) return "Unknown";

  // Remove common prefixes
  let name = id.replace(/^(https?:\/\/[^\/]+\/[^\/]*\/|[a-zA-Z]+:|id:)/, "");

  // Convert underscores to spaces, but be careful with camelCase
  name = name.replace(/_/g, " ");

  // Only add spaces before capital letters if they're not already separated
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Clean up multiple spaces and trim
  name = name.replace(/\s+/g, " ").trim();

  // Capitalize first letter of each word
  return name.replace(/\b\w/g, (l) => l.toUpperCase());
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
      operator: extractReadableName(operator),
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
export function parseODRLPolicy(policy: ODRLPolicy | null): PolicyPermission[] {
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

    // Parse constraints generically
    const constraints = parseConstraints(permission["odrl:constraint"]);

    // Parse assignees generically
    const assignees = parseAssignees(permission["odrl:assignee"]);

    // Extract purpose from constraints (look for Purpose-related constraints)
    const purposeConstraints = constraints.filter(
      (c) =>
        c.leftOperand.toLowerCase().includes("purpose") &&
        c.operator.toLowerCase().includes("any")
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
      purpose = purposeValues || "General use";
    }

    return {
      dataset,
      action,
      purpose,
      datasetRefinements: [],
      actionRefinements: [],
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
export function getRequestPermissions(request: any): PolicyPermission[] {
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

  return [];
}
