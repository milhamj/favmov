const TIMEOUT_MS = 5000;

exports.readOneRow = async (client, tableName) =>
  client.from(tableName).select('id').limit(1).abortSignal(AbortSignal.timeout(TIMEOUT_MS));
