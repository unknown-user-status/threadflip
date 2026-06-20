package com.codex.smartwriter;

import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import okhttp3.*;
import java.util.concurrent.TimeUnit;

public class AiProvider {
    public interface Callback {
        void onSuccess(String content);
        void onError(String error);
    }

    public static class Config {
        public String provider, apiKey, model, baseUrl;

        Config(SharedPreferences prefs) {
            provider = prefs.getString("provider", "openai");
            apiKey = prefs.getString("api_key", "");
            model = prefs.getString("model", getDefaultModel(provider));
            baseUrl = prefs.getString("base_url", getDefaultBaseUrl(provider));
        }

        public static String getDefaultModel(String p) {
            switch (p) {
                case "openai": return "gpt-4o";
                case "openrouter": return "openai/gpt-4o";
                case "groq": return "llama-3.3-70b-versatile";
                case "deepseek": return "deepseek-chat";
                case "gemini": return "gemini-2.0-flash";
                case "claude": return "claude-sonnet-4-20250514";
                case "mistral": return "mistral-large-latest";
                case "xai": return "grok-2-latest";
                case "together": return "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";
                case "perplexity": return "sonar-pro";
                case "qwen": return "qwen-max";
                case "ollama": return "llama3";
                case "github": return "gpt-4o-mini";
                default: return "gpt-4o";
            }
        }

        public static String getDefaultBaseUrl(String p) {
            switch (p) {
                case "openai": return "https://api.openai.com/v1";
                case "openrouter": return "https://openrouter.ai/api/v1";
                case "groq": return "https://api.groq.com/openai/v1";
                case "deepseek": return "https://api.deepseek.com/v1";
                case "gemini": return "https://generativelanguage.googleapis.com/v1beta/openai";
                case "claude": return "https://api.anthropic.com/v1";
                case "mistral": return "https://api.mistral.ai/v1";
                case "xai": return "https://api.x.ai/v1";
                case "together": return "https://api.together.xyz/v1";
                case "perplexity": return "https://api.perplexity.ai";
                case "qwen": return "https://dashscope.aliyuncs.com/compatible-mode/v1";
                case "ollama": return "http://localhost:11434/v1";
                case "github": return "https://models.inference.ai.azure.com";
                default: return "https://api.openai.com/v1";
            }
        }

        public static String getProviderDisplayName(String p) {
            switch (p) {
                case "openai": return "OpenAI"; case "openrouter": return "OpenRouter";
                case "groq": return "Groq"; case "deepseek": return "DeepSeek";
                case "gemini": return "Google Gemini"; case "claude": return "Anthropic Claude";
                case "mistral": return "Mistral AI"; case "xai": return "xAI (Grok)";
                case "together": return "Together AI"; case "perplexity": return "Perplexity";
                case "qwen": return "Qwen"; case "ollama": return "Ollama";
                case "github": return "GitHub Models"; case "custom": return "Custom";
                default: return p;
            }
        }

        public static String getProviderApiKeyHint(String p) {
            if (p.equals("ollama")) return "Optional for local, required for cloud";
            if (p.equals("github")) return "Free! Get token at github.com/settings/tokens";
            if (p.equals("groq")) return "Free tier at console.groq.com";
            if (p.equals("gemini")) return "Free tier at aistudio.google.com";
            return "Required — your API key for this provider";
        }

        static boolean requiresApiKey(String p) { return !p.equals("ollama"); }
    }

    public static void generate(Config config, String prompt, Callback cb) {
        if (config.provider.equals("claude")) callClaude(config, prompt, cb);
        else callOpenAICompatible(config, prompt, cb);
    }

