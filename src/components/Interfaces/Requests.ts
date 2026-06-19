import { ObjectId } from "mongodb";
import { Ontology } from "./Ontology";

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

export interface Request {
  _id: string;
  requestName: string;
  extraText?: string,
  selectedOntologies?: Ontology[]; 
  requester: {
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
  };
  permissions: Permission[];
  policy?: any; // ODRL policy
  status: string;
  owners: string[];
  ownersAccepted: string[];
  ownersRejected: string[];
  ownersPending: string[];
  contractId?: string;
}

export interface RequestData {
  _id: ObjectId;
  requestName: string;
  description?: string;
  extraTerms?: string;
  extraText?: string;
  emailText?: string;
  permissions: Permission[];
  selectedOntologies: Ontology[];
  requester?: {
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
  };
  policy?: any; // ODRL policy JSON
  metadata?: any; // Additional metadata like audit request ID
  createdAt?: string;
  sentAt?: string;
  status?: string;
  owners: string[];
  ownersPending: string[];
  ownersAccepted: string[];
  ownersRejected: string[];
}