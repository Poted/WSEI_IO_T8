const { exec } = require("child_process");
const path = require("path");

exec("cd backend/T8 && dotnet run", { detached: true });

setTimeout(() => {
    const file = path.join(__dirname, "frontend", "index.html");
    const command =
        process.platform === "win32"
            ? `start "" "${file}"`
            : process.platform === "darwin"
            ? `open "${file}"`
            : `xdg-open "${file}"`;

    exec(command);
}, 2000);
