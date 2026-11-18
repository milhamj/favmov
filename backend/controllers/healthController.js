const { createAnonSupabaseClient } = require('../config/supabase');
const repository = require('../repositories/healthRepository');
const { getTableName, COLLECTIONS } = require('../utils/tableNames');

exports.getHealth = (req, res) => res.status(200).json({ status: 'ok' });

exports.getDatabaseHealth = async (req, res) => {
  try {
    const { tableName, error: tableError } = getTableName(COLLECTIONS);
    if (tableError) throw new Error(tableError);
    // Row Level Security hides rows from the anon key; the query still has to reach the database.
    const { error } = await repository.readOneRow(createAnonSupabaseClient(), tableName);
    if (error) throw new Error(error.message);
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return res.status(503).json({ status: 'error' });
  }
};
