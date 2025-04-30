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
  id: string
  customerId: string
  name: string
  fingerprint: string
}

export interface License {
  status: string
  typeId: number
  duration: string
  activationDate?: Date
  expirationDate?: Date | null
  serverId?: string
}

export interface PurchaseOrder {
  id: string
  customerId: string
  poName: string
  purchaseDate: Date
  licenses?: License[]
  isClosed: boolean
}

// // --- Customer Store State Interface ---
// export interface CustomerState {
//   customers: Customer[];
//   selectedCustomer: Customer | null;
//   loading: boolean;
//   error: string | null;
//   fetchCustomers: () => Promise<void>;
//   fetchCustomerById: (id: string) => Promise<void>;
//   createCustomer: (customer: Omit<Customer, 'id' | 'purchaseOrders'>) => Promise<void>; // Adjust Omit as needed
//   updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
//   deleteCustomer: (id: string) => Promise<void>;
//   setSelectedCustomer: (customer: Customer | null) => void;
// }

// --- User Store State Interface ---
// Adjust input types (Omit/Partial) based on the actual User model and API needs
export type CreateUserInput = Omit<User, 'id'>;
export type UpdateUserInput = Partial<User>;

export type PurchaseOrderInput = Omit<PurchaseOrder, 'id'>;
export type UpdatePurchaseOrderInput = Partial<PurchaseOrder>;

// export interface UserState {
//   users: User[];
//   selectedUser: User | null;
//   loading: boolean;
//   error: string | null;
//   fetchUsers: () => Promise<void>;
//   fetchUserById: (id: string) => Promise<void>;
//   createUser: (user: CreateUserInput) => Promise<void>;
//   updateUser: (id: string, user: UpdateUserInput) => Promise<void>;
//   deleteUser: (id: string) => Promise<void>;
//   // Assuming an action to fetch users specifically for a customer exists or is needed
//   fetchUsersByCustomerId?: (customerId: string) => Promise<void>;
//   setSelectedUser?: (user: User | null) => void; // Optional: if needed for direct setting
// }


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
