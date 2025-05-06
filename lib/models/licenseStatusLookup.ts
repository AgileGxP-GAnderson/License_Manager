import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface LicenseStatusLookupAttributes {
  id: number;
  name: string; // Changed from status to name
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LicenseStatusLookupInput extends Optional<LicenseStatusLookupAttributes, 'id' | 'createdAt' | 'updatedAt'> {}
export interface LicenseStatusLookupOutput extends Required<LicenseStatusLookupAttributes> {}

class LicenseStatusLookup extends Model<LicenseStatusLookupAttributes, LicenseStatusLookupInput> implements LicenseStatusLookupAttributes {
  public id!: number;
  public name!: string; // Changed from status to name
  public description!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initialize(sequelize: Sequelize) {
    LicenseStatusLookup.init({
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { // Changed from status to name
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
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
      sequelize,
      tableName: 'LicenseStatusLookup',
      timestamps: true,
    });
  }

  // Define static associate method
  public static associate(models: any) {
    LicenseStatusLookup.hasMany(models.License, { foreignKey: 'licenseStatusId', as: 'licensesWithStatus' });
  }
}

export default LicenseStatusLookup;
