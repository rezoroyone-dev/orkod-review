import { ref } from 'vue';

export function useMessageBox() {
  const msgBox = ref({ show: false, title: '', message: '' });

  function showMsgBox(title: string, message: string) {
    msgBox.value = { show: true, title, message };
  }

  function closeMsgBox() {
    msgBox.value.show = false;
  }

  return { msgBox, showMsgBox, closeMsgBox };
}