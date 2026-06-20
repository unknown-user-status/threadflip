package com.codex.smartwriter;

import android.content.ClipData; import android.content.ClipboardManager; import android.content.Context;
import android.content.Intent; import android.os.Bundle; import android.widget.Button; import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class ResultDetailActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_result_detail);
        TextView inputLabel = findViewById(R.id.inputLabel), inputText = findViewById(R.id.inputText),
                 outputText = findViewById(R.id.outputText);
        Button copyBtn = findViewById(R.id.copyBtn), shareBtn = findViewById(R.id.shareBtn),
               backBtn = findViewById(R.id.backBtn);
        String type = getIntent().getStringExtra("content_type"),
               input = getIntent().getStringExtra("input_text"),
               output = getIntent().getStringExtra("output_text");
        setTitle(type != null ? type : "Result");
        inputLabel.setText("Input" + (type != null ? " (" + type + ")" : ""));
        inputText.setText(input != null ? input : "");
        outputText.setText(output != null ? output : "");
        outputText.setTextIsSelectable(true);
        copyBtn.setOnClickListener(v -> {
            ((ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("gen",output));
            ((Button)v).setText("Copied!");
            v.postDelayed(() -> ((Button)v).setText("Copy All"), 1500);
        });
        shareBtn.setOnClickListener(v -> {
            Intent s = new Intent(Intent.ACTION_SEND); s.setType("text/plain");
            s.putExtra(Intent.EXTRA_TEXT, output);
            startActivity(Intent.createChooser(s, "Share via"));
        });
        backBtn.setOnClickListener(v -> finish());
    }
}
