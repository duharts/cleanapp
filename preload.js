const { exec } = require("child_process");

// All of the Node.js APIs are available in the preload process.
window.addEventListener("DOMContentLoaded", () => {
    exec(`npm run start:server`);
    console.log("execcd nopm ")
});
