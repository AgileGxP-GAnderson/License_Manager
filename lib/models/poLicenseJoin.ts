import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize'; // Import Sequelize type

interface POLicenseJoinAttributes {
  id: number;
  poId: number;
  licenseId: number;
  duration: number; // Changed from SMALLINT
  createdAt?: Date;
  updatedAt?: Date;
}

export interface POLicenseJoinInput extends Optional<POLicenseJoinAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface POLicenseJoinOutput extends Required<POLicenseJoinAttributes> {}

class POLicenseJoin extends Model<POLicenseJoinAttributes, POLicenseJoinInput> implements POLicenseJoinAttributes {
  public id!: number;
  public poId!: number;
  public licenseId!: number;
  public duration!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getPurchaseOrder!: BelongsToGetAssociationMixin<PurchaseOrderOutput>;
  public readonly purchaseOrder?: PurchaseOrderOutput;

  public getLicense!: BelongsToGetAssociationMixin<LicenseOutput>;
  public readonly license?: LicenseOutput;

  public static initialize(sequelize: Sequelize) {
      POLicenseJoin.init({
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        poId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'PurchaseOrders', // Changed from PurchaseOrder model to table name string
            key: 'id',
          },
        },
        licenseId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'Licenses', // Changed from License model to table name string
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

  public static associate(models: any) {
    POLicenseJoin.belongsTo(models.PurchaseOrder, { foreignKey: 'poId', as: 'purchaseOrder' });
    POLicenseJoin.belongsTo(models.License, { foreignKey: 'licenseId', as: 'license' });
  }
}

export default POLicenseJoin;
