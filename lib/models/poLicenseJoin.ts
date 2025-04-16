import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize'; // Import Sequelize type
// No longer need to import db here for initialization
import PurchaseOrder, { PurchaseOrderOutput } from './purchaseOrder'; // Import for association
import License, { LicenseOutput } from './license'; // Import for association

// Interface for PO_License_Join attributes
interface POLicenseJoinAttributes {
  id: number;
  poId: number;
  licenseId: number;
  duration: number; // Changed from SMALLINT
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for PO_License_Join creation attributes
export interface POLicenseJoinInput extends Optional<POLicenseJoinAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Interface for PO_License_Join output attributes
export interface POLicenseJoinOutput extends Required<POLicenseJoinAttributes> {}

// Define the PO_License_Join model
class POLicenseJoin extends Model<POLicenseJoinAttributes, POLicenseJoinInput> implements POLicenseJoinAttributes {
  public id!: number;
  public poId!: number;
  public licenseId!: number;
  public duration!: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations (defined below, but accessors can be typed here if needed)
  public getPurchaseOrder!: BelongsToGetAssociationMixin<PurchaseOrderOutput>;
  public readonly purchaseOrder?: PurchaseOrderOutput;

  public getLicense!: BelongsToGetAssociationMixin<LicenseOutput>;
  public readonly license?: LicenseOutput;

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      POLicenseJoin.init({
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        poId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: PurchaseOrder,
            key: 'id',
          },
        },
        licenseId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: License,
            key: 'id',
          },
        },
        duration: {
          type: DataTypes.SMALLINT,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      }, {
        sequelize, // Pass the connection here
        tableName: 'PO_License_Join',
        timestamps: true,
      });
  }

   // Define static associate method if needed
  // public static associate(models: any) {
  //    POLicenseJoin.belongsTo(models.PurchaseOrder, { foreignKey: 'poId', as: 'purchaseOrder' });
  //    POLicenseJoin.belongsTo(models.License, { foreignKey: 'licenseId', as: 'license' });
  // }
}

export default POLicenseJoin;
