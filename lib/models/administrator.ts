import { DataTypes, Model, Optional, Sequelize } from 'sequelize'; // Import Sequelize type

// Interface for Administrator attributes
interface AdministratorAttributes {
  id: number;
  firstName: string;
  lastName: string;
  login: string;
  passwordEncrypted: Buffer; // Using Buffer for bytea -> BLOB
  isActive: boolean;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Administrator creation attributes (optional 'id', 'createdAt', 'updatedAt')
export interface AdministratorInput extends Optional<AdministratorAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Interface for Administrator output attributes (same as attributes)
export interface AdministratorOutput extends Required<AdministratorAttributes> {}

// Define the Administrator model
class Administrator extends Model<AdministratorAttributes, AdministratorInput> implements AdministratorAttributes {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public login!: string;
  public passwordEncrypted!: Buffer;
  public isActive!: boolean;
  public email!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define static init method to be called from db.ts
  public static initialize(sequelize: Sequelize) {
      Administrator.init({
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
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
        passwordEncrypted: {
          type: DataTypes.BLOB,
          allowNull: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
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
        tableName: 'Administrators',
        timestamps: true,
      });
  }

   // Define static associate method if needed (or keep associations central)
   // public static associate(models: any) {
   //   // define association here
   // }
}

export default Administrator;
