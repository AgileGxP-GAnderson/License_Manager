import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize'; // Import Sequelize type
// No longer need to import db here for initialization
import Customer, { CustomerOutput } from './customer'; // Import Customer for association

// Interface for User attributes
interface UserAttributes {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string;
  login: string;
  email: string; // Changed from BIGINT to STRING
  passwordEncrypted: Buffer;
  isActive: boolean; // Corrected from BIGINT
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for User creation attributes
export interface UserInput extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Interface for User output attributes
export interface UserOutput extends Required<UserAttributes> {}

// Define the User model
class User extends Model<UserAttributes, UserInput> implements UserAttributes {
  public id!: number;
  public customerId!: number;
  public firstName!: string;
  public lastName!: string;
  public login!: string;
  public email!: string; // Changed from BIGINT to STRING
  public passwordEncrypted!: Buffer;
  public isActive!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getCustomer!: BelongsToGetAssociationMixin<CustomerOutput>;
  public readonly customer?: CustomerOutput;

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      User.init({
        id: {
          type: DataTypes.BIGINT, // Changed from DataTypes.INTEGER
          autoIncrement: true,
          primaryKey: true,
        },
        customerId: {
          type: DataTypes.BIGINT, // Changed from DataTypes.INTEGER
          allowNull: false,
          references: {
            model: Customer,
            key: 'id',
          },
        },
        firstName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        lastName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        login: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        email: {
          type: DataTypes.STRING, // Changed from DataTypes.BIGINT
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true, // Added email validation
          },
        },
        passwordEncrypted: {
          type: DataTypes.BLOB,
          allowNull: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN, // Corrected from DataTypes.BIGINT
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
        tableName: '"Users"', // Ensures exact, case-sensitive table name
        timestamps: true,
      });
  }

  // Define static associate method if needed
  public static associate(models: any) {
     User.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  }
}

export default User;
export type { UserAttributes}; // Export types
