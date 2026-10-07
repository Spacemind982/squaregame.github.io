// 通用确认弹窗 + 提示弹窗
import { h } from './dom.js';

export function showConfirm(message, { title = '请确认', confirmText = '确认', cancelText = '取消' } = {}) {
  return new Promise((resolve) => {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      // 兜底：浏览器原生
      resolve(window.confirm(message));
      return;
    }
    while (modalRoot.firstChild) modalRoot.removeChild(modalRoot.firstChild);

    const ok = h('button', { class: 'btn btn--danger' }, confirmText);
    const cancel = h('button', { class: 'btn' }, cancelText);

    const cleanup = (val) => {
      while (modalRoot.firstChild) modalRoot.removeChild(modalRoot.firstChild);
      resolve(val);
    };
    ok.addEventListener('click', () => cleanup(true));
    cancel.addEventListener('click', () => cleanup(false));

    const box = h('div', { class: 'modal__box' }, [
      h('div', { class: 'modal__title' }, title),
      h('div', { class: 'modal__body' }, message),
      h('div', { class: 'modal__actions' }, [cancel, ok])
    ]);
    modalRoot.appendChild(h('div', { class: 'modal' }, box));
  });
}

export function showAlert(message, { title = '提示', okText = '知道了' } = {}) {
  return new Promise((resolve) => {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) { window.alert(message); resolve(true); return; }
    while (modalRoot.firstChild) modalRoot.removeChild(modalRoot.firstChild);
    const ok = h('button', { class: 'btn btn--primary' }, okText);
    const cleanup = () => {
      while (modalRoot.firstChild) modalRoot.removeChild(modalRoot.firstChild);
      resolve(true);
    };
    ok.addEventListener('click', cleanup);
    const box = h('div', { class: 'modal__box' }, [
      h('div', { class: 'modal__title' }, title),
      h('div', { class: 'modal__body' }, message),
      h('div', { class: 'modal__actions' }, [ok])
    ]);
    modalRoot.appendChild(h('div', { class: 'modal' }, box));
  });
}
