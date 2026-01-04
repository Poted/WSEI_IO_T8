const { exec, spawn } = require("child_process");
const path = require("path");

console.log("Starting backend server...");

// Start backend with proper error handling
const backendProcess = spawn("dotnet", ["run"], {
    cwd: path.join(__dirname, "backend", "T8"),
    stdio: "inherit",
    shell: true
});

backendProcess.on("error", (error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
});

// Wait a bit for backend to start, then open frontend
setTimeout(() => {
    console.log("Opening frontend...");
    const file = path.join(__dirname, "frontend", "index.html");
    const command =
        process.platform === "win32"
            ? `start "" "${file}"`
            : process.platform === "darwin"
            ? `open "${file}"`
            : `xdg-open "${file}"`;

    exec(command, (error) => {
        if (error) {
            console.error("Failed to open frontend:", error);
        }
    });
}, 3000);

// Handle process termination
process.on("SIGINT", () => {
    console.log("\nShutting down...");
    backendProcess.kill();
    process.exit(0);
});
