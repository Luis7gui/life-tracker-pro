module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database/life_tracker.db'
    },
    migrations: {
      directory: './database/migrations'
    },
    seeds: {
      directory: './database/seeds'
    },
    useNullAsDefault: true
  }
};
