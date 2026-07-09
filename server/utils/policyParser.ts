export interface Constraint {
  id?: number
  leftOperand: string;
  operator: string;
  rightOperand: string;
  description?: string;
}

export interface Permission {
  id?: number;
  dataset: string;
  datasetRefinements: Constraint[];
  action: string;
  actionRefinements: Constraint[];
  purpose: string;
  purposeRefinements: Constraint[];
  constraintRefinements: Constraint[];
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

export interface ODRLPermission {
  "odrl:action": {
    "rdf:value": {
      "@id": string;
    };
    "odrl:refinement"?: {
      "odrl:leftOperand": {
        "@id": string;
      };
      "odrl:operator": {
        "@id": string;
      };
      "odrl:rightOperand": string;
    }[];
  };
  "odrl:target": {
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
      "odrl:rightOperand": string;
    }[];
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
      "odrl:rightOperand": string;
    };
  };
  "odrl:assigner"?: {
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
      "odrl:rightOperand": string;
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

export interface ODRLPolicy {
  "@context": any;
  "@id": string;
  "@type": string;
  "odrl:permission": ODRLPermission[];
}

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