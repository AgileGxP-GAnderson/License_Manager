import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface LicenseStatusLookupAttributes {
  id: number;
  status: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LicenseStatusLookupInput extends Optional<LicenseStatusLookupAttributes, 'id' | 'createdAt' | 'updatedAt'> {}
export interface LicenseStatusLookupOutput extends Required<LicenseStatusLookupAttributes> {}

class LicenseStatusLookup extends Model<LicenseStatusLookupAttributes, LicenseStatusLookupInput> implements LicenseStatusLookupAttributes {
  public id!: number;
  public status!: string;
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
      status: {
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
}

export default LicenseStatusLookup;
