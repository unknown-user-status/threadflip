package com.codex.smartwriter;

import android.content.ClipData; import android.content.ClipboardManager; import android.content.Context;
import android.content.Intent; import android.content.SharedPreferences; import android.net.Uri;
import android.os.Bundle; import android.os.Handler; import android.os.Looper;
import android.view.View; import android.view.inputmethod.InputMethodManager;
import android.widget.*; 
import androidx.appcompat.app.AppCompatActivity; import androidx.appcompat.app.AppCompatDelegate;
import androidx.cardview.widget.CardView;
import com.google.android.material.button.MaterialButton; import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup; import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.progressindicator.LinearProgressIndicator;
import com.google.android.material.snackbar.Snackbar; import com.google.android.material.textfield.TextInputEditText;
import org.json.JSONArray; import org.json.JSONObject;
import java.text.SimpleDateFormat; import java.util.Arrays; import java.util.Date; import java.util.Locale;

public class MainActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "smartwriter_prefs";
    private static final String KEY_HISTORY = "generation_history";
    private static final String KEY_PRO_UNLOCKED = "pro_unlocked";
    private static final String KEY_GEN_DATE = "gen_date";
    private static final String KEY_GEN_COUNT = "gen_count";
    private static final String KEY_DONOR_EMAIL = "donor_email";
    private static final int DAILY_LIMIT_FREE = 3;
    private static final String STRIPE_DONATE_URL = "https://buy.stripe.com/test_8x29AVcfG53PfXG5zxeUU00";

    private ChipGroup contentTypeGroup;
    private TextInputEditText inputText;
    private MaterialButton generateBtn, settingsBtn;
    private LinearProgressIndicator progressBar;
    private CardView resultCard;
    private TextView resultTitle, resultText, providerIndicator, limitCounter;
    private Button copyBtn, shareBtn, viewFullBtn, supportBtn;
    private String lastResultType = "", lastResultInput = "", lastResultOutput = "";
    private String selectedType = "social";
    private SharedPreferences prefs;
    private Handler mainHandler = new Handler(Looper.getMainLooper());
    private final String[] typeLabels = {"Social Media Post", "Professional Email", "Product Description", "Hashtags", "Blog Ideas", "Video Caption"};
    private final String[] typeKeys = {"social", "email", "product", "hashtags", "blog", "caption"};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
        setContentView(R.layout.activity_main);
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        contentTypeGroup = findViewById(R.id.contentTypeGroup); inputText = findViewById(R.id.inputText);
        generateBtn = findViewById(R.id.generateBtn); settingsBtn = findViewById(R.id.settingsBtn);
        progressBar = findViewById(R.id.progressBar);
        resultCard = findViewById(R.id.resultCard); resultTitle = findViewById(R.id.resultTitle);
        resultText = findViewById(R.id.resultText); copyBtn = findViewById(R.id.copyBtn);
        shareBtn = findViewById(R.id.shareBtn); viewFullBtn = findViewById(R.id.viewFullBtn);
        providerIndicator = findViewById(R.id.providerIndicator);
        limitCounter = findViewById(R.id.limitCounter); supportBtn = findViewById(R.id.supportBtn);
        setupContentTypeChips(); setupButtons();
    }

    @Override
    protected void onResume() { super.onResume(); updateStatusBar(); }

    private void updateStatusBar() {
        String p = prefs.getString("provider", "openai");
        String m = prefs.getString("model", AiProvider.Config.getDefaultModel(p));
        providerIndicator.setText("Provider: " + AiProvider.Config.getProviderDisplayName(p) + " | Model: " + m);
        providerIndicator.setVisibility(View.VISIBLE);
        updateLimitCounter();
    }

    private void updateLimitCounter() {
        if (isPro()) {
            limitCounter.setText("⭐ Supporter — Unlimited generations");
            limitCounter.setTextColor(getColor(android.R.color.holo_purple));
            supportBtn.setVisibility(View.GONE);
        } else {
            int used = getDailyCount();
            int left = Math.max(0, DAILY_LIMIT_FREE - used);
            limitCounter.setText("Free: " + used + "/" + DAILY_LIMIT_FREE + " today — " + left + " left");
            limitCounter.setTextColor(getColor(android.R.color.darker_gray));
            supportBtn.setVisibility(View.VISIBLE);
        }
        limitCounter.setVisibility(View.VISIBLE);
    }

    private boolean isPro() { return prefs.getBoolean(KEY_PRO_UNLOCKED, false); }

    private int getDailyCount() {
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        String saved = prefs.getString(KEY_GEN_DATE, "");
        if (!saved.equals(today)) {
            prefs.edit().putString(KEY_GEN_DATE, today).putInt(KEY_GEN_COUNT, 0).apply();
            return 0;
        }
        return prefs.getInt(KEY_GEN_COUNT, 0);
    }

    private void incrementCount() {
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        prefs.edit().putString(KEY_GEN_DATE, today).putInt(KEY_GEN_COUNT, getDailyCount() + 1).apply();
        updateLimitCounter();
    }

    private void setupContentTypeChips() {
        for (int i = 0; i < typeKeys.length; i++) {
            Chip chip = new Chip(this); chip.setText(typeLabels[i]); chip.setCheckable(true);
            chip.setId(View.generateViewId()); if (i == 0) chip.setChecked(true);
            final int idx = i;
            chip.setOnCheckedChangeListener((btn, isChecked) -> { if (isChecked) selectedType = typeKeys[idx]; });
            contentTypeGroup.addView(chip);
        }
    }

    private void setupButtons() {
        generateBtn.setOnClickListener(v -> generateContent());
        settingsBtn.setOnClickListener(v -> startActivity(new Intent(this, SettingsActivity.class)));
        viewFullBtn.setOnClickListener(v -> {
            Intent i = new Intent(this, ResultDetailActivity.class);
            i.putExtra("content_type", lastResultType); i.putExtra("input_text", lastResultInput);
            i.putExtra("output_text", lastResultOutput); startActivity(i);
        });
        copyBtn.setOnClickListener(v -> {
            ((ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE))
                .setPrimaryClip(ClipData.newPlainText("generated", resultText.getText()));
            Snackbar.make(findViewById(android.R.id.content), "Copied!", Snackbar.LENGTH_SHORT).show();
        });
        shareBtn.setOnClickListener(v -> {
            Intent s = new Intent(Intent.ACTION_SEND); s.setType("text/plain");
            s.putExtra(Intent.EXTRA_TEXT, resultText.getText().toString());
            startActivity(Intent.createChooser(s, "Share via"));
        });
        supportBtn.setOnClickListener(v -> showSupportDialog());
    }

    private void showSupportDialog() {
        String donor = prefs.getString(KEY_DONOR_EMAIL, "");
        if (!donor.isEmpty()) {
            // Already donated but not marked as pro — activate
            activatePro(donor);
            return;
        }

        View dialogView = getLayoutInflater().inflate(R.layout.dialog_support, null);
        Button donateBtn = dialogView.findViewById(R.id.donateBtn);
        Button alreadyDonated = dialogView.findViewById(R.id.alreadyDonatedBtn);
        Button laterBtn = dialogView.findViewById(R.id.laterBtn);
        EditText emailInput = dialogView.findViewById(R.id.emailInput);
        LinearLayout verifySection = dialogView.findViewById(R.id.verifySection);

        MaterialAlertDialogBuilder builder = new MaterialAlertDialogBuilder(this)
            .setTitle("⭐ Support SmartWriter AI")
            .setView(dialogView);

        androidx.appcompat.app.AlertDialog dialog = builder.create();
        dialog.show();

        donateBtn.setOnClickListener(v -> {
            dialog.dismiss();
            // Open Stripe Payment Link in browser
            Intent browser = new Intent(Intent.ACTION_VIEW, Uri.parse(STRIPE_DONATE_URL));
            startActivity(browser);
            // Show verification option after returning
            showVerificationPrompt();
        });

        alreadyDonated.setOnClickListener(v -> {
            verifySection.setVisibility(View.VISIBLE);
            alreadyDonated.setVisibility(View.GONE);
            donateBtn.setVisibility(View.GONE);
        });

        Button verifyBtn = dialogView.findViewById(R.id.verifyBtn);
        verifyBtn.setOnClickListener(v -> {
            String email = emailInput.getText().toString().trim();
            if (email.isEmpty() || !email.contains("@")) {
                emailInput.setError("Enter a valid email");
                return;
            }
            activatePro(email);
            dialog.dismiss();
        });

        laterBtn.setOnClickListener(v -> dialog.dismiss());
    }

    private void showVerificationPrompt() {
        new MaterialAlertDialogBuilder(this)
            .setTitle("Already Donated?")
            .setMessage("Thanks for your support! Enter your donation email to unlock unlimited generations, or tap Later to continue with the free tier.")
            .setPositiveButton("Verify Email", (d, w) -> {
                d.dismiss();
                showSupportDialog();
            })
            .setNegativeButton("Later", null)
            .show();
    }

    private void activatePro(String email) {
        prefs.edit()
            .putBoolean(KEY_PRO_UNLOCKED, true)
            .putString(KEY_DONOR_EMAIL, email)
            .apply();
        updateLimitCounter();
        Snackbar.make(findViewById(android.R.id.content),
            "🎉 Thank you for supporting! Unlimited generations activated!",
            Snackbar.LENGTH_LONG).show();
    }

    private void generateContent() {
        // Check pro / daily limit
        if (!isPro() && getDailyCount() >= DAILY_LIMIT_FREE) {
            showSupportDialog();
            return;
        }

        AiProvider.Config config = new AiProvider.Config(prefs);
        if (!config.provider.equals("ollama") && (config.apiKey == null || config.apiKey.isEmpty())) {
            Snackbar.make(findViewById(android.R.id.content), "Set your API key in Settings first", Snackbar.LENGTH_LONG).show();
            return;
        }
        String input = inputText.getText().toString().trim();
        if (input.isEmpty()) { inputText.setError("Enter a topic"); return; }
        ((InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(inputText.getWindowToken(), 0);
        generateBtn.setEnabled(false); generateBtn.setText("Generating...");
        progressBar.setVisibility(View.VISIBLE); resultCard.setVisibility(View.GONE);
        callAi(config, buildPrompt(selectedType, input));
    }

    private String buildPrompt(String type, String input) {
        switch (type) {
            case "social": return "Write 3 engaging social media posts about: " + input + ". Include emojis and relevant hashtags. Make each post unique and platform-ready.\n\nFormat each post clearly separated.";
            case "email": return "Write a professional email about: " + input + ". Include subject line, greeting, body paragraphs, and proper closing with signature.";
            case "product": return "Write a compelling product description for: " + input + ". Highlight key features, benefits, and include a strong call to action.";
            case "hashtags": return "Generate 20 relevant, trending hashtags for content about: " + input + ". Mix popular broad with specific niche hashtags.";
            case "blog": return "Suggest 5 blog post ideas about: " + input + ". For each, provide an SEO-friendly title and 2-sentence summary.";
            case "caption": return "Write 3 engaging video captions for content about: " + input + ". Include hooks, emojis, and hashtags.";
            default: return "Write engaging content about: " + input;
        }
    }

    private void callAi(AiProvider.Config config, String prompt) {
        AiProvider.generate(config, prompt, new AiProvider.Callback() {
            @Override public void onSuccess(String c) { mainHandler.post(() -> showResult(c)); }
            @Override public void onError(String e) { mainHandler.post(() -> showError(e)); }
        });
    }

    private void showResult(String content) {
        generateBtn.setEnabled(true); generateBtn.setText("Generate"); progressBar.setVisibility(View.GONE);
        String typeLabel = typeLabels[Arrays.asList(typeKeys).indexOf(selectedType)];
        lastResultType = typeLabel; lastResultInput = inputText.getText().toString().trim(); lastResultOutput = content;
        resultTitle.setText("Generated " + typeLabel); resultText.setText(content);
        resultCard.setVisibility(View.VISIBLE);
        if (!isPro()) incrementCount();
        saveToHistory(selectedType, inputText.getText().toString().trim(), content);
    }

    private void showError(String error) {
        generateBtn.setEnabled(true); generateBtn.setText("Generate"); progressBar.setVisibility(View.GONE);
        Snackbar.make(findViewById(android.R.id.content), "Error: " + error, Snackbar.LENGTH_LONG).show();
    }

    private void saveToHistory(String type, String input, String output) {
        try {
            String hJson = prefs.getString(KEY_HISTORY, "[]");
            JSONArray h = new JSONArray(hJson);
            JSONObject e = new JSONObject();
            e.put("type", type); e.put("input", input); e.put("output", output);
            e.put("provider", prefs.getString("provider", "openai"));
            e.put("timestamp", new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(new Date()));
            h.put(0, e);
            if (h.length() > 50) { JSONArray t = new JSONArray(); for (int i = 0; i < 50; i++) t.put(h.get(i)); h = t; }
            prefs.edit().putString(KEY_HISTORY, h.toString()).apply();
        } catch (Exception ignored) {}
    }
}
