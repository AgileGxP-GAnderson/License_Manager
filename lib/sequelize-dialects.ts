import pg from 'pg';
import pgHstore from 'pg-hstore';

// Export dialectModules to be used in your Sequelize configuration
export const dialectModules = {
  postgres: pg,
  pg: pg
};

export const hstoreModule = pgHstore;