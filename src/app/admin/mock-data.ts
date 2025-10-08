export type Report = {
  id: string;
  productName: string;
  storeLocation: string;
  submittedAt: string;
  status: "Pending" | "Reviewed" | "Action Taken";
  analysisSummary: string;
};

export const mockReports: Report[] = [
  {
    id: "REP-001",
    productName: "Organic Milk, 1 Gallon",
    storeLocation: "Main St. Grocer",
    submittedAt: "2024-07-20T10:30:00Z",
    status: "Reviewed",
    analysisSummary: "High probability of date tampering. Ink discoloration detected.",
  },
  {
    id: "REP-002",
    productName: "Cheddar Cheese Block",
    storeLocation: "SuperMart Downtown",
    submittedAt: "2024-07-19T15:00:00Z",
    status: "Action Taken",
    analysisSummary: "Label adhesive shows signs of being peeled and reapplied.",
  },
  {
    id: "REP-003",
    productName: "Whole Wheat Bread",
    storeLocation: "Corner Pantry",
    submittedAt: "2024-07-21T09:00:00Z",
    status: "Pending",
    analysisSummary: "Awaiting analysis.",
  },
  {
    id: "REP-004",
    productName: "Ground Beef, 1lb",
    storeLocation: "SuperMart Downtown",
    submittedAt: "2024-07-20T18:45:00Z",
    status: "Reviewed",
    analysisSummary: "No signs of tampering detected. Font matches manufacturer's standard.",
  },
  {
    id: "REP-005",
    productName: "Free-range Eggs",
    storeLocation: "Farm Fresh Organics",
    submittedAt: "2024-07-21T11:20:00Z",
    status: "Pending",
    analysisSummary: "Awaiting analysis.",
  },
  {
    id: "REP-006",
    productName: "Apple Juice",
    storeLocation: "Main St. Grocer",
    submittedAt: "2024-06-15T12:00:00Z",
    status: "Action Taken",
    analysisSummary: "Confirmed label alteration. Store notified.",
  },
];

export const reportsByMonth = [
    { month: "Apr", reports: 5 },
    { month: "May", reports: 8 },
    { month: "Jun", reports: 12 },
    { month: "Jul", reports: 18 },
];
