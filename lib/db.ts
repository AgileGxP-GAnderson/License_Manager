import { Sequelize, Dialect, DataTypes, Model } from 'sequelize'; // Import Model
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
import LicenseAudit from './models/licenseAudit'; // Added import

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
  LicenseStatusLookup: typeof LicenseStatusLookup; // Added to interface
  LicenseTypeLookup: typeof LicenseTypeLookup;
  POLicenseJoin: typeof POLicenseJoin;
  PurchaseOrder: typeof PurchaseOrder;
  Server: typeof Server;
  User: typeof User;
  LicenseAudit: typeof LicenseAudit; // Added to interface
}

let cachedDb: Db | null = null;

function initializeDb(): Db {
  console.log('Initializing DB connection and models...'); // Add log for debugging

  if (!dbName || !dbUser || !dbHost || dbPassword === undefined) {
    console.error('Database configuration environment variables are missing! Check your .env.local file.');
    throw new Error('Missing DB configuration.');
  }

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

  Administrator.initialize(sequelizeConnection);
  Customer.initialize(sequelizeConnection);
  LicenseTypeLookup.initialize(sequelizeConnection);
  LicenseStatusLookup.initialize(sequelizeConnection); // Added initialization
  License.initialize(sequelizeConnection);
  Server.initialize(sequelizeConnection);
  PurchaseOrder.initialize(sequelizeConnection);
  POLicenseJoin.initialize(sequelizeConnection);
  User.initialize(sequelizeConnection);
  LicenseAudit.initialize(sequelizeConnection); // Added initialization

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

  Object.values(models).forEach(model => {
    if (model.associate) {
      model.associate(models);
    }
  });

  const dbInstance: Db = {
    sequelize: sequelizeConnection,
    Sequelize,
    Administrator,
    Customer,
    License,
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

export function getDbInstance(): Db {
  if (!cachedDb) {
    cachedDb = initializeDb();
  }
  return cachedDb;
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

export { Administrator, Customer, License, /*LicenseActionLookup, LicenseLedger,*/ LicenseStatusLookup, LicenseTypeLookup, POLicenseJoin, PurchaseOrder, Server, User, LicenseAudit }; // Added LicenseStatusLookup and LicenseAudit
