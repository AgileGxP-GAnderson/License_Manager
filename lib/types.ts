export interface Customer {
  id: string; // Keep as string for frontend consistency, API should map number to string
  businessName: string;
  contactName: string;
  contactEmail?: string | null; // Changed from 'contact', made optional
  contactPhone?: string | null; // Changed from 'phone', made optional
  businessAddress1?: string | null; // Changed from 'addressLine1', made optional
  businessAddress2?: string | null; // Changed from 'addressLine2', kept optional
  businessAddressCity?: string | null; // Changed from 'city', made optional
  businessAddressState?: string | null; // Changed from 'state', made optional
  businessAddressZip?: string | null; // Changed from 'zipCode', made optional
  businessAddressCountry?: string | null; // Changed from 'country', made optional
  purchaseOrders?: PurchaseOrder[]; // Optional, to include related purchase orders
}

export interface User {
  id: string
  customerId: string
  firstName: string
  lastName: string
  login: string
  password: string // Note: Storing plain passwords in frontend state is highly discouraged
  email: string
  isActive: boolean
}

export interface Server {
  id: number;
  customerId: number;
  name: string;
  description?: string | null;
  // Fingerprint might be string (base64) in frontend/API, Buffer in backend
  fingerprint: string | Buffer;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Add other related fields if needed (e.g., from associations)
}

export interface License {
  id: number;
  uniqueId: string;
  externalName: string;
  typeId: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // --- From Included Associations / Processing ---
  type?: { // From LicenseTypeLookup
    id: number;
    name: string;
  };
  totalDuration?: number | null; // From POLicenseJoin

  // --- Flattened from Latest Ledger Entry ---
  latestServerName?: string | null;
  lastActionName?: string | null; // Name of the latest action
  status?: string | null; // Derived status ('Activated', 'Available', etc.)
  activationDate?: Date | string | null; // Date of the latest activity
  expirationDate?: Date | string | null; // Expiration from the latest ledger entry

  // --- Original nested structure (alternative if not flattening in API) ---
  // ledgerEntries?: Array<{
  //   activityDate: Date | string;
  //   expirationDate?: Date | string | null;
  //   server?: { id: number; name: string } | null;
  //   licenseAction?: { id: number; name: string } | null;
  // }>;
}

export interface PurchaseOrder {
    id: string; // Assuming ID is string
    poName: string;
    purchaseDate: Date | string;
    customerId: string; // Assuming ID is string
    isClosed: boolean;
    licenses?: License[]; // Array of associated licenses (now augmented)
    customer?: { // Include customer details if needed
        id: number;
        businessName: string;
    };
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

// --- User Store State Interface ---
// Adjust input types (Omit/Partial) based on the actual User model and API needs
export type CreateUserInput = Omit<User, 'id'>;
export type UpdateUserInput = Partial<User>;

export type PurchaseOrderInput = Omit<PurchaseOrder, 'id'>;
export type UpdatePurchaseOrderInput = Partial<PurchaseOrder>;

// --- Existing Combined StoreState (Kept as requested) ---
export interface StoreState {
  customers: Customer[]
  purchaseOrders: PurchaseOrder[]
  servers: Server[]
  users: User[]
  currentCustomerId: string | null

  // Derived state
  currentCustomer: Customer | null

  // Actions
  addCustomer: (customer: Omit<Customer, "id">) => Promise<Customer>; // Assuming returns ID now
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer>; // Assuming async
  setCurrentCustomer: (id: string | null) => void
  searchCustomers: (query: string) => Customer[]; // Assuming local search

  addPurchaseOrder: (customerId: string, po: Pick<PurchaseOrder, 'poName' | 'purchaseDate' | 'licenses'>) => Promise<PurchaseOrder>;
  updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => Promise<PurchaseOrder>; // Assuming async
  getPurchaseOrdersByCustomerId: (customerId: string) => PurchaseOrder[]
  fetchPurchaseOrdersForCustomer: (customerId: string) => Promise<void>;

  // License actions
  updateLicense: (poId: string, licenseIndex: number, licenseData: Partial<License>) => void; // Changed Promise<License> to void
  requestLicenseActivation: (poId: string, licenseIndex: number, serverId: string) => void; // Assuming local update only for now
  activateLicense: (poId: string, licenseIndex: number) => void; // Assuming local update only for now
  deactivateLicense: (poId: string, licenseIndex: number) => void; // Assuming local update only for now
  isPONumberUnique: (poNumber: string) => boolean

  // Server actions
  addServer: (server: Omit<Server, "id">) => Promise<Server>; // Assuming async, returns Server
  getServersByCustomerId: (customerId: string) => Server[]
  getServerById: (id: string) => Server | null; // Changed undefined to null for consistency

  // User actions
  addUser: (user: Omit<User, "id">) => Promise<User>; // Assuming async, returns User
  updateUser: (id: string, user: Partial<User>) => Promise<User>; // Assuming async
  // --- Selector to get users for a customer ---
  getUsersByCustomerId: (customerId: string) => User[];
  // --- Action to fetch users for a customer ---
  fetchUsersForCustomer: (customerId: string) => Promise<void>; // Renamed for clarity

  isUsernameUnique: (username: string) => boolean
}

// --- Server Store State Interface ---
export interface ServerState {
  servers: Server[];
  loading: boolean;
  error: string | null;
  // Ensure customerId type matches usage (string | number)
  createServer: (customerId: string | number, serverData: Omit<Server, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Server | null>;
  fetchServersByCustomerId: (customerId: string | number) => Promise<void>;
  getServerById: (id: string | number) => Server | undefined;
  clearServers: () => void;
}

export interface LicenseAudit {
  id: number;
  licenseIdRef: number; // Reference to the License ID
  uniqueId: string; // Unique ID of the license at the time of audit
  externalName?: string | null;
  licenseStatusId: number;
  typeId: number;
  comment?: string | null;
  serverId?: number | null;
  updatedBy?: string | null; // User or process that triggered the change
  createdAt: Date | string; // Timestamp of the audit record
  // Optional: Add fields for human-readable names if resolved by the backend
  statusName?: string;
  typeName?: string;
  serverName?: string;
}

// Input type for creating a license, used in AddLicenseForm
export interface LicenseInput {
    poId: string; // Purchase Order ID
    typeId: number;
    duration: number;
    externalName?: string | null; // Added externalName as optional
}
