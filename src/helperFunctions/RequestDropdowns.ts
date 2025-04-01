// src/utils/options.ts

export interface Option {
  value: string;
  label: string;
}

export const getActionOptions = (): Option[] => {
  return [
    { value: "", label: "Choose action" },
    { value: "read", label: "Read" },
    { value: "write", label: "Write" },
    { value: "delete", label: "Delete" },
  ];
};

export const getPurposeOptions = (): Option[] => {
  return [
    { value: "", label: "Choose purpose" },
    { value: "marketing", label: "Marketing" },
    { value: "legal", label: "Legal" },
    { value: "logistics", label: "Logistics" },
  ];
};

export const getAttributeOptions = (): Option[] => {
  return [
    { value: "", label: "Choose attribute" },
    { value: "comercial", label: "Comercial" },
    { value: "personal", label: "Personal" },
    { value: "development", label: "Development" },
  ];
};

export const getInstanceOptions = (): Option[] => {
  return [
    { value: "", label: "Choose instance" },
    { value: "eq", label: "eq" },
    { value: "gt", label: "gt" },
    { value: "gteq", label: "gteq" },
    { value: "hasPart", label: "hasPart" },
    { value: "isA", label: "isA" },
    { value: "isAllOf", label: "isAllOf" },
    { value: "isAnyOf", label: "isAnyOf" },
    { value: "isNoneOf", label: "isNoneOf" },
    { value: "isPartOf", label: "isPartOf" },
    { value: "lt", label: "lt" },
    { value: "lteq", label: "lteq" },
    { value: "neq", label: "neq" },
  ];
};