    private static void callOpenAICompatible(Config config, String prompt, Callback cb) {
        new Thread(() -> {
            try {
                OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(120, TimeUnit.SECONDS).readTimeout(180, TimeUnit.SECONDS).build();
                String url = config.baseUrl.replaceAll("/$", "") + "/chat/completions";
                JSONObject body = new JSONObject();
                body.put("model", config.model); body.put("max_tokens", 2048); body.put("temperature", 0.7);
                JSONArray msgs = new JSONArray();
                JSONObject sys = new JSONObject(); sys.put("role", "system");
                sys.put("content", "You are a professional content writing assistant. Generate high-quality, engaging, well-formatted content.");
                msgs.put(sys);
                JSONObject usr = new JSONObject(); usr.put("role", "user"); usr.put("content", prompt);
                msgs.put(usr); body.put("messages", msgs);
                Request.Builder rb = new Request.Builder().url(url)
                    .post(RequestBody.create(body.toString(), MediaType.parse("application/json")))
                    .addHeader("Content-Type", "application/json");
                if (config.apiKey != null && !config.apiKey.isEmpty()) {
                    rb.addHeader("Authorization", config.apiKey.startsWith("Bearer ") ? config.apiKey : "Bearer " + config.apiKey);
                }
                if (config.provider.equals("openrouter")) {
                    rb.addHeader("HTTP-Referer", "https://smartwriter.app").addHeader("X-Title", "SmartWriter AI");
                }
                Response r = client.newCall(rb.build()).execute();
                String rbStr = r.body() != null ? r.body().string() : "";
                if (!r.isSuccessful()) { cb.onError(parseError(r.code(), rbStr)); return; }
                JSONObject json = new JSONObject(rbStr);
                String content;
                if (json.has("choices") && json.getJSONArray("choices").length() > 0) {
                    JSONObject ch = json.getJSONArray("choices").getJSONObject(0);
                    content = ch.has("message") ? ch.getJSONObject("message").getString("content") : ch.optString("text", ch.toString());
                } else { content = json.optString("content", "Unexpected response format"); }
                cb.onSuccess(content.trim());
            } catch (Exception e) {
                String m = e.getMessage();
                if (m == null) m = "Unknown error";
                else if (m.contains("connect") || m.contains("resolve")) m = "Cannot connect — check URL or internet";
                else if (m.contains("timeout")) m = "Request timed out";
                cb.onError(m);
            }
        }).start();
    }

    private static void callClaude(Config config, String prompt, Callback cb) {
        new Thread(() -> {
            try {
                OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(120, TimeUnit.SECONDS).readTimeout(180, TimeUnit.SECONDS).build();
                String url = config.baseUrl.replaceAll("/$", "") + "/messages";
                JSONObject body = new JSONObject();
                body.put("model", config.model); body.put("max_tokens", 2048);
                JSONArray msgs = new JSONArray();
                JSONObject msg = new JSONObject(); msg.put("role", "user"); msg.put("content", prompt);
                msgs.put(msg); body.put("messages", msgs);
                Request req = new Request.Builder().url(url)
                    .addHeader("x-api-key", config.apiKey).addHeader("anthropic-version", "2023-06-01")
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(body.toString(), MediaType.parse("application/json"))).build();
                Response r = client.newCall(req).execute();
                String rbStr = r.body() != null ? r.body().string() : "";
                if (!r.isSuccessful()) { cb.onError(parseError(r.code(), rbStr)); return; }
                JSONObject json = new JSONObject(rbStr);
                StringBuilder content = new StringBuilder();
                JSONArray ca = json.getJSONArray("content");
                for (int i = 0; i < ca.length(); i++) {
                    JSONObject block = ca.getJSONObject(i);
                    if ("text".equals(block.getString("type"))) content.append(block.getString("text"));
                }
                cb.onSuccess(content.toString().trim());
            } catch (Exception e) {
                String m = e.getMessage(); cb.onError(m != null ? m : "Unknown error");
            }
        }).start();
    }

    private static String parseError(int code, String body) {
        try {
            JSONObject err = new JSONObject(body);
            if (err.has("error")) {
                Object eo = err.get("error");
                if (eo instanceof JSONObject) return ((JSONObject)eo).optString("message", "HTTP " + code);
                return eo.toString();
            }
        } catch (Exception ignored) {
            if (body.contains("<html") || body.contains("<!DOCTYPE")) return "Server returned HTML — check Base URL";
            if (body.length() < 200 && !body.startsWith("{")) return body;
        }
        return "HTTP " + code;
    }
}
