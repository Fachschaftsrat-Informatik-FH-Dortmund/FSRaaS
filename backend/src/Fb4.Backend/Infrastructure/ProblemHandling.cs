using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Sorgt dafür, dass jede Fehlerantwort dem einheitlichen Format aus
/// api-contract.yaml (Schema <c>Fehler</c>, RFC 9457) entspricht und einen
/// maschinenlesbaren <c>code</c> trägt (API-N-040).
/// </summary>
public static class ProblemHandling
{
    /// <summary>Fügt jeder ProblemDetails-Antwort einen <c>code</c> hinzu, falls keiner gesetzt ist.</summary>
    public static void AddCode(ProblemDetails problem, HttpContext http)
    {
        if (!problem.Extensions.ContainsKey("code"))
        {
            problem.Extensions["code"] = DefaultCodeForStatus(problem.Status ?? http.Response.StatusCode);
        }
        problem.Type ??= $"https://api.fsrfb4.de/problems/{problem.Extensions["code"]}";
    }

    public static string DefaultCodeForStatus(int status) => status switch
    {
        400 => "bad_request",
        401 => "unauthenticated",
        403 => "forbidden",
        404 => "not_found",
        409 => "conflict",
        412 => "precondition_failed",
        422 => "unprocessable",
        429 => "rate_limited",
        >= 500 => "internal_error",
        _ => "error",
    };
}

/// <summary>Wandelt eine <see cref="ApiException"/> in eine RFC-9457-Antwort.</summary>
public sealed class ApiExceptionHandler(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext http, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not ApiException api) return false;

        http.Response.StatusCode = api.Status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = http,
            Exception = api,
            ProblemDetails = new ProblemDetails
            {
                Status = api.Status,
                Title = api.Message,
                Detail = api.Detail,
                Extensions = { ["code"] = api.Code },
            },
        });
    }
}
