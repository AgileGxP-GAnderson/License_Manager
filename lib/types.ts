export interface Customer {
  id: string
  name: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
  contactPerson: string
  email: string
  phone: string
}

export interface User {
  id: string
  customerId: string
  firstName: string
  lastName: string
  username: string
  password: string
  email: string
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
  addCustomer: (customer: Omit<Customer, "id">) => string
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  setCurrentCustomer: (id: string | null) => void
  searchCustomers: (query: string) => Customer[]

  addPurchaseOrder: (customerId: string, po: Omit<PurchaseOrder, "id" | "customerId">) => string
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
