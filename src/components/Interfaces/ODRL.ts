export interface ODRLPermission {
  "odrl:action": string | {
    "rdf:value": {
      "@id": string;
    };
    "odrl:refinement"?: ODRLConstraint[];
  };
  "odrl:target": string | {
    "odrl:source": string;
    "odrl:refinement"?: ODRLConstraint[];
  };
  "odrl:assignee"?: string | {
    "odrl:source": string;
    "odrl:refinement"?: ODRLConstraint
  };
  "odrl:assigner"?: string | {
    "odrl:source": string;
    "odrl:refinement"?: ODRLConstraint
  };
  "odrl:constraint"?: Array<ODRLConstraint>;
}

interface ODRLConstraint {
  "odrl:leftOperand": string | {
      "@id": string;
    };
    "odrl:operator": string | {
      "@id": string;
    };
    "odrl:rightOperand": any;
}

export interface ODRLPolicy {
  "@context": any;
  "@id": string;
  "@type": string;
  "odrl:permission": ODRLPermission[];
}

export interface ODRLValidationResult {
  "result": {
    "ODRL_graph_size": number,
    "errors": string[],
    "warnings": string[],
    "info": string[],
    "is_valid_RDF": boolean,
    "file_format": string,
    "contains_ODRL": boolean,
    "is_valid_ODRL": boolean,
    "shacl_validation_report": string,
    "shacl_validation_report_explanation": string
  }
}