// DOM 操作辅助函数

// 创建元素 + 设置属性 + 子元素
export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

// 在 container 内清空并挂载新元素
export function mount(container, ...nodes) {
  while (container.firstChild) container.removeChild(container.firstChild);
  for (const n of nodes) {
    if (n == null) continue;
    container.appendChild(typeof n === 'string' ? document.createTextNode(n) : n);
  }
}
