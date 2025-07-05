module.exports = {
  apps: [{
    name: "neff-paving",
    script: "npm",
    args: "run dev",
    cwd: "C:/Users/admin/Repos/Neff-Paving",
    env: {
      NODE_ENV: "development",
    },
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    time: true
  }]
}
