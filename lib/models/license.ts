import {
  DataTypes, Model, Optional, Sequelize, // Import Sequelize type
  BelongsToGetAssociationMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyCountAssociationsMixin,
  BelongsToManyCreateAssociationMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyHasAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManyRemoveAssociationsMixin,
  HasManySetAssociationsMixin,
} from 'sequelize';
// No longer need to import db here for initialization
import LicenseTypeLookup, { LicenseTypeLookupOutput } from './licenseTypeLookup';
import PurchaseOrder from './purchaseOrder'; // Import PurchaseOrder for BelongsToMany association
import LicenseLedger from './licenseLedger'; // Import LicenseLedger for HasMany association

// Interface for License attributes
interface LicenseAttributes {
  id: number;
  uniqueId: string; // UUID
  externalName: string; // Corrected from BIGINT
  typeId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for License creation attributes
export interface LicenseInput extends Optional<LicenseAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Interface for License output attributes
export interface LicenseOutput extends Required<LicenseAttributes> {}

// Define the License model
class License extends Model<LicenseAttributes, LicenseInput> implements LicenseAttributes {
  public id!: number;
  public uniqueId!: string;
  public externalName!: string;
  public typeId!: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getType!: BelongsToGetAssociationMixin<LicenseTypeLookupOutput>;
  public readonly type?: LicenseTypeLookupOutput;

  // BelongsToMany association mixins for PurchaseOrders
  public addPurchaseOrder!: BelongsToManyAddAssociationMixin<PurchaseOrder, number>;
  public addPurchaseOrders!: BelongsToManyAddAssociationMixin<PurchaseOrder, number[]>;
  public countPurchaseOrders!: BelongsToManyCountAssociationsMixin;
  public createPurchaseOrder!: BelongsToManyCreateAssociationMixin<PurchaseOrder>;
  public getPurchaseOrders!: BelongsToManyGetAssociationsMixin<PurchaseOrder>;
  public hasPurchaseOrder!: BelongsToManyHasAssociationMixin<PurchaseOrder, number>;
  public hasPurchaseOrders!: BelongsToManyHasAssociationsMixin<PurchaseOrder, number[]>;
  public removePurchaseOrder!: BelongsToManyRemoveAssociationMixin<PurchaseOrder, number>;
  public removePurchaseOrders!: BelongsToManyRemoveAssociationMixin<PurchaseOrder, number[]>;
  public setPurchaseOrders!: BelongsToManySetAssociationsMixin<PurchaseOrder, number[]>;
  public readonly purchaseOrders?: PurchaseOrder[];

  // HasMany association mixins for LicenseLedgers
  public addLedgerEntry!: HasManyAddAssociationMixin<LicenseLedger, number>;
  public addLedgerEntries!: HasManyAddAssociationsMixin<LicenseLedger, number>;
  public countLedgerEntries!: HasManyCountAssociationsMixin;
  public createLedgerEntry!: HasManyCreateAssociationMixin<LicenseLedger>;
  public getLedgerEntries!: HasManyGetAssociationsMixin<LicenseLedger>;
  public hasLedgerEntry!: HasManyHasAssociationMixin<LicenseLedger, number>;
  public hasLedgerEntries!: HasManyHasAssociationsMixin<LicenseLedger, number>;
  public removeLedgerEntry!: HasManyRemoveAssociationMixin<LicenseLedger, number>;
  public removeLedgerEntries!: HasManyRemoveAssociationMixin<LicenseLedger, number>;
  public setLedgerEntries!: HasManySetAssociationsMixin<LicenseLedger, number>;
  public readonly ledgerEntries?: LicenseLedger[];

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      License.init({
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        uniqueId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          unique: true,
        },
        externalName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        typeId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: LicenseTypeLookup,
            key: 'id',
          },
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
        tableName: 'Licenses',
        timestamps: true,
      });
  }

  // Define static associate method if needed
  // public static associate(models: any) {
  //    License.belongsTo(models.LicenseTypeLookup, { foreignKey: 'typeId', as: 'type' });
  //    License.belongsToMany(models.PurchaseOrder, { through: models.POLicenseJoin, foreignKey: 'licenseId', otherKey: 'poId', as: 'purchaseOrders' });
  //    License.hasMany(models.LicenseLedger, { foreignKey: 'licenseId', as: 'ledgerEntries' });
  // }
}

export default License;
