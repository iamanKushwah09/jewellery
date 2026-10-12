module.exports = {
  apps: [
    // Node.js API Server (api.logicfirst.in)
    {
      name: "logicfirst-api",
      cwd: "C:/inetpub/wwwroot/logicfirstwithadmin/server",
      script: "api/index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 5060
      }
    },
  ]
};
