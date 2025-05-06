import { Sequelize } from 'sequelize';
import { sequelize } from '@/lib/db'; // Import the connection instance from db.ts

import Administrator from './administrator';
import Customer from './customer';
import License from './license';
import LicenseLedger from './licenseLedger';
import LicenseTypeLookup from './licenseTypeLookup';
import POLicenseJoin from './poLicenseJoin';
import PurchaseOrder from './purchaseOrder';
import Server from './server';
import User from './user';



Customer.hasMany(PurchaseOrder, { foreignKey: 'customerId', as: 'purchaseOrders' });

Customer.hasMany(User, { foreignKey: 'customerId', as: 'users' });

License.hasMany(LicenseLedger, { foreignKey: 'licenseId', as: 'ledgerEntries' });

LicenseTypeLookup.hasMany(License, { foreignKey: 'typeId', as: 'licensesOfType' }); // Changed alias

Server.hasMany(LicenseLedger, { foreignKey: 'serverId', as: 'ledgerEntries' });

PurchaseOrder.belongsToMany(License, {
  through: POLicenseJoin,
  foreignKey: 'poId',
  otherKey: 'licenseId',
  as: 'licenses',
});
License.belongsToMany(PurchaseOrder, {
  through: POLicenseJoin,
  foreignKey: 'licenseId',
  otherKey: 'poId',
  as: 'purchaseOrders',
});


const db = {
  sequelize: sequelizeConnection, // Use the correctly imported connection
  Sequelize, // Export Sequelize class itself if needed elsewhere
  Administrator,
  Customer,
  License,
  LicenseLedger,
  LicenseTypeLookup,
  POLicenseJoin,
  PurchaseOrder,
  Server,
  User,
};

export default db;
