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