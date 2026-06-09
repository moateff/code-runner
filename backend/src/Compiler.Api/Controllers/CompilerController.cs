using Microsoft.AspNetCore.Mvc;
using Compiler.Application.DTOs;
using Compiler.Application.Interfaces;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace Compiler.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompilerController : ControllerBase
{
    private readonly ICompilerService _compilerService;
    private readonly IValidator<RunRequest> _validator;
    private readonly ILogger<CompilerController> _logger;

    public CompilerController(
        ICompilerService compilerService,
        IValidator<RunRequest> validator,
        ILogger<CompilerController> logger)
    {
        _compilerService = compilerService ?? throw new ArgumentNullException(nameof(compilerService));
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Compile and run code
    /// </summary>
    /// <param name="request">Code execution request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Compilation and execution result</returns>
    [HttpPost("run")]
    [ProducesResponseType(typeof(RunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Run([FromBody] RunRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received code execution request for language: {Language}", request.Language);

        // Validate request
        var validationResult = await _validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            _logger.LogWarning("Request validation failed");
            var errors = validationResult.Errors.Select(x => x.ErrorMessage).ToList();
            return BadRequest(new { errors });
        }

        try
        {
            var response = await _compilerService.RunAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Request was cancelled");
            return BadRequest(new RunResponse
            {
                Success = false,
                Message = "Request timeout",
                Stderr = "The request was cancelled due to timeout"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in compiler controller");
            return StatusCode(StatusCodes.Status500InternalServerError, new RunResponse
            {
                Success = false,
                Message = "Internal server error",
                Stderr = "An unexpected error occurred"
            });
        }
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
}
