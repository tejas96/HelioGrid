# The RFC diagram in the chat

The chat draws the RFC's `##### Architecture diagram` with the Mermaid library in the inline
widget. The source is the file's Mermaid block, pasted as it is; nothing is placed by hand. Call
the widget's `read_me` once in the session before the first draw, then show this page with the
block in `source`. A draw that fails shows the library's error, never the raw text.

```html
<style>
#rfc-diagram svg { max-width: 100%; height: auto; }
#rfc-diagram .node rect, #rfc-diagram .node polygon, #rfc-diagram .node path { fill: var(--bg2); stroke: var(--b); stroke-width: 1px; rx: 4; }
#rfc-diagram .edgePath path { stroke: var(--t); stroke-width: 1px; }
#rfc-diagram .marker { fill: var(--t); stroke: var(--t); }
#rfc-diagram .nodeLabel, #rfc-diagram .edgeLabel { color: var(--text-primary); font-size: 13px; }
#rfc-diagram .error { color: var(--text-danger); font-size: 13px; }
</style>
<div id="rfc-diagram"></div>
<script type="module">
import mermaid from 'https://esm.sh/mermaid@11/dist/mermaid.esm.min.mjs';
const themeMode = document.documentElement.dataset.mode;
const dark = themeMode ? themeMode === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
await document.fonts.ready;
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  fontFamily: '"anthropic-sans", sans-serif',
  themeVariables: {
    darkMode: dark,
    fontSize: '13px',
    fontFamily: '"anthropic-sans", sans-serif',
    lineColor: dark ? '#9c9a92' : '#73726c',
    textColor: dark ? '#c2c0b6' : '#3d3d3a',
    primaryColor: dark ? '#2a2a27' : '#f4f3ee',
    primaryBorderColor: dark ? '#5a5955' : '#c9c7bf',
    primaryTextColor: dark ? '#c2c0b6' : '#3d3d3a',
  },
});
const source = `<the file's Mermaid block, without the fence>`;
const host = document.getElementById('rfc-diagram');
try {
  const { svg } = await mermaid.render('rfc-svg', source);
  host.innerHTML = svg;
} catch (e) {
  host.innerHTML = '<p class="error">The library could not draw: ' + String(e.message || e) + '</p>';
}
</script>
```
