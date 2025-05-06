import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import Customer, { CustomerOutput } from './customer'; // Import Customer for association

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

export interface ServerInput extends Optional<ServerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

export interface ServerOutput extends Required<ServerAttributes> {}

class Server extends Model<ServerAttributes, ServerInput> implements ServerAttributes {
  public id!: number;
  public customerId!: number; // +++ Add customerId property +++
  public name!: string;
  public description!: string | null;
  public fingerprint!: Buffer;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly customer?: CustomerOutput;

  public static initialize(sequelize: Sequelize) {
      Server.init({
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        customerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Customers', // Ensured this is a table name string
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

  public static associate(models: any) {
    Server.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Server.hasMany(models.License, { foreignKey: 'serverId', as: 'licenses' });
  }
}

export default Server;
