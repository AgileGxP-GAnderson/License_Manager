import { DataTypes, Model, Optional, Sequelize } from 'sequelize'; // Import Sequelize type
// No longer need to import db here for initialization

// Interface for LicenseTypeLookup attributes
interface LicenseTypeLookupAttributes {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for LicenseTypeLookup creation attributes
export interface LicenseTypeLookupInput extends Optional<LicenseTypeLookupAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

// Interface for LicenseTypeLookup output attributes
export interface LicenseTypeLookupOutput extends Required<LicenseTypeLookupAttributes> {}

// Define the LicenseTypeLookup model
class LicenseTypeLookup extends Model<LicenseTypeLookupAttributes, LicenseTypeLookupInput> implements LicenseTypeLookupAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations (will be defined later if needed)
  // public readonly licenses?: License[];

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      LicenseTypeLookup.init({
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
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
        tableName: 'LicenseTypeLookup',
        timestamps: true,
      });
  }

  // Define static associate method if needed
  // public static associate(models: any) {
  //    LicenseTypeLookup.hasMany(models.License, { foreignKey: 'typeId', as: 'licensesOfType' });
  // }
}

export default LicenseTypeLookup;
