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
}

export interface User {
  id: string
  customerId: string
  firstName: string
  lastName: string
  login: string
  password: string
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
  licenseType: string
  status: string
  duration: string
  activationDate?: Date
  expirationDate?: Date | null
  serverId?: string
}

export interface PurchaseOrder {
  id: string
  customerId: string
  poNumber: string
  purchaseDate: Date
  licenses: License[]
}

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

  addPurchaseOrder: (customerId: string, po: Pick<PurchaseOrder, 'poNumber' | 'purchaseDate' | 'licenses'>) => Promise<PurchaseOrder>;
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
