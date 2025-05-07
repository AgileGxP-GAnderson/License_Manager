import { Sequelize, Dialect } from 'sequelize'; // Removed DataTypes, Model as they are not directly used for types here
import dotenv from 'dotenv';
import { dialectModules } from './sequelize-dialects';

import Administrator from './models/administrator';
import Customer from './models/customer';
import License from './models/license';
import LicenseStatusLookup from './models/licenseStatusLookup';
import LicenseTypeLookup from './models/licenseTypeLookup';
import POLicenseJoin from './models/poLicenseJoin';
import PurchaseOrder from './models/purchaseOrder';
import Server from './models/server';
import User from './models/user';
import LicenseAudit from './models/licenseAudit';

dotenv.config({ path: '.env.local' });

const dbName = process.env.DB_NAME as string;
const dbUser = process.env.DB_USER as string;
const dbHost = process.env.DB_HOST;
const dbPassword = process.env.DB_PASSWORD;
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const dbDialect = (process.env.DB_DIALECT || 'postgres') as Dialect;
const dbSslMode = process.env.DB_SSL_MODE;

interface Db {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  Administrator: typeof Administrator;
  Customer: typeof Customer;
  License: typeof License;
  LicenseStatusLookup: typeof LicenseStatusLookup;
  LicenseTypeLookup: typeof LicenseTypeLookup;
  POLicenseJoin: typeof POLicenseJoin;
  PurchaseOrder: typeof PurchaseOrder;
  Server: typeof Server;
  User: typeof User;
  LicenseAudit: typeof LicenseAudit;
}

// Extend the NodeJS.Global interface or use globalThis for better type safety
declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: Db | undefined;
}

// let cachedDb: Db | null = null; // We will use global.__dbInstance instead

function initializeDb(): Db {
  console.log('Attempting to initialize DB connection and models...');

  if (!dbName || !dbUser || !dbHost || dbPassword === undefined) {
    console.error('Database configuration environment variables are missing! Check your .env.local file.');
    throw new Error('Missing DB configuration.');
  }

  const sequelizeConnection = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
    dialectModule: dialectModules[dbDialect as keyof typeof dialectModules],
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { // Explicitly define pool options
      max: 5, // Max number of connections in pool
      min: 0, // Min number of connections in pool
      acquire: 30000, // Max time (ms) that pool will try to get connection before throwing error
      idle: 10000 // Max time (ms) that a connection can be idle before being released
    },
    dialectOptions: dbSslMode ? {
      ssl: {
        require: dbSslMode === 'require',
        rejectUnauthorized: false
      }
    } : undefined,
  });

  const models = {
    Administrator,
    Customer,
    License,
    LicenseStatusLookup,
    LicenseTypeLookup,
    POLicenseJoin,
    PurchaseOrder,
    Server,
    User,
    LicenseAudit
  };

  // Initialize all models
  Object.values(models).forEach(model => {
    // All model files currently have an initialize static method
    model.initialize(sequelizeConnection);
  });

  // Associate all models
  Object.values(models).forEach(model => {
    if (model.associate) { // Check if associate method exists
      model.associate(models);
    }
  });

  console.log('DB connection and models initialized successfully.');
  return {
    sequelize: sequelizeConnection,
    Sequelize,
    ...models
  };
}

export function getDbInstance(): Db {
  // In development, HMR can cause modules to be re-evaluated.
  // Using a global variable helps persist the instance across HMR updates.
  // In production serverless environments, this helps ensure that a single warm instance
  // reuses the connection.
  if (!global.__dbInstance) {
    console.log("Global DB instance not found. Initializing and caching globally.");
    global.__dbInstance = initializeDb();
  } else {
    console.log("Found existing global DB instance.");
  }
  return global.__dbInstance;
}

export async function testDbConnection() {
  try {
    const db = getDbInstance();
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export { Administrator, Customer, License, LicenseStatusLookup, LicenseTypeLookup, POLicenseJoin, PurchaseOrder, Server, User, LicenseAudit };
