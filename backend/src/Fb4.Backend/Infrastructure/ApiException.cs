namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Fachlicher Fehler, der als einheitliche Fehlerantwort nach RFC 9457
/// ausgeliefert wird (API-N-040). <see cref="Code"/> ist der maschinenlesbare
/// Fehlercode, die Message die für Menschen lesbare Meldung.
/// </summary>
public sealed class ApiException(int status, string code, string title, string? detail = null)
    : Exception(title)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
    public string? Detail { get; } = detail;

    public static ApiException BadRequest(string code, string title) => new(400, code, title);
    public static ApiException NotFound(string code, string title) => new(404, code, title);
    public static ApiException Conflict(string code, string title) => new(409, code, title);
    public static ApiException PreconditionFailed(string code, string title) => new(412, code, title);
    public static ApiException TooManyRequests(string code, string title) => new(429, code, title);
}
