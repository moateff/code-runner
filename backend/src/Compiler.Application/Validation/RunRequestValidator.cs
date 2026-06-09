using FluentValidation;
using Compiler.Application.DTOs;

namespace Compiler.Application.Validation;

public class RunRequestValidator : AbstractValidator<RunRequest>
{
    public RunRequestValidator()
    {
        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Language is required")
            .Must(x => new[] { "cpp", "python", "java" }.Contains(x))
            .WithMessage("Language must be one of: cpp, python, java");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(10000).WithMessage("Code cannot exceed 10000 characters");

        RuleFor(x => x.Input)
            .MaximumLength(5000).WithMessage("Input cannot exceed 5000 characters");
    }
}
