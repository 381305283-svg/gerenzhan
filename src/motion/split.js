/**
 * 把标题拆成「遮罩 + 内层」的结构，让文字可以从一条看不见的缝里推上来。
 *
 *   <span class="m-mask"><span class="m-inner">陈</span></span>
 *
 * 遮罩负责裁切（overflow: hidden），内层负责位移，两者都由 GSAP 驱动。
 * 原文存在 dataset 里，卸载或热更新时可以还原。
 */

const MASK = "m-mask";
const INNER = "m-inner";

function makeMask(text, extraClass) {
  const outer = document.createElement("span");
  outer.className = extraClass ? `${MASK} ${extraClass}` : MASK;
  const inner = document.createElement("span");
  inner.className = INNER;
  inner.textContent = text;
  outer.append(inner);
  return outer;
}

function sourceText(el) {
  if (el.dataset.mText === undefined) {
    el.dataset.mText = el.textContent ?? "";
  }
  return el.dataset.mText;
}

/** 还原文案（移除拆分产生的 DOM），用于 effect 清理。 */
export function restoreSplit(el) {
  if (el && el.dataset.mText !== undefined) {
    el.textContent = el.dataset.mText;
  }
}

/** 逐字拆分，适合名字、中文短标题。空格保留为普通文本节点。 */
export function splitChars(el) {
  if (!el) return [];
  const text = sourceText(el);
  el.textContent = "";
  const frag = document.createDocumentFragment();
  Array.from(text).forEach((char) => {
    frag.append(char === " " ? document.createTextNode(" ") : makeMask(char));
  });
  el.append(frag);
  return Array.from(el.querySelectorAll(`.${INNER}`));
}

/** 按词拆分，适合英文大标题。 */
export function splitWords(el) {
  if (!el) return [];
  const words = sourceText(el).trim().split(/\s+/);
  el.textContent = "";
  const frag = document.createDocumentFragment();
  words.forEach((word, index) => {
    if (index) frag.append(document.createTextNode(" "));
    frag.append(makeMask(word));
  });
  el.append(frag);
  return Array.from(el.querySelectorAll(`.${INNER}`));
}
