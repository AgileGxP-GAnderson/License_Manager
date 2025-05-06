import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
// Import Customer model if associations are defined here
// import Customer from './customer'; // Adjust path if needed

// Interface for Server attributes
interface ServerAttributes {
  id: number;
  customerId: number; // +++ Add customerId +++
  name: string;
  description?: string | null;
  fingerprint: Buffer;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Server creation attributes
// +++ customerId is required for creation, remove from Optional +++
export interface ServerInput extends Optional<ServerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

// Interface for Server output attributes
export interface ServerOutput extends Required<ServerAttributes> {}

// Define the Server model
class Server extends Model<ServerAttributes, ServerInput> implements ServerAttributes {
  public id!: number;
  public customerId!: number; // +++ Add customerId property +++
  public name!: string;
  public description!: string | null;
  public fingerprint!: Buffer;
  public isActive!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations (will be defined later if needed)
  // public readonly customer?: Customer; // Add if association is defined
  // public readonly licenseLedgers?: LicenseLedger[];

  // Define static init method
  public static initialize(sequelize: Sequelize) {
      Server.init({
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        // +++ Add customerId column definition +++
        customerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Customers', // Assuming your customer table is named 'Customers'
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE', // Or 'SET NULL'/'RESTRICT' depending on your requirements
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: 'unique_server_name_per_customer', // Make name unique per customer
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        fingerprint: {
          type: DataTypes.BLOB,
          allowNull: false,
          unique: 'unique_server_fingerprint_per_customer', // Make fingerprint unique per customer
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
        sequelize,
        tableName: 'Servers',
        timestamps: true,
        // +++ Add indexes for uniqueness constraint +++
        indexes: [
            {
                unique: true,
                fields: ['customerId', 'name'],
                name: 'unique_server_name_per_customer'
            },
            {
                unique: true,
                fields: ['customerId', 'fingerprint'],
                name: 'unique_server_fingerprint_per_customer'
            }
        ]
      });
  }

  // Define static associate method if needed
  // public static associate(models: any) {
  //    Server.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  //    Server.hasMany(models.LicenseLedger, { foreignKey: 'serverId', as: 'ledgerEntries' });
  // }
}

export default Server;
