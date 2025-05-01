import { DataTypes, Model, Optional, Sequelize } from 'sequelize'; // Import Sequelize type
// No longer need to import db here for initialization

// Interface for Server attributes
interface ServerAttributes {
  id: number;
  name: string;
  description?: string | null;
  fingerprint: Buffer; // Changed from bytea
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Server creation attributes
export interface ServerInput extends Optional<ServerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

// Interface for Server output attributes
export interface ServerOutput extends Required<ServerAttributes> {}

// Define the Server model
class Server extends Model<ServerAttributes, ServerInput> implements ServerAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public fingerprint!: Buffer;
  public isActive!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations (will be defined later if needed)
  // public readonly licenseLedgers?: LicenseLedger[];

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      Server.init({
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
        fingerprint: {
          type: DataTypes.BLOB,
          allowNull: false,
          unique: true,
        },
        isActive: {
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
        tableName: 'Servers',
        timestamps: true,
      });
  }

  // Define static associate method if needed
  // public static associate(models: any) {
  //    Server.hasMany(models.LicenseLedger, { foreignKey: 'serverId', as: 'ledgerEntries' });
  // }
}

export default Server;
