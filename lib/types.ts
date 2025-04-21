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
  username: string
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
  addCustomer: (customer: Omit<Customer, "id">) => Promise<string>;
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  setCurrentCustomer: (id: string | null) => void
  searchCustomers: (query: string) => Customer[]

  addPurchaseOrder: (customerId: string, po: Omit<PurchaseOrder, "id" | "customerId">) => Promise<string>;
  updatePurchaseOrder: (id: string, po: Partial<Omit<PurchaseOrder, "id" | "customerId">>) => void
  getPurchaseOrdersByCustomerId: (customerId: string) => PurchaseOrder[]

  // License actions
  updateLicense: (poId: string, licenseIndex: number, licenseData: Partial<License>) => void
  requestLicenseActivation: (poId: string, licenseIndex: number, serverId: string) => void
  activateLicense: (poId: string, licenseIndex: number) => void
  deactivateLicense: (poId: string, licenseIndex: number) => void
  isPONumberUnique: (poNumber: string) => boolean

  // Server actions
  addServer: (server: Omit<Server, "id">) => string
  getServersByCustomerId: (customerId: string) => Server[]
  getServerById: (id: string) => Server | undefined

  // User actions
  addUser: (user: Omit<User, "id">) => string
  updateUser: (id: string, user: Partial<User>) => void
  getUsersByCustomerId: (customerId: string) => User[]
  isUsernameUnique: (username: string) => boolean
}
