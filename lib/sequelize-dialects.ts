import pg from 'pg';
import pgHstore from 'pg-hstore';

export const dialectModules = {
  postgres: pg,
  pg: pg,
'pg-hstore': pgHstore,
};

export const hstoreModule = pgHstore;