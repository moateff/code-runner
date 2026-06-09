using Compiler.Application.DTOs;

namespace Compiler.Application.Interfaces;

public interface ICompilerService
{
    Task<RunResponse> RunAsync(RunRequest request, CancellationToken cancellationToken = default);
}
