import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize'; // Import Sequelize type
// No longer need to import db here for initialization
import License, { LicenseOutput } from './license'; // Import License for association
import Server, { ServerOutput } from './server'; // Import Server for association
import LicenseActionLookup, { LicenseActionLookupOutput } from './licenseActionLookup'; // Import LicenseActionLookup for association

// Interface for LicenseLedger attributes
interface LicenseLedgerAttributes {
  id: number;
  licenseId: number;
  serverId?: number; // Note: Case matches SQL 'serverId'
  activityDate: Date; // Changed from TIMESTAMP
  licenseActionId: number;
  comment?: string | null;
  expirationDate?: Date; // Changed from DATE
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for LicenseLedger creation attributes
export interface LicenseLedgerInput extends Optional<LicenseLedgerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'comment'> {}

// Interface for LicenseLedger output attributes
export interface LicenseLedgerOutput extends Required<LicenseLedgerAttributes> {}

// Define the LicenseLedger model
class LicenseLedger extends Model<LicenseLedgerAttributes, LicenseLedgerInput> implements LicenseLedgerAttributes {
  public id!: number;
  public licenseId!: number;
  public serverId?: number;
  public activityDate!: Date;
  public licenseActionId!: number;
  public comment?: string | null;
  public expirationDate?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getLicense!: BelongsToGetAssociationMixin<LicenseOutput>;
  public readonly license?: LicenseOutput;

  public getServer!: BelongsToGetAssociationMixin<ServerOutput>;
  public readonly server?: ServerOutput;

  public getLicenseAction!: BelongsToGetAssociationMixin<LicenseActionLookupOutput>;
  public readonly licenseAction?: LicenseActionLookupOutput;

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      LicenseLedger.init({
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        licenseId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: License,
            key: 'id',
          },
        },
        serverId: { // Keep casing consistent with SQL definition
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: Server,
            key: 'id',
          },
          field: 'serverId', // Explicitly map to the 'serverId' column
        },
        activityDate: {
          type: DataTypes.DATE, // Use DATE for TIMESTAMP WITHOUT TIME ZONE
          allowNull: false,
        },
        licenseActionId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: LicenseActionLookup,
            key: 'id',
          },
        },
        comment: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        expirationDate: {
          type: DataTypes.DATEONLY, // Use DATEONLY for SQL DATE type
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
        tableName: 'LicenseLedger',
        timestamps: true,
      });
  }

  // Define static associate method if needed
  // public static associate(models: any) {
  //    LicenseLedger.belongsTo(models.License, { foreignKey: 'licenseId', as: 'license' });
  //    LicenseLedger.belongsTo(models.Server, { foreignKey: 'serverId', as: 'server' });
  //    LicenseLedger.belongsTo(models.LicenseActionLookup, { foreignKey: 'licenseActionId', as: 'licenseAction' });
  // }
}

export default LicenseLedger;
