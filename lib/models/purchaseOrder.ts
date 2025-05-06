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

interface PurchaseOrderAttributes {
  id: number;
  poName: string;
  purchaseDate: Date; // Changed from DATE
  customerId: number;
  isClosed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseOrderInput extends Optional<PurchaseOrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface PurchaseOrderOutput extends Required<PurchaseOrderAttributes> {}

class PurchaseOrder extends Model<PurchaseOrderAttributes, PurchaseOrderInput> implements PurchaseOrderAttributes {
  public id!: number;
  public poName!: string;
  public purchaseDate!: Date;
  public customerId!: number;
  public isClosed!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getCustomer!: BelongsToGetAssociationMixin<CustomerOutput>;
  public readonly customer?: CustomerOutput;

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

  public static initialize(sequelize: Sequelize) {
      PurchaseOrder.init({
        id: {
          type: DataTypes.BIGINT,
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
            model: 'Customers', // Changed from model class to table name string
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

  public static associate(models: any) {
     PurchaseOrder.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
     PurchaseOrder.belongsToMany(models.License, { through: models.POLicenseJoin, foreignKey: 'poId', otherKey: 'licenseId', as: 'licenses' });
  }
}

export default PurchaseOrder;
