CREATE TABLE "Administrators"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "login" VARCHAR(255) NOT NULL,
    "passwordEncrypted" bytea NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Administrators" ADD PRIMARY KEY("id");
CREATE TABLE "Customers"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "businessName" VARCHAR(255) NOT NULL,
    "contactName" VARCHAR(255) NOT NULL,
    "contactEmail" VARCHAR(255) NULL,
    "contactPhone" VARCHAR(255) NULL,
    "businessAddress1" VARCHAR(255) NULL,
    "businessAddress2" VARCHAR(255) NULL,
    "businessAddressCity" VARCHAR(255) NULL,
    "businessAddressState" VARCHAR(255) NULL,
    "businessAddressZip" VARCHAR(255) NULL,
    "businessAddressCountry" VARCHAR(255) NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Customers" ADD PRIMARY KEY("id");
CREATE TABLE "PurchaseOrders"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "poName" VARCHAR(255) NOT NULL,
    "purchaseDate" DATE NOT NULL,
    "customerId" BIGINT NOT NULL,
    "isClosed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "PurchaseOrders" ADD PRIMARY KEY("id");
CREATE TABLE "LicenseTypeLookup"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "LicenseTypeLookup" ADD PRIMARY KEY("id");
CREATE TABLE "Servers"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NULL,
    "customerId" BIGINT NOT NULL,
    "fingerprint" bytea NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Servers" ADD PRIMARY KEY("id");
CREATE TABLE "Users"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "customerId" BIGINT NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "login" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordEncrypted" bytea NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Users" ADD PRIMARY KEY("id");
CREATE TABLE "Licenses"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "uniqueId" UUID NOT NULL,
    "externalName" VARCHAR(255) NULL,
    "licenseStatusId" BIGINT NOT NULL,
    "typeId" BIGINT NOT NULL,
    "comment" VARCHAR(255) NULL,
    "serverId" BIGINT NULL,
    "updatedBy" VARCHAR(255) NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Licenses" ADD PRIMARY KEY("id");
CREATE TABLE "PO_License_Join"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "poId" BIGINT NOT NULL,
    "licenseId" BIGINT NOT NULL,
    "duration" SMALLINT NOT NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "PO_License_Join" ADD PRIMARY KEY("id");
CREATE TABLE "LicenseStatusLookup"(
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "status" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "LicenseStatusLookup" ADD PRIMARY KEY("id");
CREATE TABLE "LicenseAudit"(
    "auditId" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    "Id" BIGINT NOT NULL,
    "uniqueId" UUID NULL,
    "externalName" VARCHAR(255) NULL,
    "licenseStatusId" BIGINT NOT NULL,
    "typeId" BIGINT NOT NULL,
    "comment" VARCHAR(255) NULL,
    "serverId" BIGINT NULL,
    "updatedBy" VARCHAR(255) NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "LicenseAudit" ADD PRIMARY KEY("auditId");
ALTER TABLE
    "PO_License_Join" ADD CONSTRAINT "po_license_join_licenseid_foreign" FOREIGN KEY("licenseId") REFERENCES "Licenses"("id");
ALTER TABLE
    "PurchaseOrders" ADD CONSTRAINT "purchaseorders_customerid_foreign" FOREIGN KEY("customerId") REFERENCES "Customers"("id");
ALTER TABLE
    "Licenses" ADD CONSTRAINT "licenses_typeid_foreign" FOREIGN KEY("typeId") REFERENCES "LicenseTypeLookup"("id");
ALTER TABLE
    "Servers" ADD CONSTRAINT "servers_customerid_foreign" FOREIGN KEY("customerId") REFERENCES "Customers"("id");
ALTER TABLE
    "Users" ADD CONSTRAINT "users_customerid_foreign" FOREIGN KEY("customerId") REFERENCES "Customers"("id");
ALTER TABLE
    "Licenses" ADD CONSTRAINT "licenses_licensestatusid_foreign" FOREIGN KEY("licenseStatusId") REFERENCES "LicenseStatusLookup"("id");
ALTER TABLE
    "Licenses" ADD CONSTRAINT "licenses_serverid_foreign" FOREIGN KEY("serverId") REFERENCES "Servers"("id");
ALTER TABLE
    "PO_License_Join" ADD CONSTRAINT "po_license_join_poid_foreign" FOREIGN KEY("poId") REFERENCES "PurchaseOrders"("id");