import { Sequelize, Dialect, DataTypes, Model } from 'sequelize'; // Import Model
import dotenv from 'dotenv';

// Import model CLASSES (keep these at top level for type usage)
import Administrator from './models/administrator';
import Customer from './models/customer';
import License from './models/license';
import LicenseActionLookup from './models/licenseActionLookup';
import LicenseLedger from './models/licenseLedger';
import LicenseTypeLookup from './models/licenseTypeLookup';
import POLicenseJoin from './models/poLicenseJoin';
import PurchaseOrder from './models/purchaseOrder';
import Server from './models/server';
import User from './models/user';

// Load environment variables from .env file
dotenv.config({ path: '.env.local' });

// --- Database Configuration ---
const dbName = process.env.DB_NAME as string;
const dbUser = process.env.DB_USER as string;
const dbHost = process.env.DB_HOST;
const dbPassword = process.env.DB_PASSWORD;
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const dbDialect = (process.env.DB_DIALECT || 'postgres') as Dialect;
const dbSslMode = process.env.DB_SSL_MODE;

// --- Define a type for the DB object ---
// Adjust this based on the actual structure of your models if needed
interface Db {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  Administrator: typeof Administrator;
  Customer: typeof Customer;
  License: typeof License;
  LicenseActionLookup: typeof LicenseActionLookup;
  LicenseLedger: typeof LicenseLedger;
  LicenseTypeLookup: typeof LicenseTypeLookup;
  POLicenseJoin: typeof POLicenseJoin;
  PurchaseOrder: typeof PurchaseOrder;
  Server: typeof Server;
  User: typeof User;
}

// --- Cached Instance ---
let cachedDb: Db | null = null;

