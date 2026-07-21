const fs = require("fs");
const path = require("path");

module.exports = {
  packagerConfig: {
    name: "Slow Index",
    executableName: "Slow Index",
    icon: "assets/app-icon",
    ignore: [
      "^/config\\.local\\.js$",
      "^/forge\\.config\\.js$",
      "^/scripts($|/)",
      "^/out($|/)",
      "^/\\.git($|/)",
    ],
  },
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      if (process.env.SLOW_INDEX_INCLUDE_LOCAL_CONFIG !== "1") {
        return;
      }

      const source = path.join(__dirname, "config.local.js");
      if (!fs.existsSync(source)) {
        throw new Error("config.local.js was not found. Create it before running npm run make:local.");
      }

      fs.copyFileSync(source, path.join(buildPath, "config.local.js"));
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32"],
    },
  ],
};
