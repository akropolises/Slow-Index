const { spawnSync } = require("child_process");

const result = spawnSync("npm", ["run", "make"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    MICRO_SLOW_INCLUDE_LOCAL_CONFIG: "1",
  },
});

process.exit(result.status ?? 1);
