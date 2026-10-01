export interface ODRLPermission {
  "odrl:action": string | {
    "rdf:value": {
      "@id": string;
    };
    "odrl:refinement"?: ODRLConstraint[];
  };
  "odrl:target": string | {
    "odrl:source": {
      "@id": string;
    };
    "odrl:refinement"?: ODRLConstraint[];
  };
  "odrl:assignee"?: string | {
    "odrl:source": {
      "@id": string;
    };
    "odrl:refinement"?: ODRLConstraint
  };
  "odrl:assigner"?: string | {
    "odrl:source": {
      "@id": string;
    };
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