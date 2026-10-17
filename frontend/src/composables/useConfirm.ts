import { ref, h, render } from 'vue';
import { VDialog, VCard, VCardTitle, VCardText, VCardActions, VBtn, VSpacer, VTextarea } from 'vuetify/components';

export function useConfirm() {
  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const show = ref(true);
      
      const handleConfirm = () => {
        show.value = false;
        cleanup();
        resolve(true);
      };
      
      const handleCancel = () => {
        show.value = false;
        cleanup();
        resolve(false);
      };
      
      const cleanup = () => {
        if (container && document.body.contains(container)) {
          render(null, container);
          document.body.removeChild(container);
        }
      };
      
      const dialogComponent = h(VDialog, {
        modelValue: show.value,
        'onUpdate:modelValue': (value: boolean) => {
          if (!value) handleCancel();
        },
        persistent: true,
        width: '400'
      }, {
        default: () => h(VCard, {}, {
          default: () => [
            h(VCardTitle, { class: 'headline' }, title),
            h(VCardText, {}, h(VTextarea, {
              modelValue: message,
              autoGrow: true,
              flat: true,
              readonly: true,
              solo: true
            })),
            h(VCardActions, {}, [
              h(VSpacer),
              h(VBtn, { 
                color: 'primary',
                onClick: handleConfirm 
              }, 'OK'),
              h(VBtn, { 
                color: 'primary',
                onClick: handleCancel 
              }, 'Cancel')
            ])
          ]
        })
      });
      
      const container = document.createElement('div');
      document.body.appendChild(container);
      render(dialogComponent, container);
    });
  };
  
  return { confirm };
}