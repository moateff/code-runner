using Compiler.Domain.Entities;

namespace Compiler.Application.Interfaces;

public interface IDockerRunnerService
{
    Task<CompilationResult> ExecuteAsync(string language, string code, string input, CancellationToken cancellationToken = default);
}
