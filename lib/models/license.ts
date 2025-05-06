import {
  DataTypes, Model, Optional, Sequelize,
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
  InstanceUpdateOptions // Import InstanceUpdateOptions for hook options type
} from 'sequelize';
// No longer need to import db here for initialization
import LicenseTypeLookup, { LicenseTypeLookupOutput } from './licenseTypeLookup';
import PurchaseOrder from './purchaseOrder'; // Import PurchaseOrder for BelongsToMany association
// import LicenseLedger from './licenseLedger'; // Import LicenseLedger for HasMany association
import LicenseAudit from './licenseAudit'; // Import LicenseAudit model
// import Server from './server'; // Removed import, association handled in db.ts

// Interface for License attributes
interface LicenseAttributes {
  id: number;
  uniqueId: string; // UUID
  externalName?: string | null;
  licenseStatusId: number;
  typeId: number;
  comment?: string | null;
  serverId?: number | null;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for License creation attributes
export interface LicenseInput extends Optional<LicenseAttributes, 'id' | 'externalName' | 'comment' | 'serverId' | 'updatedBy' | 'createdAt' | 'updatedAt'> {}

// Interface for License output attributes
export interface LicenseOutput extends Required<LicenseAttributes> {}

// Define the License model
class License extends Model<LicenseAttributes, LicenseInput> implements LicenseAttributes {
  public id!: number;
  public uniqueId!: string;
  public externalName!: string | null;
  public licenseStatusId!: number;
  public typeId!: number;
  public comment!: string | null;
  public serverId!: number | null;
  public updatedBy!: string | null;

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
  public removeLedgerEntries!: HasManyRemoveAssociationsMixin<LicenseLedger, number>;
  public setLedgerEntries!: HasManySetAssociationsMixin<LicenseLedger, number>;
  // public readonly ledgerEntries?: LicenseLedger[]; // Removed

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      License.init({
        id: {
          type: DataTypes.BIGINT,
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
          allowNull: true,
        },
        licenseStatusId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'LicenseStatusLookup', // Changed from model class to table name string
            key: 'id',
          },
        },
        typeId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'LicenseTypeLookup', // Changed from model class to table name string
            key: 'id',
          },
        },
        comment: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        serverId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'Servers', // Ensured this is a table name string
            key: 'id',
          },
        },
        updatedBy: {
          type: DataTypes.STRING,
          allowNull: true,
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
        hooks: {
          afterUpdate: async (instance: License, options: InstanceUpdateOptions) => {
            try {
              await LicenseAudit.create({
                licenseIdRef: instance.id,
                uniqueId: instance.uniqueId,
                externalName: instance.externalName,
                licenseStatusId: instance.licenseStatusId,
                typeId: instance.typeId,
                comment: instance.comment,
                serverId: instance.serverId,
                updatedBy: instance.updatedBy,
              }, { transaction: options.transaction });
            } catch (error) {
              console.error('Failed to create LicenseAudit record:', error);
            }
          }
        }
      });
  }

  // Define static associate method
  public static associate(models: any) {
    License.belongsTo(models.LicenseTypeLookup, { foreignKey: 'typeId', as: 'type' });
    // License.belongsTo(models.Server, { foreignKey: 'serverId', as: 'server' }); // Removed, association handled in db.ts
    License.belongsToMany(models.PurchaseOrder, {
      through: models.POLicenseJoin, // Use models.POLicenseJoin
      foreignKey: 'licenseId',
      otherKey: 'poId', // Corrected based on typical join table naming for PurchaseOrder's ID
      as: 'purchaseOrders'
    });
  }
}

export default License;
