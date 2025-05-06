import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface LicenseTypeLookupAttributes {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LicenseTypeLookupInput extends Optional<LicenseTypeLookupAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}
export interface LicenseTypeLookupOutput extends Required<LicenseTypeLookupAttributes> {}

class LicenseTypeLookup extends Model<LicenseTypeLookupAttributes, LicenseTypeLookupInput> implements LicenseTypeLookupAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initialize(sequelize: Sequelize) {
    LicenseTypeLookup.init({
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
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
      sequelize,
      tableName: 'LicenseTypeLookup',
      timestamps: true,
    });
  }
}

export default LicenseTypeLookup;
