/** Hermes RTL Chat — presentation only, no network/storage/message writes.
 * Direction uses the dominant prose script (ignoring code/mentions/URLs),
 * so a leading @jarvis or Git does not turn a Persian paragraph LTR.
 * Disable in Settings > Plugins to remove all styles/attributes immediately.
 */
const ROOTS = '[data-slot="group-chat-message-content"], [data-slot="aui_assistant-message-content"] .aui-md, [data-slot="aui_user-inline-text"]';
const BLOCKS = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,th,td';
const SKIP = 'pre,code,[data-ref],.katex,[data-slot="code-card"],[data-streamdown="code-block"],button,input,textarea,[contenteditable]';
const MARK = 'data-hermes-rtl-chat';

function directionOf(block) {
  const doc = block.ownerDocument;
  const walker = doc.createTreeWalker(block, 4);
  let text = '';
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement?.closest(SKIP)) text += walker.currentNode.nodeValue + ' ';
  }
  text = text.replace(/(?:https?:\/\/|www\.)\S+|@[\w.-]+|`[^`]*`/g, ' ');
  const letters = [...text].filter(ch => /\p{L}/u.test(ch));
  const rtl = letters.filter(ch => /\p{Script=Arabic}|\p{Script=Hebrew}/u.test(ch)).length;
  if (!letters.length) return 'ltr';
  // Tie-break on the first prose letter, rather than punctuation or digits.
  return rtl > letters.length / 2 || (rtl === letters.length / 2 && /\p{Script=Arabic}|\p{Script=Hebrew}/u.test(letters[0])) ? 'rtl' : 'ltr';
}

export default {
  id: 'hermes-rtl-chat',
  name: 'RTL Chat — Persian & mixed text',
  description: 'Per-paragraph RTL/LTR for chat and bot groups; isolated code and mentions. Display only.',
  defaultEnabled: true,
  register(ctx) {
    // Fail closed on old shells: reversible unload is mandatory.
    if (typeof ctx.onDispose !== 'function' || typeof document === 'undefined') return;
    const doc = document;
    const win = doc.defaultView;
    const style = doc.createElement('style');
    style.id = 'hermes-rtl-chat-style';
    style.textContent = `
      [${MARK}="rtl"] { direction:rtl !important; unicode-bidi:isolate !important; text-align:right !important; }
      [${MARK}="ltr"] { direction:ltr !important; unicode-bidi:isolate !important; text-align:left !important; }
      :is(${ROOTS}) :is(pre,[data-slot="code-card"],[data-streamdown="code-block"],.katex),
      [${MARK}] :is(code,pre,[data-slot="code-card"],[data-streamdown="code-block"],.katex) {
        direction:ltr !important; unicode-bidi:isolate !important; text-align:left !important;
      }
      [${MARK}] :is([data-ref],a) { unicode-bidi:isolate !important; }
      [${MARK}] [data-ref] { direction:ltr !important; }
      [${MARK}] :is(ul,ol) { padding-inline-start:1.25em; padding-inline-end:0; }
    `;
    doc.head.append(style);
    const pending = new Set();
    let frame = null;
    let disposed = false;
    function update(root) {
      if (!root.isConnected) return;
      const blocks = [...root.querySelectorAll(BLOCKS)].filter(el => !el.closest(SKIP));
      // Plain-text fallback in older group renderers / user line blocks.
      if (!blocks.length && !root.closest(SKIP)) blocks.push(root);
      for (const block of blocks) {
        const dir = directionOf(block);
        if (block.getAttribute(MARK) !== dir) block.setAttribute(MARK, dir);
      }
    }
    function enqueue(node) {
      const el = node.nodeType === 1 ? node : node.parentElement;
      if (!el) return;
      const root = el.closest(ROOTS);
      if (root) pending.add(root);
      for (const found of el.querySelectorAll(ROOTS)) pending.add(found);
    }
    const observer = new win.MutationObserver(records => {
      for (const record of records) {
        enqueue(record.target);
        for (const added of record.addedNodes) enqueue(added);
      }
      if (pending.size && frame === null) frame = win.requestAnimationFrame(() => {
        frame = null;
        if (disposed) return;
        for (const root of pending) update(root);
        pending.clear();
      });
    });
    for (const root of doc.querySelectorAll(ROOTS)) update(root);
    // Attributes deliberately not observed: our marks cannot feedback-loop.
    observer.observe(doc.body, {childList:true, subtree:true, characterData:true});
    ctx.onDispose(() => {
      disposed = true;
      observer.disconnect();
      if (frame !== null) win.cancelAnimationFrame(frame);
      pending.clear();
      style.remove();
      for (const el of doc.querySelectorAll(`[${MARK}]`)) el.removeAttribute(MARK);
    });
  }
};
