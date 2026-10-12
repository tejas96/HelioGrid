# The RFC diagram in the chat

The chat draws the RFC's `##### Architecture diagram` with the Mermaid library in the inline
widget. The source is the file's Mermaid block, pasted as it is; nothing is placed by hand. Call
the widget's `read_me` once in the session before the first draw, then show this page with the
block in `source`. A draw that fails shows the library's error, never the raw text.

The page carries one button, `Larger view`. It starts fitted to the chat's width; a press draws the
diagram a quarter larger than its own size, read by scrolling sideways, and a second press fits it
again. The widget has no real full screen, so the button changes the diagram's width and nothing
else.

```html
<style>
#rfc-diagram { overflow-x: auto; }
#rfc-diagram svg { max-width: 100%; height: auto; }
#rfc-diagram.large svg { max-width: none !important; }
#rfc-size { margin: 0 0 8px; padding: 4px 10px; font-size: 13px; color: var(--text-primary); background: var(--bg2); border: 1px solid var(--b); border-radius: var(--radius); cursor: pointer; }
#rfc-diagram .node rect, #rfc-diagram .node polygon, #rfc-diagram .node path { fill: var(--bg2); stroke: var(--b); stroke-width: 1px; rx: 4; }
#rfc-diagram .edgePath path { stroke: var(--t); stroke-width: 1px; }
#rfc-diagram .marker { fill: var(--t); stroke: var(--t); }
#rfc-diagram .nodeLabel, #rfc-diagram .edgeLabel { color: var(--text-primary); font-size: 13px; }
#rfc-diagram .error { color: var(--text-danger); font-size: 13px; }
</style>
<button id="rfc-size" type="button" aria-pressed="false">Larger view</button>
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
const drawn = host.querySelector('svg');
const size = document.getElementById('rfc-size');
if (drawn) {
  const ownWidth = drawn.viewBox.baseVal.width;
  size.addEventListener('click', () => {
    const large = host.classList.toggle('large');
    drawn.style.width = large ? ownWidth * 1.25 + 'px' : '';
    size.textContent = large ? 'Fit to width' : 'Larger view';
    size.setAttribute('aria-pressed', String(large));
  });
} else {
  size.hidden = true;
}
</script>
```
