using Fb4.Backend.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// Der zentrale Ausnahme-Handler übersetzt fachliche und Infrastruktur-Fehler in
/// das einheitliche RFC-9457-Format (API-N-040).
/// </summary>
public class FehlerbehandlungTests
{
    [Fact]
    public async Task ADMIN_F_200_Datenbank_Nebenlaeufigkeitskonflikt_wird_zu_412_stand_veraltet()
    {
        var spion = new ProblemDetailsSpion();
        var handler = new ApiExceptionHandler(spion);
        var http = new DefaultHttpContext();

        var behandelt = await handler.TryHandleAsync(http, new DbUpdateConcurrencyException(), default);

        Assert.True(behandelt);
        Assert.Equal(StatusCodes.Status412PreconditionFailed, http.Response.StatusCode);
        Assert.Equal("stand_veraltet", spion.Zuletzt!.ProblemDetails.Extensions["code"]);
    }

    [Fact]
    public async Task API_N_040_ApiException_traegt_Status_und_Code_in_die_Problemantwort()
    {
        var spion = new ProblemDetailsSpion();
        var handler = new ApiExceptionHandler(spion);
        var http = new DefaultHttpContext();

        var behandelt = await handler.TryHandleAsync(
            http, ApiException.BadRequest("mensa_id_doppelt", "Kennung doppelt."), default);

        Assert.True(behandelt);
        Assert.Equal(StatusCodes.Status400BadRequest, http.Response.StatusCode);
        Assert.Equal("mensa_id_doppelt", spion.Zuletzt!.ProblemDetails.Extensions["code"]);
    }

    sealed class ProblemDetailsSpion : IProblemDetailsService
    {
        public ProblemDetailsContext? Zuletzt { get; private set; }

        public ValueTask WriteAsync(ProblemDetailsContext context)
        {
            Zuletzt = context;
            return ValueTask.CompletedTask;
        }

        public ValueTask<bool> TryWriteAsync(ProblemDetailsContext context)
        {
            Zuletzt = context;
            return ValueTask.FromResult(true);
        }
    }
}
