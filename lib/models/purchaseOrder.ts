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
} from 'sequelize';
// No longer need to import db here for initialization
import Customer, { CustomerOutput } from './customer';
import License, { LicenseOutput } from './license'; // Import License for BelongsToMany association
// Import POLicenseJoin if needed for association definition below
// import POLicenseJoin from './poLicenseJoin';

// Interface for PurchaseOrder attributes
interface PurchaseOrderAttributes {
  id: number;
  poName: string;
  purchaseDate: Date; // Changed from DATE
  customerId: number;
  isClosed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for PurchaseOrder creation attributes
export interface PurchaseOrderInput extends Optional<PurchaseOrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Interface for PurchaseOrder output attributes
export interface PurchaseOrderOutput extends Required<PurchaseOrderAttributes> {}

// Define the PurchaseOrder model
class PurchaseOrder extends Model<PurchaseOrderAttributes, PurchaseOrderInput> implements PurchaseOrderAttributes {
  public id!: number;
  public poName!: string;
  public purchaseDate!: Date;
  public customerId!: number;
  public isClosed!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getCustomer!: BelongsToGetAssociationMixin<CustomerOutput>;
  public readonly customer?: CustomerOutput;

  // BelongsToMany association mixins for Licenses
  public addLicense!: BelongsToManyAddAssociationMixin<License, number>;
  public addLicenses!: BelongsToManyAddAssociationMixin<License, number[]>;
  public countLicenses!: BelongsToManyCountAssociationsMixin;
  public createLicense!: BelongsToManyCreateAssociationMixin<License>;
  public getLicenses!: BelongsToManyGetAssociationsMixin<License>;
  public hasLicense!: BelongsToManyHasAssociationMixin<License, number>;
  public hasLicenses!: BelongsToManyHasAssociationsMixin<License, number[]>;
  public removeLicense!: BelongsToManyRemoveAssociationMixin<License, number>;
  public removeLicenses!: BelongsToManyRemoveAssociationMixin<License, number[]>;
  public setLicenses!: BelongsToManySetAssociationsMixin<License, number[]>;
  public readonly licenses?: License[];

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      PurchaseOrder.init({
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        poName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        purchaseDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        customerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'Customers', // Name of the target table
            key: 'id',
          },
        },
        isClosed: {
          type: DataTypes.BOOLEAN,
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
        tableName: 'PurchaseOrders',
        timestamps: true,
      });
  }

  // Define static associate method if needed
  // public static associate(models: any) {
  //    PurchaseOrder.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  //    PurchaseOrder.belongsToMany(models.License, { through: models.POLicenseJoin, foreignKey: 'poId', otherKey: 'licenseId', as: 'licenses' });
  // }
}

export default PurchaseOrder;
