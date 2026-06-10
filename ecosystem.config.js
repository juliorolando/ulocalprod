module.exports = {
  apps: [{
    name:    'ushuaialocal',
    script:  'server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch:   false,
    max_memory_restart: '200M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/err.log',
    out_file:   './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
