const { createAnonSupabaseClient } = require('../config/supabase');
const repository = require('../repositories/healthRepository');
const { getTableName, COLLECTIONS } = require('../utils/tableNames');

exports.getHealth = (req, res) => res.status(200).json({ status: 'ok' });

exports.getDatabaseHealth = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    // checkEnv rejects unknown environments at startup, so the table name always resolves.
    // Row Level Security hides rows from the anon key; the query still has to reach the database.
    const { error } = await repository.readOneRow(
      createAnonSupabaseClient(),
      getTableName(COLLECTIONS).tableName,
    );
    if (error) throw error;
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Database health check failed:', error);
    return res.status(503).json({ status: 'error' });
  }
};
