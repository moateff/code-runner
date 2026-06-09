using Compiler.Application.Interfaces;
using Compiler.Domain.Entities;
using Docker.DotNet;
using Docker.DotNet.Models;
using ICSharpCode.SharpZipLib.Tar;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
namespace Compiler.Infrastructure.Services;

public class DockerRunnerService : IDockerRunnerService
{
    private readonly DockerClient _dockerClient;
    private readonly ILogger<DockerRunnerService> _logger;

    private const int TimeoutSeconds = 5;
    private const long MemoryLimitBytes = 256 * 1024 * 1024;



    public DockerRunnerService(ILogger<DockerRunnerService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // 1. Check if an environment variable is explicitly set
        var dockerUri = Environment.GetEnvironmentVariable("DOCKER_HOST");

        if (string.IsNullOrEmpty(dockerUri))
        {
            // 2. If not set, choose the fallback path based on your current Operating System
            dockerUri = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? "npipe://./pipe/docker_engine"       // 🪟 Default for local Windows development
                : "unix:///var/run/docker.sock";       // 🐧 Default for Linux / inside a Docker Container
        }

        _logger.LogInformation("Initializing DockerClient with URI: {Uri}", dockerUri);

        _dockerClient = new DockerClientConfiguration(new Uri(dockerUri))
            .CreateClient();
    }
    public async Task<CompilationResult> ExecuteAsync(
            string language,
            string code,
            string input,
            CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        string containerId = string.Empty;

        try
        {
            // Create + start container (idle)
            containerId = await CreateAndStartContainer(language, cancellationToken);

            // Ensure container is actually running (IMPORTANT FIX)
            await EnsureContainerRunning(containerId, cancellationToken);

            // Inject source code into container
            await CopyFileToContainer(
                containerId,
                GetSourceFileName(language),
                code,
                cancellationToken);

            // Inject input if needed   
            string safeInput = !string.IsNullOrEmpty(input) ? input : "";
            Console.WriteLine("Input : " + input);
            Console.WriteLine("Safe Input : " + safeInput);

            if (!safeInput.EndsWith("\n"))
            {
                safeInput += "\n";
            }

            await CopyFileToContainer(
                containerId,
                "input.txt",
                safeInput,
                cancellationToken);
            

            // Execute (safe exec API)
            var result = await ExecuteInContainer(containerId, language, input, cancellationToken);

            sw.Stop();
            result.ExecutionTimeMs = sw.ElapsedMilliseconds;

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Execution failed");

            return new CompilationResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = ex.Message,
                ExecutionTimeMs = sw.ElapsedMilliseconds
            };
        }
        finally
        {
            if (!string.IsNullOrEmpty(containerId))
                await SafeRemoveContainer(containerId);
        }
    }

    private string BuildCommand(string language)
    {
        // Uses a completely clean string token structure that translates perfectly on both OS hosts
        string inputRedirection = " [ -f /workspace/input.txt ] && < /workspace/input.txt || true";

        return language switch
        {
            "python" => $"python3 /workspace/main.py{inputRedirection}",
            "cpp" => $"g++ /workspace/main.cpp -o /workspace/a.out && /workspace/a.out{inputRedirection}",
            "java" => $"javac /workspace/Main.java && java -cp /workspace Main{inputRedirection}",
            _ => throw new ArgumentException("Unsupported language")
        };
    }

    private async Task<string> CreateAndStartContainer(
        string language,
        CancellationToken ct)
    {
        var container = await _dockerClient.Containers.CreateContainerAsync(
            new CreateContainerParameters
            {
                Image = GetImage(language),
                WorkingDir = "/workspace",

                Cmd = new[] { "sleep", "infinity" }, // keep alive

                Tty = false,

                HostConfig = new HostConfig
                {
                    AutoRemove = false,
                    NetworkMode = "none",
                    Memory = MemoryLimitBytes
                }
            },
            ct);

        await _dockerClient.Containers.StartContainerAsync(container.ID, null, ct);

        return container.ID;
    }


    private async Task CopyFileToContainer(
    string containerId,
    string fileName,
    string content,
    CancellationToken ct)
    {
        // 🌟 CROSS-PLATFORM FIX: Normalize line breaks to Unix-style LF (\n)
        // This strips out any harmful Windows carriage returns (\r) before writing to the container
        var normalizedContent = content.Replace("\r\n", "\n");

        var ms = new MemoryStream();

        var tar = new TarOutputStream(ms, Encoding.UTF8)
        {
            IsStreamOwner = false
        };

        try
        {
            // Use normalizedContent instead of the raw content string
            var data = Encoding.UTF8.GetBytes(normalizedContent);

            var entry = TarEntry.CreateTarEntry(fileName);
            entry.Size = data.Length;

            tar.PutNextEntry(entry);
            await tar.WriteAsync(data, 0, data.Length, ct);
            tar.CloseEntry();

            tar.Close();
            ms.Position = 0;

            await _dockerClient.Containers.ExtractArchiveToContainerAsync(
                containerId,
                new ContainerPathStatParameters { Path = "/workspace" },
                ms,
                ct);
        }
        finally
        {
            ms.Dispose();
        }
    }

    private async Task<CompilationResult> ExecuteInContainer(
    string containerId,
    string language,
    string input,
    CancellationToken ct)
    {
        var execCreate = await _dockerClient.Exec.ExecCreateContainerAsync(
            containerId,
            new ContainerExecCreateParameters
            {
                AttachStdout = true,
                AttachStderr = true,
                AttachStdin = false, // 🌟 Changed to false: We are redirecting from input.txt file now!
                Tty = false,
                Cmd = new[] { "bash", "-c", BuildCommand(language) }
            },
            ct);

        // Open the one-way output stream socket channel safely
        var stream = await _dockerClient.Exec.StartAndAttachContainerExecAsync(
            execCreate.ID,
            false,
            ct);

        var stdout = new StringBuilder();
        var stderr = new StringBuilder();
        var buffer = new byte[4096];

        // 🌟 REMOVED: All the conditional if(input) stream.WriteAsync blocks are gone.
        // The container reads everything it needs straight out of its filesystem now.

        // Read execution outputs directly via the buffer loop
        while (true)
        {
            var result = await stream.ReadOutputAsync(buffer, 0, buffer.Length, ct);

            if (result.EOF)
                break;

            var text = Encoding.UTF8.GetString(buffer, 0, result.Count);

            if (result.Target == MultiplexedStream.TargetStream.StandardOut)
                stdout.Append(text);
            else
                stderr.Append(text);
        }

        // Inspect the specific EXEC session state rather than the global container state
        var execInspect = await _dockerClient.Exec.InspectContainerExecAsync(execCreate.ID, ct);

        return new CompilationResult
        {
            Success = execInspect.ExitCode == 0,
            ExitCode = (int)execInspect.ExitCode,
            Stdout = stdout.ToString(),
            Stderr = stderr.ToString()
        };
    }

    private async Task EnsureContainerRunning(
        string containerId,
        CancellationToken ct)
    {
        for (int i = 0; i < 20; i++)
        {
            var inspect = await _dockerClient.Containers.InspectContainerAsync(containerId, ct);

            if (inspect.State.Running)
                return;

            if (inspect.State.Status == "exited" || inspect.State.Status == "dead")
                throw new Exception($"Container died early: {inspect.State.Status}");

            await Task.Delay(100, ct);
        }

        throw new TimeoutException("Container did not reach running state");
    }

    //private async Task<CompilationResult> WaitForContainer(
    //    string containerId,
    //    CancellationToken ct)
    //{
    //    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
    //    timeout.CancelAfter(TimeSpan.FromSeconds(TimeoutSeconds));

    //    try
    //    {
    //        await _dockerClient.Containers.WaitContainerAsync(containerId, timeout.Token);
    //    }
    //    catch
    //    {
    //        await SafeKill(containerId);

    //        return new CompilationResult
    //        {
    //            Success = false,
    //            ExitCode = -1,
    //            Stderr = "Execution timeout"
    //        };
    //    }

    //    var inspect = await _dockerClient.Containers.InspectContainerAsync(containerId);

    //    var (stdout, stderr) = await ReadLogs(containerId);

    //    return new CompilationResult
    //    {
    //        Success = inspect.State.ExitCode == 0,
    //        ExitCode = inspect.State.ExitCode == 0 ? 0 : -1,
    //        Stdout = stdout,
    //        Stderr = stderr
    //    };
    //}

    //private async Task<(string stdout, string stderr)> ReadLogs(string containerId)
    //{
    //    var stream = await _dockerClient.Containers.GetContainerLogsAsync(
    //        containerId,
    //        false,
    //        new ContainerLogsParameters
    //        {
    //            ShowStdout = true,
    //            ShowStderr = true,
    //            Follow = false,
    //            Timestamps = false
    //        });

    //    using (stream)
    //    {
    //        var result = await stream.ReadOutputToEndAsync(CancellationToken.None);

    //        return (
    //            result.stdout ?? string.Empty,
    //            result.stderr ?? string.Empty
    //        );
    //    }
    //}

    private string GetImage(string language) => language switch
    {
        "cpp" => "cpp-runner",
        "python" => "python-runner",
        "java" => "java-runner",
        _ => throw new ArgumentException("Unsupported language")
    };

    private string GetSourceFileName(string language) => language switch
    {
        "cpp" => "main.cpp",
        "python" => "main.py",
        "java" => "Main.java",
        _ => throw new ArgumentException("Unsupported language")
    };


    //private async Task SafeKill(string containerId)
    //{
    //    try
    //    {
    //        await _dockerClient.Containers.KillContainerAsync(
    //            containerId,
    //            new ContainerKillParameters());
    //    }
    //    catch { }
    //}

    private async Task SafeRemoveContainer(string containerId)
    {
        try
        {
            await _dockerClient.Containers.RemoveContainerAsync(
                containerId,
                new ContainerRemoveParameters { Force = true });
        }
        catch { }
    }

    //private void Cleanup(string dir)
    //{
    //    try
    //    {
    //        if (Directory.Exists(dir))
    //            Directory.Delete(dir, true);
    //    }
    //    catch { }
    //}
}