// --- Initialization Function ---
function initializeDb(): Db {
  console.log('Initializing DB connection and models...'); // Add log for debugging

  if (!dbName || !dbUser || !dbHost || dbPassword === undefined) {
    console.error('Database configuration environment variables are missing! Check your .env.local file.');
    throw new Error('Missing DB configuration.');
  }

  // Create the Sequelize instance
  const sequelizeConnection = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Consider disabling logging during build
    dialectOptions: dbSslMode ? {
      ssl: {
        require: dbSslMode === 'require',
        rejectUnauthorized: false // Adjust as needed for your SSL setup
      }
    } : undefined,
  });

  // Initialize models centrally
  Administrator.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      login: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordEncrypted: { type: DataTypes.BLOB, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'Administrators', timestamps: true });

  Customer.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      businessName: { type: DataTypes.STRING, allowNull: false },
      contactName: { type: DataTypes.STRING, allowNull: false },
      contactEmail: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
      contactPhone: { type: DataTypes.STRING, allowNull: true },
      businessAddress1: { type: DataTypes.STRING, allowNull: true },
      businessAddress2: { type: DataTypes.STRING, allowNull: true },
      businessAddressCity: { type: DataTypes.STRING, allowNull: true },
      businessAddressState: { type: DataTypes.STRING, allowNull: true },
      businessAddressZip: { type: DataTypes.STRING, allowNull: true },
      businessAddressCountry: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'Customers', timestamps: true });

  LicenseTypeLookup.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'LicenseTypeLookup', timestamps: true });

  License.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      uniqueId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      externalName: { type: DataTypes.STRING, allowNull: false },
      typeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: LicenseTypeLookup, key: 'id' } },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'Licenses', timestamps: true });

  LicenseActionLookup.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'LicenseActionLookup', timestamps: true });

  Server.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.STRING, allowNull: true },
      fingerprint: { type: DataTypes.BLOB, allowNull: false, unique: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'Servers', timestamps: true });

  LicenseLedger.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      licenseId: { type: DataTypes.INTEGER, allowNull: false, references: { model: License, key: 'id' } },
      serverID: { type: DataTypes.INTEGER, allowNull: false, references: { model: Server, key: 'id' }, field: 'serverID' },
      activityDate: { type: DataTypes.DATE, allowNull: false },
      licenseActionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: LicenseActionLookup, key: 'id' } },
      comment: { type: DataTypes.STRING, allowNull: true },
      expirationDate: { type: DataTypes.DATEONLY, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'LicenseLedger', timestamps: true });

  PurchaseOrder.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      poName: { type: DataTypes.STRING, allowNull: false },
      purchaseDate: { type: DataTypes.DATEONLY, allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Customer, key: 'id' } },
      isClosed: { type: DataTypes.BOOLEAN, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'PurchaseOrders', timestamps: true });

  POLicenseJoin.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      poId: { type: DataTypes.INTEGER, allowNull: false, references: { model: PurchaseOrder, key: 'id' } },
      licenseId: { type: DataTypes.INTEGER, allowNull: false, references: { model: License, key: 'id' } },
      duration: { type: DataTypes.SMALLINT, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'PO_License_Join', timestamps: true });

  User.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      customerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Customer, key: 'id' } },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      login: { type: DataTypes.STRING, allowNull: false, unique: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
      passwordEncrypted: { type: DataTypes.BLOB, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize: sequelizeConnection, tableName: 'Users', timestamps: true });


  // --- Define Associations ---
  // Customer associations
  Customer.hasMany(PurchaseOrder, { foreignKey: 'customerId', as: 'purchaseOrders' });
  Customer.hasMany(User, { foreignKey: 'customerId', as: 'users' });

  // License associations
  License.hasMany(LicenseLedger, { foreignKey: 'licenseId', as: 'ledgerEntries' });
  License.belongsTo(LicenseTypeLookup, { foreignKey: 'typeId', as: 'type' });
  License.belongsToMany(PurchaseOrder, {
    through: POLicenseJoin,
    foreignKey: 'licenseId',
    otherKey: 'poId',
    as: 'purchaseOrders',
  });

  // LicenseTypeLookup associations
  LicenseTypeLookup.hasMany(License, { foreignKey: 'typeId', as: 'licensesOfType' });

  // LicenseActionLookup associations
  LicenseActionLookup.hasMany(LicenseLedger, { foreignKey: 'licenseActionId', as: 'ledgerEntries' });

  // Server associations
  Server.hasMany(LicenseLedger, { foreignKey: 'serverID', as: 'ledgerEntries' });

  // PurchaseOrder associations
  PurchaseOrder.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  PurchaseOrder.belongsToMany(License, {
    through: POLicenseJoin,
    foreignKey: 'poId',
    otherKey: 'licenseId',
    as: 'licenses',
  });

  // User associations
  User.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

  // LicenseLedger associations
  LicenseLedger.belongsTo(License, { foreignKey: 'licenseId', as: 'license' });
  LicenseLedger.belongsTo(Server, { foreignKey: 'serverID', as: 'server' });
  LicenseLedger.belongsTo(LicenseActionLookup, { foreignKey: 'licenseActionId', as: 'licenseAction' });

  // POLicenseJoin associations
  POLicenseJoin.belongsTo(PurchaseOrder, { foreignKey: 'poId', as: 'purchaseOrder' });
  POLicenseJoin.belongsTo(License, { foreignKey: 'licenseId', as: 'license' });

  // Return the db object
  const dbInstance: Db = {
    sequelize: sequelizeConnection,
    Sequelize,
    Administrator,
    Customer,
    License,
    LicenseActionLookup,
    LicenseLedger,
    LicenseTypeLookup,
    POLicenseJoin,
    PurchaseOrder,
    Server,
    User,
  };
  return dbInstance;
}

// --- Exported Function to Get Instance ---
export function getDbInstance(): Db {
  if (!cachedDb) {
    cachedDb = initializeDb();
  }
  return cachedDb;
}

// Optional: Add a function to test connection (needs to get instance first)
export async function testDbConnection() {
  try {
    const db = getDbInstance();
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Export Model types if needed elsewhere (optional)
// These are the actual classes/constructors
export { Administrator, Customer, License, LicenseActionLookup, LicenseLedger, LicenseTypeLookup, POLicenseJoin, PurchaseOrder, Server, User };
