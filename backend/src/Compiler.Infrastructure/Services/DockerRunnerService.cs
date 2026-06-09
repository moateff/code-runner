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

        // check if an environment variable is explicitly set
        var dockerUri = Environment.GetEnvironmentVariable("DOCKER_HOST");

        if (string.IsNullOrEmpty(dockerUri))
        {
            dockerUri = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? "npipe://./pipe/docker_engine"       // default for local Windows development
                : "unix:///var/run/docker.sock";       // default for Linux / inside a Docker Container
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
            containerId = await CreateAndStartContainer(language, cancellationToken);

            // ensure container is actually running
            await EnsureContainerRunning(containerId, cancellationToken);

            // inject source code into container
            await CopyFileToContainer(
                containerId,
                GetSourceFileName(language),
                code,
                cancellationToken);

            // inject input if needed   
            string safeInput = !string.IsNullOrEmpty(input) ? input : "";

            if (!safeInput.EndsWith("\n"))
            {
                safeInput += "\n";
            }

            await CopyFileToContainer(
                containerId,
                "input.txt",
                safeInput,
                cancellationToken);
            
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

    // private string BuildCommand(string language)
    // {
    //     string inputRedirection = " [ -f /workspace/input.txt ] && < /workspace/input.txt || true";

    //     return language switch
    //     {
    //         "python" => $"python3 /workspace/main.py{inputRedirection}",
    //         "cpp" => $"g++ /workspace/main.cpp -o /workspace/a.out && /workspace/a.out{inputRedirection}",
    //         "java" => $"javac /workspace/Main.java && java -cp /workspace Main{inputRedirection}",
    //         _ => throw new ArgumentException("Unsupported language")
    //     };
    // }

    private string BuildCommand(string language)
    {
        // Check if the input file exists, and if so, redirect it into the runner command.
        // Otherwise, just run the command normally.
        return language switch
        {
            "python" => "if [ -f /workspace/input.txt ]; then python3 /workspace/main.py < /workspace/input.txt; else python3 /workspace/main.py; fi",
            "cpp"    => "g++ /workspace/main.cpp -o /workspace/a.out && if [ -f /workspace/input.txt ]; then /workspace/a.out < /workspace/input.txt; else /workspace/a.out; fi",
            "java"   => "javac /workspace/Main.java && if [ -f /workspace/input.txt ]; then java -cp /workspace Main < /workspace/input.txt; else java -cp /workspace Main; fi",
            _        => throw new ArgumentException("Unsupported language")
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
        var normalizedContent = content.Replace("\r\n", "\n");

        var ms = new MemoryStream();

        var tar = new TarOutputStream(ms, Encoding.UTF8)
        {
            IsStreamOwner = false
        };

        try
        {
            // use normalizedContent instead of the raw content string
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
                AttachStdin = false,
                Tty = false,
                Cmd = new[] { "bash", "-c", BuildCommand(language) }
            },
            ct);

        // open the one-way output stream socket channel safely
        var stream = await _dockerClient.Exec.StartAndAttachContainerExecAsync(
            execCreate.ID,
            false,
            ct);

        var stdout = new StringBuilder();
        var stderr = new StringBuilder();
        var buffer = new byte[4096];

        // read execution outputs directly via the buffer loop
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

        // inspect the specific EXEC session state rather than the global container state
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
}