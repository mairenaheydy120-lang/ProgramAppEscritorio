using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Xml.Linq;

namespace AgroStock.Services;

/// <summary>Respuesta JSON del servicio REST (solo los campos que usamos).</summary>
public class RespuestaTipoCambio
{
    [JsonPropertyName("result")] public string Resultado { get; set; } = "";
    [JsonPropertyName("time_last_update_utc")] public string Actualizado { get; set; } = "";
    [JsonPropertyName("base_code")] public string Base { get; set; } = "";
    [JsonPropertyName("rates")] public Dictionary<string, decimal> Tasas { get; set; } = new();
}

/// <summary>Consumo de un servicio web RESTful con HttpClient + System.Text.Json.</summary>
public class TipoCambioService
{
    // Un solo HttpClient para toda la aplicación (evita agotar sockets)
    private static readonly HttpClient http = new() { Timeout = TimeSpan.FromSeconds(10) };
    public const string Url = "https://open.er-api.com/v6/latest/USD";

    /// <summary>GET asíncrono. Si no hay Internet, usa el respaldo local.</summary>
    public async Task<(decimal Nio, string Fuente)> ObtenerNioPorUsdAsync(CancellationToken token = default)
    {
        try
        {
            using var resp = await http.GetAsync(Url, token);
            resp.EnsureSuccessStatusCode();                        // lanza excepción si no es 2xx
            var datos = await resp.Content.ReadFromJsonAsync<RespuestaTipoCambio>(cancellationToken: token)
                        ?? throw new InvalidDataException("Respuesta vacía.");
            if (datos.Resultado != "success" || !datos.Tasas.TryGetValue("NIO", out var nio))
                throw new InvalidDataException("El servicio no devolvió la tasa NIO.");
            return (nio, $"open.er-api.com · {datos.Actualizado}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidDataException or JsonException)
        {
            // Modo sin conexión: el curso se imparte en zonas con Internet intermitente
            string ruta = Path.Combine(AppContext.BaseDirectory, "tipo_cambio_offline.json");
            var local = JsonSerializer.Deserialize<RespuestaTipoCambio>(File.ReadAllText(ruta))!;
            return (local.Tasas["NIO"], $"respaldo local ({ex.GetType().Name})");
        }
    }

    /// <summary>Ejemplo de parseo XML (muchos servicios SOAP/antiguos responden XML).</summary>
    public static decimal LeerTasaDesdeXml(string xml)
    {
        // <tasas base="USD"><tasa moneda="NIO">36.62</tasa></tasas>
        var doc = XDocument.Parse(xml);
        var nodo = doc.Root!.Elements("tasa").First(e => (string?)e.Attribute("moneda") == "NIO");
        return decimal.Parse(nodo.Value, System.Globalization.CultureInfo.InvariantCulture);
    }
}
