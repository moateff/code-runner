using Docker.DotNet;
using Docker.DotNet.Models;
using Compiler.Application.Interfaces;
using Compiler.Domain.Entities;
using System.Diagnostics;
using System.Text;
using Microsoft.Extensions.Logging;
using ICSharpCode.SharpZipLib.Tar;

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

        var dockerUri =
            Environment.GetEnvironmentVariable("DOCKER_HOST")
            ?? "unix:///var/run/docker.sock";

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
            if (!string.IsNullOrWhiteSpace(input))
            {
                await CopyFileToContainer(
                    containerId,
                    "input.txt",
                    input,
                    cancellationToken);
            }

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

    private string BuildCommand(string language) => language switch
    {
        "python" => "python3 /workspace/main.py",
        "cpp" => "g++ /workspace/main.cpp -o /workspace/a.out && /workspace/a.out",
        "java" => "javac /workspace/Main.java && java -cp /workspace Main",
        _ => throw new ArgumentException("Unsupported language")
    };

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
        var ms = new MemoryStream();

        var tar = new TarOutputStream(ms, Encoding.UTF8)
        {
            IsStreamOwner = false 
        };

        try
        {
            var data = Encoding.UTF8.GetBytes(content);

            var entry = TarEntry.CreateTarEntry(fileName);
            entry.Size = data.Length;

            tar.PutNextEntry(entry);
            await tar.WriteAsync(data, 0, data.Length, ct);
            tar.CloseEntry();

            tar.Close();

            ms.Position = 0;

            await _dockerClient.Containers.ExtractArchiveToContainerAsync(
                containerId,
                new ContainerPathStatParameters
                {
                    Path = "/workspace"
                },
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
                AttachStdin = true,
                Tty = false,

                Cmd = new[] { "bash", "-c", BuildCommand(language) } // ✔ FIX
            },
            ct);

        var stream = await _dockerClient.Exec.StartAndAttachContainerExecAsync(
            execCreate.ID,
            false,
            ct);

        var stdout = new StringBuilder();
        var stderr = new StringBuilder();

        var buffer = new byte[4096];

        // write input FIRST (DO NOT close yet)
        if (!string.IsNullOrEmpty(input))
        {
            var inputBytes = Encoding.UTF8.GetBytes(input + "\n");

            await stream.WriteAsync(inputBytes, 0, inputBytes.Length, ct);
        }

        // close stdin after writing
        stream.CloseWrite();

        // read output
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

        var inspect = await _dockerClient.Containers.InspectContainerAsync(containerId, ct);

        return new CompilationResult
        {
            Success = inspect.State.ExitCode == 0,
            ExitCode = inspect.State.ExitCode == 0 ? 0 : 1,
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

    private async Task<CompilationResult> WaitForContainer(
        string containerId,
        CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(TimeoutSeconds));

        try
        {
            await _dockerClient.Containers.WaitContainerAsync(containerId, timeout.Token);
        }
        catch
        {
            await SafeKill(containerId);

            return new CompilationResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = "Execution timeout"
            };
        }

        var inspect = await _dockerClient.Containers.InspectContainerAsync(containerId);

        var (stdout, stderr) = await ReadLogs(containerId);

        return new CompilationResult
        {
            Success = inspect.State.ExitCode == 0,
            ExitCode = inspect.State.ExitCode == 0 ? 0 : -1,
            Stdout = stdout,
            Stderr = stderr
        };
    }

    private async Task<(string stdout, string stderr)> ReadLogs(string containerId)
    {
        var stream = await _dockerClient.Containers.GetContainerLogsAsync(
            containerId,
            false,
            new ContainerLogsParameters
            {
                ShowStdout = true,
                ShowStderr = true,
                Follow = false,
                Timestamps = false
            });

        using (stream)
        {
            var result = await stream.ReadOutputToEndAsync(CancellationToken.None);

            return (
                result.stdout ?? string.Empty,
                result.stderr ?? string.Empty
            );
        }
    }

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


    private async Task SafeKill(string containerId)
    {
        try
        {
            await _dockerClient.Containers.KillContainerAsync(
                containerId,
                new ContainerKillParameters());
        }
        catch { }
    }

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

    private void Cleanup(string dir)
    {
        try
        {
            if (Directory.Exists(dir))
                Directory.Delete(dir, true);
        }
        catch { }
    }
}