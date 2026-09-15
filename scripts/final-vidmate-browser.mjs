import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'VidGrabBrowserActivity.java');
if (!fs.existsSync(file)) throw new Error('VidGrabBrowserActivity.java not found');

let text = fs.readFileSync(file, 'utf8');
if (text.includes('VIDGRAB_VIDMATE_BROWSER_UI_V1')) {
  console.log('[final-vidmate-browser] already applied');
  process.exit(0);
}

text = text.replace(
  'public class VidGrabBrowserActivity extends Activity {',
  'public class VidGrabBrowserActivity extends Activity {\n    // VIDGRAB_VIDMATE_BROWSER_UI_V1\n    private LinearLayout vidMateVideoActions;'
);

const pageFinished = '                syncToolbar();\n';
if (!text.includes(pageFinished)) throw new Error('Browser page-finished hook not found');
text = text.replace(pageFinished, pageFinished + '                updateVidMateVideoActions(url);\n');

const webViewInsert = '        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));\n';
if (!text.includes(webViewInsert)) throw new Error('Browser WebView insertion point not found');
const actionBar = `        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        // VidMate-style action row: it lives OUTSIDE the WebView, below the video/page,
        // so it never covers the YouTube embedded player itself.
        vidMateVideoActions = new LinearLayout(this);
        vidMateVideoActions.setGravity(Gravity.CENTER);
        vidMateVideoActions.setPadding(dp(6), dp(4), dp(6), dp(4));
        vidMateVideoActions.setBackgroundColor(Color.WHITE);
        vidMateVideoActions.setElevation(dp(4));
        vidMateVideoActions.setVisibility(View.GONE);
        String[] actionLabels = {"SAVE", "POPUP", "PLAY AUDIO", "SHARE", "GRAB"};
        for (int i = 0; i < actionLabels.length; i++) {
            final int action = i;
            TextView item = textButton(actionLabels[i]);
            item.setTextSize(i == 4 ? 12 : 10);
            item.setTypeface(null, android.graphics.Typeface.BOLD);
            item.setMinHeight(dp(64));
            if (i == 4) {
                item.setTextColor(Color.WHITE);
                item.setBackground(rounded(Color.rgb(220, 25, 35)));
            } else {
                item.setTextColor(Color.rgb(45, 50, 60));
            }
            item.setOnClickListener(v -> {
                String current = webView == null ? "" : webView.getUrl();
                if (action == 3) {
                    try {
                        android.content.Intent share = new android.content.Intent(android.content.Intent.ACTION_SEND);
                        share.setType("text/plain");
                        share.putExtra(android.content.Intent.EXTRA_TEXT, current);
                        startActivity(android.content.Intent.createChooser(share, "Share video link"));
                    } catch (Exception ignored) {}
                    return;
                }
                if (isVideoPageUrl(current)) {
                    if (action == 0 || action == 2 || action == 4) showGrabDialog(current);
                    else android.widget.Toast.makeText(this, "Open the video in Vibe Player after downloading for popup playback.", android.widget.Toast.LENGTH_SHORT).show();
                }
            });
            LinearLayout.LayoutParams actionLp = new LinearLayout.LayoutParams(0, dp(66), 1f);
            actionLp.setMargins(dp(2), 0, dp(2), 0);
            vidMateVideoActions.addView(item, actionLp);
        }
        root.addView(vidMateVideoActions, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(74)));
`;
text = text.replace(webViewInsert, actionBar);

const syncMethod = '    private void syncToolbar() {\n';
if (!text.includes(syncMethod)) throw new Error('syncToolbar method not found');
const helper = `    private void updateVidMateVideoActions(String url) {
        if (vidMateVideoActions == null) return;
        boolean video = isVideoPageUrl(url);
        vidMateVideoActions.setVisibility(video ? View.VISIBLE : View.GONE);
        if (video) vidMateVideoActions.bringToFront();
    }

`;
text = text.replace(syncMethod, helper + syncMethod);

fs.writeFileSync(file, text);
console.log('[final-vidmate-browser] VidMate-style video action row + visible GRAB button added');
