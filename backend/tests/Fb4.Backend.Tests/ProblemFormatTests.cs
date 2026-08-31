using Fb4.Backend.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Fb4.Backend.Tests;

public class ProblemFormatTests
{
    // API-N-040: Fehlerantworten in einem einheitlichen, maschinenlesbaren Format
    // mit Fehlercode und für Menschen lesbarer Meldung.
    [Fact]
    public void ApiN040_AddCode_ergaenzt_einen_maschinenlesbaren_Code_je_Status()
    {
        var problem = new ProblemDetails { Status = 404 };
        var http = new DefaultHttpContext();
        http.Response.StatusCode = 404;

        ProblemHandling.AddCode(problem, http);

        Assert.Equal("not_found", problem.Extensions["code"]);
        Assert.NotNull(problem.Type);
    }

    [Fact]
    public void ApiN040_AddCode_ueberschreibt_einen_vorhandenen_Code_nicht()
    {
        var problem = new ProblemDetails { Status = 409, Extensions = { ["code"] = "bereits_bewertet" } };

        ProblemHandling.AddCode(problem, new DefaultHttpContext());

        Assert.Equal("bereits_bewertet", problem.Extensions["code"]);
    }

    [Theory]
    [InlineData(400, "bad_request")]
    [InlineData(401, "unauthenticated")]
    [InlineData(403, "forbidden")]
    [InlineData(429, "rate_limited")]
    [InlineData(500, "internal_error")]
    [InlineData(503, "internal_error")]
    public void ApiN040_DefaultCodeForStatus_bildet_die_erwarteten_Codes(int status, string expected)
    {
        Assert.Equal(expected, ProblemHandling.DefaultCodeForStatus(status));
    }

    [Fact]
    public void ApiN040_ApiException_traegt_Status_Code_und_Meldung()
    {
        var ex = ApiException.Conflict("bereits_heute_bewertet", "Für dieses Gericht heute bereits bewertet.");

        Assert.Equal(409, ex.Status);
        Assert.Equal("bereits_heute_bewertet", ex.Code);
        Assert.Equal("Für dieses Gericht heute bereits bewertet.", ex.Message);
    }
}
