using System.Diagnostics;

var frontendPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", ".."));

if (!Directory.Exists(frontendPath) || !File.Exists(Path.Combine(frontendPath, "package.json")))
{
    throw new InvalidOperationException($"Unable to locate frontend directory from {AppContext.BaseDirectory}");
}

Console.WriteLine($"Starting frontend from {frontendPath}");

var nodeModulesPath = Path.Combine(frontendPath, "node_modules");
if (!Directory.Exists(nodeModulesPath))
{
    Console.WriteLine("Installing frontend dependencies...");
    var install = StartProcess("cmd.exe", $"/c npm.cmd install", frontendPath);
    install.WaitForExit();
    if (install.ExitCode != 0)
    {
        Environment.Exit(install.ExitCode);
    }
}

Console.WriteLine("Launching Vite dev server...");
var vite = StartProcess("cmd.exe", "/c npm.cmd run dev -- --host 0.0.0.0", frontendPath);
vite.WaitForExit();

static Process StartProcess(string fileName, string arguments, string workingDirectory)
{
    var startInfo = new ProcessStartInfo(fileName, arguments)
    {
        WorkingDirectory = workingDirectory,
        UseShellExecute = false,
        RedirectStandardOutput = false,
        RedirectStandardError = false,
        CreateNoWindow = false
    };

    return Process.Start(startInfo)!;
}
