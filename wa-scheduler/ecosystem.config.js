module.exports = {
  apps: [
    {
      name: "wa-service",
      script: "dist/main.js",
      watch: false,
      instances: 1,
      exec_mode: "fork"
    }
  ]
};
