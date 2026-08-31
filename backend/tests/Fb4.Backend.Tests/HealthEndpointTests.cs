using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// Rauchtests des Backend-Gerüsts (Roadmap Schritt 0 „Fundament": „Backend
/// antwortet"). Sie tragen bewusst keine Anforderungs-ID: der Betriebszustand
/// (API-N-090) und die Job-Statusausgabe (API-F-260) werden erst im Backend-
/// Schnitt vollständig umgesetzt und dann mit ID-tragenden Tests nachgewiesen.
/// Bis dahin sichern diese Tests nur ab, dass das Gerüst startet.
/// </summary>
public class HealthEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Gesundheitsendpunkt_antwortet_ohne_Datenbank_mit_200()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Gesundheitsendpunkt_nennt_Status_Version_und_Jobs()
    {
        var client = factory.CreateClient();

        var body = await client.GetFromJsonAsync<JsonElement>("/health");

        Assert.Equal("ok", body.GetProperty("status").GetString());
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("version").GetString()));
        Assert.Equal(JsonValueKind.Array, body.GetProperty("jobs").ValueKind);
    }
}
