namespace Compiler.Domain.Entities;

public class CompilationResult
{
    public bool Success { get; set; }
    public string Stdout { get; set; } = string.Empty;
    public string Stderr { get; set; } = string.Empty;
    public int ExitCode { get; set; }
    public long ExecutionTimeMs { get; set; }
}
