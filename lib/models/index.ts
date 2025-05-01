import { Sequelize } from 'sequelize';
import { sequelize } from '@/lib/db'; // Import the connection instance from db.ts

// Import models
import Administrator from './administrator';
import Customer from './customer';
import License from './license';
import LicenseActionLookup from './licenseActionLookup';
import LicenseLedger from './licenseLedger';
import LicenseTypeLookup from './licenseTypeLookup';
import POLicenseJoin from './poLicenseJoin';
import PurchaseOrder from './purchaseOrder';
import Server from './server';
import User from './user';

// Initialize models (Sequelize automatically registers them via the import)
// No need to call .init() again here

// --- Define Associations ---

// Customer associations
Customer.hasMany(PurchaseOrder, { foreignKey: 'customerId', as: 'purchaseOrders' });
// PurchaseOrder.belongsTo(Customer, ...) is defined in purchaseOrder.ts

Customer.hasMany(User, { foreignKey: 'customerId', as: 'users' });
// User.belongsTo(Customer, ...) is defined in user.ts

// License associations
License.hasMany(LicenseLedger, { foreignKey: 'licenseId', as: 'ledgerEntries' });
// LicenseLedger.belongsTo(License, ...) is defined in licenseLedger.ts

// LicenseTypeLookup associations
LicenseTypeLookup.hasMany(License, { foreignKey: 'typeId', as: 'licensesOfType' }); // Changed alias
// License.belongsTo(LicenseTypeLookup, ...) is defined in license.ts

// LicenseActionLookup associations
LicenseActionLookup.hasMany(LicenseLedger, { foreignKey: 'licenseActionId', as: 'ledgerEntries' });
// LicenseLedger.belongsTo(LicenseActionLookup, ...) is defined in licenseLedger.ts

// Server associations
Server.hasMany(LicenseLedger, { foreignKey: 'serverId', as: 'ledgerEntries' });
// LicenseLedger.belongsTo(Server, ...) is defined in licenseLedger.ts

// PurchaseOrder <-> License (Many-to-Many)
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
// Direct associations from join table are defined in poLicenseJoin.ts
// Inverse associations to join table (optional)
// PurchaseOrder.hasMany(POLicenseJoin, { foreignKey: 'poId', as: 'poLicenseJoins' });
// License.hasMany(POLicenseJoin, { foreignKey: 'licenseId', as: 'poLicenseJoins' });


// Export the connection and all models
const db = {
  sequelize: sequelizeConnection, // Use the correctly imported connection
  Sequelize, // Export Sequelize class itself if needed elsewhere
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

export default db;
