package com.codex.smartwriter;

import android.content.ClipData; import android.content.ClipboardManager; import android.content.Context;
import android.content.Intent; import android.content.SharedPreferences; import android.os.Bundle;
import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup; import android.widget.*;
import androidx.appcompat.app.AppCompatActivity; import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.LinearLayoutManager; import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.snackbar.Snackbar;
import org.json.JSONArray; import org.json.JSONObject;
import java.util.ArrayList;

public class HistoryActivity extends AppCompatActivity {
    private RecyclerView recyclerView; private TextView emptyText; private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history);
        prefs = getSharedPreferences("smartwriter_prefs", MODE_PRIVATE);
        recyclerView = findViewById(R.id.recyclerView); emptyText = findViewById(R.id.emptyText);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        loadHistory();
        findViewById(R.id.clearBtn).setOnClickListener(v -> {
            prefs.edit().putString("generation_history", "[]").apply(); loadHistory();
            Snackbar.make(recyclerView, "History cleared", Snackbar.LENGTH_SHORT).show();
        });
        findViewById(R.id.backBtn).setOnClickListener(v -> finish());
    }

    private void loadHistory() {
        try {
            String json = prefs.getString("generation_history", "[]");
            JSONArray h = new JSONArray(json);
            ArrayList<HistoryItem> items = new ArrayList<>();
            for (int i = 0; i < h.length(); i++) {
                JSONObject o = h.getJSONObject(i);
                items.add(new HistoryItem(o.optString("type",""), o.optString("input",""), o.optString("output",""), o.optString("timestamp","")));
            }
            if (items.isEmpty()) { emptyText.setVisibility(View.VISIBLE); recyclerView.setVisibility(View.GONE); }
            else { emptyText.setVisibility(View.GONE); recyclerView.setVisibility(View.VISIBLE); recyclerView.setAdapter(new HistoryAdapter(items)); }
        } catch (Exception e) { emptyText.setVisibility(View.VISIBLE); recyclerView.setVisibility(View.GONE); }
    }

    static class HistoryItem { String type, input, output, timestamp;
        HistoryItem(String t, String i, String o, String ts) { type=t; input=i; output=o; timestamp=ts; } }

    class HistoryAdapter extends RecyclerView.Adapter<HistoryAdapter.VH> {
        final ArrayList<HistoryItem> items;
        final String[] typeKeys = {"social","email","product","hashtags","blog","caption"};
        final String[] typeNames = {"Social Post","Email","Product Desc","Hashtags","Blog Ideas","Caption"};

        HistoryAdapter(ArrayList<HistoryItem> i) { items = i; }
        @Override public VH onCreateViewHolder(ViewGroup p, int v) {
            return new VH(LayoutInflater.from(p.getContext()).inflate(R.layout.item_history, p, false)); }
        @Override public void onBindViewHolder(VH h, int pos) {
            HistoryItem item = items.get(pos);
            String tn = "Content";
            for (int j = 0; j < typeKeys.length; j++) { if (typeKeys[j].equals(item.type)) { tn = typeNames[j]; break; } }
            final String typeName = tn;
            h.typeText.setText(typeName);
            h.inputText.setText(item.input.length()>80 ? item.input.substring(0,80)+"..." : item.input);
            String out = item.output.length()>150 ? item.output.substring(0,150)+"..." : item.output;
            h.outputText.setText(out); h.timestampText.setText(item.timestamp);
            h.copyBtn.setOnClickListener(v -> {
                ((ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("gen",item.output));
                Snackbar.make(recyclerView,"Copied!",Snackbar.LENGTH_SHORT).show();
            });
            h.shareBtn.setOnClickListener(v -> {
                Intent s=new Intent(Intent.ACTION_SEND); s.setType("text/plain"); s.putExtra(Intent.EXTRA_TEXT,item.output);
                startActivity(Intent.createChooser(s,"Share"));
            });
            h.card.setOnClickListener(v -> {
                Intent i=new Intent(HistoryActivity.this,ResultDetailActivity.class);
                i.putExtra("content_type",typeName); i.putExtra("input_text",item.input); i.putExtra("output_text",item.output);
                startActivity(i);
            });
        }
        @Override public int getItemCount() { return items.size(); }
        class VH extends RecyclerView.ViewHolder {
            CardView card; TextView typeText,inputText,outputText,timestampText; Button copyBtn,shareBtn;
            VH(View v) { super(v); card=v.findViewById(R.id.card); typeText=v.findViewById(R.id.typeText);
                inputText=v.findViewById(R.id.inputText); outputText=v.findViewById(R.id.outputText);
                timestampText=v.findViewById(R.id.timestampText); copyBtn=v.findViewById(R.id.copyBtn);
                shareBtn=v.findViewById(R.id.shareBtn); }
        }
    }
}
