import { DataTypes, Model, Optional, Sequelize } from 'sequelize'; // Import Sequelize type
// No longer need to import db here for initialization

// Interface for LicenseActionLookup attributes
interface LicenseActionLookupAttributes {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for LicenseActionLookup creation attributes
export interface LicenseActionLookupInput extends Optional<LicenseActionLookupAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

// Interface for LicenseActionLookup output attributes
export interface LicenseActionLookupOutput extends Required<LicenseActionLookupAttributes> {}

// Define the LicenseActionLookup model
class LicenseActionLookup extends Model<LicenseActionLookupAttributes, LicenseActionLookupInput> implements LicenseActionLookupAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations (will be defined later if needed)
  // public readonly licenseLedgers?: LicenseLedger[];

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      LicenseActionLookup.init({
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
        tableName: 'LicenseActionLookup',
        timestamps: true,
      });
  }

  // Define static associate method if needed
  // public static associate(models: any) {
  //    LicenseActionLookup.hasMany(models.LicenseLedger, { foreignKey: 'licenseActionId', as: 'ledgerEntries' });
  // }
}

export default LicenseActionLookup;
