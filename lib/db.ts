import { Sequelize, Dialect, DataTypes, Model } from 'sequelize'; // Import Model
import dotenv from 'dotenv';
import { dialectModules } from './sequelize-dialects';

// Import model CLASSES (keep these at top level for type usage)
import Administrator from './models/administrator';
import Customer from './models/customer';
import License from './models/license';
// import LicenseActionLookup from './models/licenseActionLookup'; // Removed
// import LicenseLedger from './models/licenseLedger'; // Removed
import LicenseStatusLookup from './models/licenseStatusLookup';
import LicenseTypeLookup from './models/licenseTypeLookup';
import POLicenseJoin from './models/poLicenseJoin';
import PurchaseOrder from './models/purchaseOrder';
import Server from './models/server';
import User from './models/user';
import LicenseAudit from './models/licenseAudit'; // Added import

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
  // LicenseActionLookup: typeof LicenseActionLookup; // Removed
  // LicenseLedger: typeof LicenseLedger; // Removed
  LicenseStatusLookup: typeof LicenseStatusLookup; // Added to interface
  LicenseTypeLookup: typeof LicenseTypeLookup;
  POLicenseJoin: typeof POLicenseJoin;
  PurchaseOrder: typeof PurchaseOrder;
  Server: typeof Server;
  User: typeof User;
  LicenseAudit: typeof LicenseAudit; // Added to interface
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
    dialectModule: dialectModules[dbDialect as keyof typeof dialectModules],
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Consider disabling logging during build
    dialectOptions: dbSslMode ? {
      ssl: {
        require: dbSslMode === 'require',
        rejectUnauthorized: false // Adjust as needed for your SSL setup
      }
    } : undefined,
  });

  // Initialize models centrally
  Administrator.initialize(sequelizeConnection);
  Customer.initialize(sequelizeConnection);
  LicenseTypeLookup.initialize(sequelizeConnection);
  LicenseStatusLookup.initialize(sequelizeConnection); // Added initialization
  License.initialize(sequelizeConnection);
  // LicenseActionLookup.initialize(sequelizeConnection); // Removed
  Server.initialize(sequelizeConnection);
  // LicenseLedger.initialize(sequelizeConnection); // Removed
  PurchaseOrder.initialize(sequelizeConnection);
  POLicenseJoin.initialize(sequelizeConnection);
  User.initialize(sequelizeConnection);
  LicenseAudit.initialize(sequelizeConnection); // Added initialization

  // --- Define Associations ---
  // Customer associations
  Customer.hasMany(PurchaseOrder, { foreignKey: 'customerId', as: 'purchaseOrders' });
  Customer.hasMany(User, { foreignKey: 'customerId', as: 'users' });

  // License associations
  // License.hasMany(LicenseLedger, { foreignKey: 'licenseId', as: 'ledgerEntries' }); // Removed
  License.belongsTo(LicenseTypeLookup, { foreignKey: 'typeId', as: 'type' });
  License.belongsTo(Server, { foreignKey: 'serverId', as: 'server' }); // Added association
  License.belongsToMany(PurchaseOrder, {
    through: POLicenseJoin,
    foreignKey: 'licenseId',
    otherKey: 'poId',
    as: 'purchaseOrders',
  });

  // LicenseTypeLookup associations
  LicenseTypeLookup.hasMany(License, { foreignKey: 'typeId', as: 'licensesOfType' });

  // Server associations
  Server.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' }); // Added association
  Server.hasMany(License, { foreignKey: 'serverId', as: 'licenses' }); // Added association
  // Server.hasMany(LicenseLedger, { foreignKey: 'serverId', as: 'ledgerEntries' }); // Removed

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

  // LicenseLedger associations - Removed
  // LicenseLedger.belongsTo(License, { foreignKey: 'licenseId', as: 'license' });
  // LicenseLedger.belongsTo(Server, { foreignKey: 'serverId', as: 'server' });
  // LicenseLedger.belongsTo(LicenseActionLookup, { foreignKey: 'licenseActionId', as: 'licenseAction' });

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
    // LicenseActionLookup, // Removed
    // LicenseLedger, // Removed
    LicenseStatusLookup, // Added to instance
    LicenseTypeLookup,
    POLicenseJoin,
    PurchaseOrder,
    Server,
    User,
    LicenseAudit, // Added to instance
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
export { Administrator, Customer, License, /*LicenseActionLookup, LicenseLedger,*/ LicenseStatusLookup, LicenseTypeLookup, POLicenseJoin, PurchaseOrder, Server, User, LicenseAudit }; // Added LicenseStatusLookup and LicenseAudit
