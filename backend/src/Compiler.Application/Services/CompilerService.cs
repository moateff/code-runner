using Compiler.Application.DTOs;
using Compiler.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Compiler.Application.Services;

public class CompilerService : ICompilerService
{
    private readonly IDockerRunnerService _dockerRunnerService;
    private readonly ILogger<CompilerService> _logger;

    public CompilerService(IDockerRunnerService dockerRunnerService, ILogger<CompilerService> logger)
    {
        _dockerRunnerService = dockerRunnerService ?? throw new ArgumentNullException(nameof(dockerRunnerService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RunResponse> RunAsync(RunRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting code execution. Language: {Language}", request.Language);

        try
        {
            var result = await _dockerRunnerService.ExecuteAsync(request.Language, request.Code, request.Input, cancellationToken);

            var response = new RunResponse
            {
                Success = result.Success,
                Stdout = result.Stdout,
                Stderr = result.Stderr,
                ExitCode = result.ExitCode,
                ExecutionTimeMs = result.ExecutionTimeMs
            };

            _logger.LogInformation(
                "Code execution completed. Success: {Success}, ExitCode: {ExitCode}, ExecutionTime: {Time}ms",
                response.Success, response.ExitCode, response.ExecutionTimeMs);

            return response;
        }
        catch (OperationCanceledException ex)
        {
            _logger.LogWarning(ex, "Code execution was cancelled");
            return new RunResponse
            {
                Success = false,
                Message = "Execution timeout",
                Stderr = "Execution timeout (5 seconds)"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during code execution");
            return new RunResponse
            {
                Success = false,
                Message = "Internal server error",
                Stderr = "An unexpected error occurred during execution"
            };
        }
    }
}
