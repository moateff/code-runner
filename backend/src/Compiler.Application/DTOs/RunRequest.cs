namespace Compiler.Application.DTOs;

public class RunRequest
{
    public string Language { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Input { get; set; } = string.Empty;
}
