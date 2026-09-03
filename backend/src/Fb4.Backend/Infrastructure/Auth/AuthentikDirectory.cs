using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Infrastructure;
using Microsoft.Extensions.Options;

namespace Fb4.Backend.Infrastructure.Auth;

/// <summary>
/// Zugriff auf die Rollenzuweisungen im Identitätsanbieter (INT-012). Führendes
/// System ist Authentik; das Backend liest und schreibt dort, hält aber keine
/// eigene Rollentabelle (API-F-250, ADMIN-F-070).
/// </summary>
public interface IAuthentikDirectory
{
    Task<IReadOnlyList<Rollenzuweisung>> ListeRollenzuweisungenAsync(CancellationToken ct);

    /// <summary>
    /// Löst eine vom Menschen eingegebene Kennung (Benutzername) zur stabilen
    /// Authentik-Konto-Id auf (ADMIN-F-070). Eine bereits numerische Kennung wird
    /// unverändert zurückgegeben.
    /// </summary>
    Task<string> KontoIdAufloesenAsync(string kennung, CancellationToken ct);

    /// <summary>Setzt die Gruppenmitgliedschaft. <paramref name="kontoId"/> ist eine aufgelöste Authentik-Id.</summary>
    Task SetzeRollenAsync(string kontoId, IReadOnlyList<Rolle> rollen, CancellationToken ct);
}

/// <summary>
/// Ersatz, solange keine Authentik-Verwaltungs-API konfiguriert ist
/// (<see cref="AuthentikOptions.ManagementApiKonfiguriert"/>). Meldet den Zustand
/// ausdrücklich als „nicht verfügbar" (503), statt still zu scheitern (SEC-F-060,
/// ADMIN Abschnitt 9 „Rollenänderung schlägt fehl").
/// </summary>
public sealed class NichtKonfigurierteAuthentikDirectory : IAuthentikDirectory
{
    public Task<IReadOnlyList<Rollenzuweisung>> ListeRollenzuweisungenAsync(CancellationToken ct) => throw NichtVerfuegbar();
    public Task<string> KontoIdAufloesenAsync(string kennung, CancellationToken ct) => throw NichtVerfuegbar();
    public Task SetzeRollenAsync(string kontoId, IReadOnlyList<Rolle> rollen, CancellationToken ct) => throw NichtVerfuegbar();

    static ApiException NichtVerfuegbar() => new(
        503, "authentik_nicht_verfuegbar",
        "Die Rollenverwaltung ist nicht verfügbar: keine Authentik-Verwaltungs-API konfiguriert.");
}

/// <summary>
/// HTTP-Anbindung an die Authentik-Verwaltungs-API (INT-012). Die verwendeten
/// Endpunkt- und Feldnamen stehen ausschließlich im Schnittstellenregister
/// (<c>platform/integrations.md</c> INT-012, Abschnitt „Verwaltungs-API"), nicht
/// hier. Live-Verifikation des Schreibpfads steht aus, solange keine Instanz mit
/// Schreibtoken bereitsteht (Prüfprotokoll 2026-09-02).
/// </summary>
public sealed class AuthentikDirectory(HttpClient http, IOptions<AuthentikOptions> options) : IAuthentikDirectory
{
    readonly AuthentikOptions _o = options.Value;

    public async Task<IReadOnlyList<Rollenzuweisung>> ListeRollenzuweisungenAsync(CancellationToken ct)
    {
        Vorbereiten();
        var redaktion = await MitgliederAsync(_o.RedaktionGruppe, ct);
        var moderation = await MitgliederAsync(_o.ModerationGruppe, ct);

        var alle = redaktion.Keys.Union(moderation.Keys);
        return alle.Select(id =>
        {
            var rollen = new List<Rolle>();
            if (redaktion.ContainsKey(id)) rollen.Add(Rolle.FsrRedaktion);
            if (moderation.ContainsKey(id)) rollen.Add(Rolle.Moderation);
            var name = redaktion.GetValueOrDefault(id) ?? moderation.GetValueOrDefault(id);
            return new Rollenzuweisung { KontoId = id, Anzeigename = name, Rollen = rollen };
        }).ToList();
    }

