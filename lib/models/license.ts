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
import LicenseTypeLookup, { LicenseTypeLookupOutput } from './licenseTypeLookup';
import PurchaseOrder from './purchaseOrder'; // Import PurchaseOrder for BelongsToMany association
import LicenseAudit from './licenseAudit'; // Import LicenseAudit model

let models: any; // Declare models at the module scope

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

export interface LicenseInput extends Optional<LicenseAttributes, 'id' | 'externalName' | 'comment' | 'serverId' | 'updatedBy' | 'createdAt' | 'updatedAt'> {}

export interface LicenseOutput extends Required<LicenseAttributes> {}

class License extends Model<LicenseAttributes, LicenseInput> implements LicenseAttributes {
  public id!: number;
  public uniqueId!: string;
  public externalName!: string | null;
  public licenseStatusId!: number;
  public typeId!: number;
  public comment!: string | null;
  public serverId!: number | null;
  public updatedBy!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getType!: BelongsToGetAssociationMixin<LicenseTypeLookupOutput>;
  public readonly type?: LicenseTypeLookupOutput;

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
          defaultValue: 1, // Default to 'Available'
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
          afterCreate: async (instance: License, options: any) => { // Added afterCreate hook
            try {
              await sequelize.models.LicenseAudit.create({
                licenseIdRef: instance.id,
                uniqueId: instance.uniqueId,
                externalName: instance.externalName,
                licenseStatusId: instance.licenseStatusId,
                typeId: instance.typeId,
                comment: instance.comment,
                serverId: instance.serverId,
                updatedBy: instance.updatedBy, // This might be null on creation, consider how to handle
              }, { transaction: options.transaction });
            } catch (error) {
              console.error('Failed to create LicenseAudit record on create:', error);
              throw error; // Re-throw the error to ensure transaction rollback
            }
          },
          afterUpdate: async (instance: License, options: InstanceUpdateOptions) => {
            try {
              await sequelize.models.LicenseAudit.create({
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
              console.error('Failed to create LicenseAudit record on update:', error);
              throw error; // Re-throw the error to ensure transaction rollback
            }
          }
        }
      });
  }

  public static associate(models_param: any) { // Renamed models to models_param to avoid conflict
    models = models_param; // Assign to module-level models variable
    License.belongsTo(models.LicenseTypeLookup, { foreignKey: 'typeId', as: 'type' });
    License.belongsTo(models.LicenseStatusLookup, { foreignKey: 'licenseStatusId', as: 'licenseStatus' });
    License.belongsTo(models.Server, { foreignKey: 'serverId', as: 'server' }); // Added missing belongsTo Server
    License.belongsToMany(models.PurchaseOrder, {
      through: models.POLicenseJoin, // Use models.POLicenseJoin
      foreignKey: 'licenseId',
      otherKey: 'poId', // Corrected based on typical join table naming for PurchaseOrder's ID
      as: 'purchaseOrders'
    });
  }
}

export default License;
