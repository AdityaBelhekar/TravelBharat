export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const REGION_LABELS: Record<string, string> = {
  north: "North India",
  south: "South India",
  east: "East India",
  west: "West India",
  central: "Central India",
  northeast: "Northeast India",
  islands: "Islands",
};

export const formatINR = (amount: number) => (amount === 0 ? "Free" : `₹${amount.toLocaleString("en-IN")}`);

// For putting user input inside a RegExp.
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const plural =(count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