    public async Task<string> KontoIdAufloesenAsync(string kennung, CancellationToken ct)
    {
        kennung = kennung.Trim();
        if (string.IsNullOrEmpty(kennung))
            throw ApiException.BadRequest("konto_kennung_leer", "Es wurde keine Konto-Kennung angegeben.");

        // Authentik-Konto-pk ist eine Ganzzahl (INT-012). Ist die Kennung schon
        // numerisch, gilt sie direkt — sonst als Benutzername auflösen.
        if (long.TryParse(kennung, NumberStyles.None, CultureInfo.InvariantCulture, out _))
            return kennung;

        Vorbereiten();
        var resp = await http.GetFromJsonAsync<ListeDto<BenutzerDto>>(
            $"core/users/?username={Uri.EscapeDataString(kennung)}", ct) ?? throw Strukturbruch("Benutzerliste ohne Rumpf");
        var treffer = resp.Results.FirstOrDefault(u => string.Equals(u.Username, kennung, StringComparison.OrdinalIgnoreCase))
            ?? throw new ApiException(404, "konto_unbekannt", $"Kein Authentik-Konto mit dem Benutzernamen „{kennung}“.");
        return treffer.Pk.ToString(CultureInfo.InvariantCulture);
    }

    public async Task SetzeRollenAsync(string kontoId, IReadOnlyList<Rolle> rollen, CancellationToken ct)
    {
        Vorbereiten();
        await SetzeMitgliedschaftAsync(_o.RedaktionGruppe, kontoId, rollen.Contains(Rolle.FsrRedaktion), ct);
        await SetzeMitgliedschaftAsync(_o.ModerationGruppe, kontoId, rollen.Contains(Rolle.Moderation), ct);
    }

    void Vorbereiten()
    {
        http.BaseAddress ??= new Uri(_o.ManagementApiBaseUrl!);
        http.DefaultRequestHeaders.Authorization ??= new AuthenticationHeaderValue("Bearer", _o.ManagementApiToken);
        // Eine Instanz kann hinter einem Reverse Proxy / CDN mit Bot-Filter liegen,
        // der Anfragen ohne User-Agent abweist. Einen eindeutigen setzen.
        if (http.DefaultRequestHeaders.UserAgent.Count == 0)
            http.DefaultRequestHeaders.UserAgent.ParseAdd("fb4-backend");
    }

    async Task<Dictionary<string, string?>> MitgliederAsync(string gruppe, CancellationToken ct)
    {
        var gruppenId = await GruppenIdAsync(gruppe, ct);
        var resp = await http.GetFromJsonAsync<GruppeDto>($"core/groups/{gruppenId}/", ct)
            ?? throw Strukturbruch("Gruppe ohne Rumpf");
        return (resp.UsersObj ?? []).ToDictionary(
            u => u.Pk.ToString(CultureInfo.InvariantCulture),
            u => (string?)(u.Name ?? u.Username));
    }

    async Task<string> GruppenIdAsync(string gruppe, CancellationToken ct)
    {
        var resp = await http.GetFromJsonAsync<ListeDto<GruppeDto>>(
            $"core/groups/?name={Uri.EscapeDataString(gruppe)}", ct) ?? throw Strukturbruch("Gruppenliste ohne Rumpf");
        var treffer = resp.Results.FirstOrDefault(g => g.Name == gruppe)
            ?? throw new ApiException(503, "authentik_gruppe_fehlt", $"Gruppe {gruppe} existiert in Authentik nicht.");
        return treffer.Pk;
    }

    async Task SetzeMitgliedschaftAsync(string gruppe, string kontoId, bool sollMitglied, CancellationToken ct)
    {
        var gruppenId = await GruppenIdAsync(gruppe, ct);
        var pfad = sollMitglied
            ? $"core/groups/{gruppenId}/add_user/"
            : $"core/groups/{gruppenId}/remove_user/";
        var antwort = await http.PostAsJsonAsync(pfad, new { pk = kontoId }, ct);
        if (!antwort.IsSuccessStatusCode)
            throw Strukturbruch($"{pfad} -> {(int)antwort.StatusCode}");
    }

    static ApiException Strukturbruch(string detail) => new(
        502, "authentik_strukturbruch",
        "Unerwartete Antwortstruktur der Authentik-Verwaltungs-API.", detail);

    // Nur die tatsächlich ausgewerteten Felder — Abweichung schlägt sichtbar fehl (QA-N-070).
    sealed record ListeDto<T>([property: JsonPropertyName("results")] IReadOnlyList<T> Results);
    sealed record GruppeDto(
        [property: JsonPropertyName("pk")] string Pk,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("users_obj")] IReadOnlyList<BenutzerDto>? UsersObj);
    sealed record BenutzerDto(
        [property: JsonPropertyName("pk")] long Pk,
        [property: JsonPropertyName("username")] string? Username,
        [property: JsonPropertyName("name")] string? Name);
}
