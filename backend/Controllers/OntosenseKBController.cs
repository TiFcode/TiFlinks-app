using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Linq;
using Microsoft.Extensions.Logging;
using System.Text;

namespace TiFlinks.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OntosenseKBController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<OntosenseKBController> _logger;
        private const string OLLAMA_BASE_URL = "http://localhost:11434";

        public OntosenseKBController(IHttpClientFactory httpClientFactory, ILogger<OntosenseKBController> logger)
        {
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
        }

        [HttpGet("meanings")]
        public async Task<IActionResult> GetMeanings([FromQuery] string word)
        {
            _logger.LogInformation($"[OntosenseKB] Received meanings request for word: {word}");
            // 1. Call Ollama API for meanings (POST /api/generate)
            string? ollamaResponse = null;
            List<string> meanings = new List<string>();
            try {
                var ollamaRequest = new
                {
                    model = Environment.GetEnvironmentVariable("OLLAMA_DEFAULT_MODEL") ?? "tif-custom-llama:latest",
                    prompt = $"List the 3 most probable dictionary meanings of the word '{word}' in Romanian. For each, provide a short, human-readable definition (not just the word itself). Respond ONLY as a JSON array of objects, each with a 'meaning' property, for example: [{{\"meaning\": \"a sweet, crystalline substance obtained from various plants, especially sugar cane and sugar beet, used as a sweetener\"}}, {{\"meaning\": \"a term for endearment, used to refer to a loved one\"}}, {{\"meaning\": \"in chemistry, a generic term for a class of soluble, crystalline carbohydrates\"}}]. Do not include any markdown, code blocks, or explanations—just the JSON array.",
                    stream = false
                };
                _logger.LogInformation($"[OntosenseKB] Sending prompt to Ollama: {JsonConvert.SerializeObject(ollamaRequest)}");
                var content = new StringContent(JsonConvert.SerializeObject(ollamaRequest), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{OLLAMA_BASE_URL}/api/generate", content);
                response.EnsureSuccessStatusCode();
                ollamaResponse = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"[OntosenseKB] Ollama API raw response: {ollamaResponse}");
                // Parse the response field (should contain a JSON array)
                dynamic? ollamaResult = JsonConvert.DeserializeObject(ollamaResponse);
                if (ollamaResult?.response == null)
                {
                    return StatusCode(500, "Invalid response from Ollama API");
                }
                string text = ollamaResult.response;
                // Remove code block markers or markdown if present
                text = text.Trim();
                if (text.StartsWith("```"))
                {
                    int firstNewline = text.IndexOf('\n');
                    if (firstNewline != -1)
                    {
                        text = text.Substring(firstNewline + 1);
                    }
                    if (text.EndsWith("```"))
                    {
                        text = text.Substring(0, text.Length - 3);
                    }
                    text = text.Trim();
                }
                try {
                    // Try to parse as JSON array of objects
                    var jsonMeanings = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(text);
                    if (jsonMeanings != null && jsonMeanings.Count > 0) {
                        meanings = jsonMeanings.Select(m => m.ContainsKey("meaning") ? m["meaning"] : null)
                            .Where(m => !string.IsNullOrWhiteSpace(m))
                            .Take(3)
                            .ToList();
                    } else {
                        throw new Exception("Empty or invalid array");
                    }
                } catch (Exception ex1) {
                    _logger.LogWarning($"[OntosenseKB] First JSON parse failed: {ex1.Message}");
                    // Try to parse as a stringified JSON array
                    try {
                        var unescaped = JsonConvert.DeserializeObject<string>(text);
                        var jsonMeanings = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(unescaped);
                        meanings = jsonMeanings?.Select(m => m.ContainsKey("meaning") ? m["meaning"] : null)
                            .Where(m => !string.IsNullOrWhiteSpace(m))
                            .Take(3)
                            .ToList() ?? new List<string>();
                    } catch (Exception ex2) {
                        _logger.LogWarning($"[OntosenseKB] Second JSON parse (stringified) failed: {ex2.Message}");
                        // fallback: try to split by lines if not valid JSON
                        meanings = text.Split('\n')
                            .Select(line => line.Trim())
                            .Where(line => !string.IsNullOrWhiteSpace(line))
                            .Take(3)
                            .ToList();
                    }
                }
            } catch (Exception ex) {
                _logger.LogError(ex, $"[OntosenseKB] Error calling Ollama API for word: {word}");
                return StatusCode(500, "Error calling Ollama API");
            }

            var results = new List<object>();

            foreach (var meaning in meanings)
            {
                try {
                    // 2. Call Wikipedia API for each meaning
                    var wikiSearch = await _httpClient.GetStringAsync($"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={System.Net.WebUtility.UrlEncode(meaning)}&format=json");
                    _logger.LogInformation($"[OntosenseKB] Wikipedia API response for meaning '{meaning}': {wikiSearch}");
                    dynamic? wikiResult = JsonConvert.DeserializeObject(wikiSearch);
                    if (wikiResult?.query?.search == null || !wikiResult.query.search.HasValues)
                    {
                        throw new Exception("No Wikipedia results found");
                    }
                    var first = wikiResult.query.search[0]!;
                    string title = first.title?.ToString() ?? "Unknown";
                    string snippet = first.snippet?.ToString() ?? "No description available";
                    string link = $"https://en.wikipedia.org/wiki/{System.Net.WebUtility.UrlEncode(title.Replace(' ', '_'))}";

                    results.Add(new
                    {
                        meaning,
                        wikipedia = new
                        {
                            title,
                            link,
                            short_desc = snippet
                        }
                    });
                } catch (Exception ex) {
                    _logger.LogError(ex, $"[OntosenseKB] Error calling Wikipedia API for meaning: {meaning}");
                    results.Add(new
                    {
                        meaning,
                        wikipedia = new
                        {
                            title = "Error",
                            link = "",
                            short_desc = "Wikipedia lookup failed."
                        }
                    });
                }
            }

            _logger.LogInformation($"[OntosenseKB] Final meanings result: {JsonConvert.SerializeObject(results)}");
            return Ok(results);
        }
    }
} 