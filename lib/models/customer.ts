import { DataTypes, Model, Optional, Sequelize } from 'sequelize'; // Import Sequelize type

interface CustomerAttributes {
  id: number;
  businessName: string;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  businessAddress1?: string | null;
  businessAddress2?: string | null;
  businessAddressCity?: string | null;
  businessAddressState?: string | null;
  businessAddressZip?: string | null;
  businessAddressCountry?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerInput extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'contactEmail' | 'contactPhone' | 'businessAddress1' | 'businessAddress2' | 'businessAddressCity' | 'businessAddressState' | 'businessAddressZip' | 'businessAddressCountry'> {}

export interface CustomerOutput extends Required<CustomerAttributes> {}

class Customer extends Model<CustomerAttributes, CustomerInput> implements CustomerAttributes {
  public id!: number;
  public businessName!: string;
  public contactName!: string;
  public contactEmail!: string | null;
  public contactPhone!: string | null;
  public businessAddress1!: string | null;
  public businessAddress2!: string | null;
  public businessAddressCity!: string | null;
  public businessAddressState!: string | null;
  public businessAddressZip!: string | null;
  public businessAddressCountry!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;


  public static initialize(sequelize: Sequelize) {
      Customer.init({
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        businessName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        contactName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        contactEmail: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isEmail: true,
          },
        },
        contactPhone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        businessAddress1: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        businessAddress2: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        businessAddressCity: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        businessAddressState: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        businessAddressZip: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        businessAddressCountry: {
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
        tableName: 'Customers',
        timestamps: true,
      });
  }

  public static associate(models: any) {
    Customer.hasMany(models.PurchaseOrder, {
      foreignKey: 'customerId',
      as: 'purchaseOrders',
    });

    Customer.hasMany(models.User, {
      foreignKey: 'customerId',
      as: 'users',
    });
  }
}

export default Customer;
