exports.readOneRow = async (client, tableName) => client.from(tableName).select('id').limit(1);
