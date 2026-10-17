import { ref } from 'vue';

export interface ConfirmDialogOptions {
  show: boolean;
  title: string;
  body: string;
  callBackFunction: (param: unknown) => void;
  callBackArgument: unknown;
}

export function useConfirmDialog() {
  const confirmDialogContents = ref<ConfirmDialogOptions>({
    show: false,
    title: '',
    body: '',
    callBackFunction: () => {},
    callBackArgument: null
  });

  function showConfirmDialog(title: string, body: string, callBackFunction: (param: unknown) => void, callBackArgument: unknown) {
    confirmDialogContents.value = { show: true, title, body, callBackFunction, callBackArgument };
  }

  function closeConfirmDialog() {
    confirmDialogContents.value.show = false;
  }

  return { confirmDialogContents, showConfirmDialog, closeConfirmDialog };
}
