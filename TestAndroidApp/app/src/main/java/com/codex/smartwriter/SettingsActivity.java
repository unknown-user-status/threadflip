package com.codex.smartwriter;

import android.content.SharedPreferences; import android.os.Bundle; import android.view.View;
import android.widget.*; import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton; import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputEditText; import com.google.android.material.textfield.TextInputLayout;

public class SettingsActivity extends AppCompatActivity {
    private Spinner providerSpinner;
    private TextInputEditText apiKeyInput, modelInput, baseUrlInput;
    private TextInputLayout apiKeyLayout;
    private MaterialButton saveBtn, testBtn;
    private TextView modelHint, baseUrlHint, apiKeyHint;
    private SharedPreferences prefs;
    private final String[][] providers = {
        {"openai","OpenAI (GPT-4o, o3)"},{"deepseek","DeepSeek (V3, R1)"},{"gemini","Google Gemini (2.0 Flash/Pro)"},
        {"claude","Anthropic Claude (Sonnet 4)"},{"groq","Groq (Fast Inference)"},{"mistral","Mistral AI (Large)"},
        {"xai","xAI Grok (Grok-2)"},{"openrouter","OpenRouter (200+ Models)"},{"together","Together AI (Open Models)"},
        {"perplexity","Perplexity (Sonar)"},{"qwen","Qwen (Alibaba)"},{"ollama","Ollama (Local/Cloud)"},
        {"github","GitHub Models (Free Tier)"},{"custom","Custom (Any API)"}
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);
        prefs = getSharedPreferences("smartwriter_prefs", MODE_PRIVATE);
        providerSpinner = findViewById(R.id.providerSpinner); apiKeyInput = findViewById(R.id.apiKeyInput);
        modelInput = findViewById(R.id.modelInput); baseUrlInput = findViewById(R.id.baseUrlInput);
        apiKeyLayout = findViewById(R.id.apiKeyLayout); saveBtn = findViewById(R.id.saveBtn);
        testBtn = findViewById(R.id.testBtn); modelHint = findViewById(R.id.modelHint);
        baseUrlHint = findViewById(R.id.baseUrlHint); apiKeyHint = findViewById(R.id.apiKeyHint);
        String[] names = new String[providers.length];
        for (int i = 0; i < providers.length; i++) names[i] = providers[i][1];
        providerSpinner.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, names));
        String saved = prefs.getString("provider", "openai");
        for (int i = 0; i < providers.length; i++) { if (providers[i][0].equals(saved)) { providerSpinner.setSelection(i); break; } }
        loadSettings();
        providerSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> p, View v, int pos, long id) { onProviderChanged(providers[pos][0]); }
            @Override public void onNothingSelected(AdapterView<?> p) {}
        });
        saveBtn.setOnClickListener(v -> saveSettings());
        testBtn.setOnClickListener(v -> testConnection());
        findViewById(R.id.backBtn).setOnClickListener(v -> finish());
    }

    private void loadSettings() {
        String p = prefs.getString("provider", "openai");
        apiKeyInput.setText(prefs.getString("api_key", ""));
        modelInput.setText(prefs.getString("model", AiProvider.Config.getDefaultModel(p)));
        baseUrlInput.setText(prefs.getString("base_url", AiProvider.Config.getDefaultBaseUrl(p)));
        onProviderChanged(p);
    }

    private void onProviderChanged(String p) {
        modelHint.setText("Latest: " + AiProvider.Config.getDefaultModel(p));
        baseUrlHint.setText("Default: " + AiProvider.Config.getDefaultBaseUrl(p));
        String cm = modelInput.getText().toString().trim(), cu = baseUrlInput.getText().toString().trim();
        String op = getCurrentProvider();
        if (cm.isEmpty() || cm.equals(AiProvider.Config.getDefaultModel(op))) modelInput.setText(AiProvider.Config.getDefaultModel(p));
        if (cu.isEmpty() || cu.equals(AiProvider.Config.getDefaultBaseUrl(op))) baseUrlInput.setText(AiProvider.Config.getDefaultBaseUrl(p));
        apiKeyHint.setText(AiProvider.Config.getProviderApiKeyHint(p));
        apiKeyLayout.setHint(p.equals("ollama") ? "API Key (optional)" : "API Key");
        baseUrlInput.setEnabled(p.equals("custom") || p.equals("ollama"));
    }

    private String getCurrentProvider() {
        int pos = providerSpinner.getSelectedItemPosition();
        return (pos >= 0 && pos < providers.length) ? providers[pos][0] : "openai";
    }

    private void saveSettings() {
        int pos = providerSpinner.getSelectedItemPosition();
        String p = providers[pos][0], key = apiKeyInput.getText().toString().trim();
        String m = modelInput.getText().toString().trim(), url = baseUrlInput.getText().toString().trim();
        if (!p.equals("ollama") && key.isEmpty()) {
            Snackbar.make(findViewById(android.R.id.content), "API key required", Snackbar.LENGTH_LONG).show(); return;
        }
        if (m.isEmpty()) m = AiProvider.Config.getDefaultModel(p);
        if (url.isEmpty()) url = AiProvider.Config.getDefaultBaseUrl(p);
        prefs.edit().putString("provider", p).putString("api_key", key).putString("model", m).putString("base_url", url).apply();
        Snackbar.make(findViewById(android.R.id.content), "Saved: " + AiProvider.Config.getProviderDisplayName(p), Snackbar.LENGTH_SHORT).show();
    }

    private void testConnection() {
        saveSettings();
        AiProvider.Config config = new AiProvider.Config(prefs);
        if (config.apiKey.isEmpty() && !config.provider.equals("ollama")) {
            Snackbar.make(findViewById(android.R.id.content), "Enter API key first", Snackbar.LENGTH_LONG).show(); return;
        }
        testBtn.setEnabled(false); testBtn.setText("Testing...");
        AiProvider.generate(config, "Reply with: OK from [model name]", new AiProvider.Callback() {
            @Override public void onSuccess(String c) { runOnUiThread(() -> {
                testBtn.setEnabled(true); testBtn.setText("Test Connection");
                Snackbar.make(findViewById(android.R.id.content), "Connected! " + (c.length()>80 ? c.substring(0,80)+"..." : c), Snackbar.LENGTH_LONG).show();
            });}
            @Override public void onError(String e) { runOnUiThread(() -> {
                testBtn.setEnabled(true); testBtn.setText("Test Connection");
                Snackbar.make(findViewById(android.R.id.content), "Failed: " + e, Snackbar.LENGTH_LONG).show();
            });}
        });
    }
}
