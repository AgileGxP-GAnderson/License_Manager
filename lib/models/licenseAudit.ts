import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface LicenseAuditAttributes {
  auditId: number;
  licenseIdRef: number; // Corresponds to "Id" in the schema's LicenseAudit table
  uniqueId?: string | null; // UUID
  externalName?: string | null;
  licenseStatusId: number;
  typeId: number;
  comment?: string | null;
  serverId?: number | null;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LicenseAuditInput extends Optional<LicenseAuditAttributes, 'auditId' | 'uniqueId' | 'externalName' | 'comment' | 'serverId' | 'updatedBy' | 'createdAt' | 'updatedAt'> {}
export interface LicenseAuditOutput extends Required<LicenseAuditAttributes> {}

class LicenseAudit extends Model<LicenseAuditAttributes, LicenseAuditInput> implements LicenseAuditAttributes {
  public auditId!: number;
  public licenseIdRef!: number;
  public uniqueId!: string | null;
  public externalName!: string | null;
  public licenseStatusId!: number;
  public typeId!: number;
  public comment!: string | null;
  public serverId!: number | null;
  public updatedBy!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initialize(sequelize: Sequelize) {
    LicenseAudit.init({
      auditId: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      licenseIdRef: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'Id', // Maps to the "Id" column in the database, which is FK to Licenses.id
      },
      uniqueId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      externalName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      licenseStatusId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      typeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      comment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      serverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedBy: {
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
      tableName: 'LicenseAudit',
      timestamps: true,
    });
  }

  public static associate(models: any) {
    LicenseAudit.belongsTo(models.LicenseStatusLookup, {
      foreignKey: 'licenseStatusId',
      as: 'licenseStatus',
    });
    LicenseAudit.belongsTo(models.LicenseTypeLookup, {
      foreignKey: 'typeId',
      as: 'licenseType',
    });
    LicenseAudit.belongsTo(models.Server, {
      foreignKey: 'serverId',
      as: 'server',
    });
  }
}

export default LicenseAudit;
