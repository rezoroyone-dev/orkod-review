<template>
  <div class="snow" ref="editorRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import Quill from 'quill';
import DOMPurify from 'dompurify';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';

interface Props {
  modelValue?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const editorRef = ref<HTMLDivElement | null>(null);
let editor: Quill | null = null;

// Sanitize HTML to prevent XSS attacks
const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'sub', 'sup',
      'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel']
  });
};

const options = {
  theme: 'bubble', // bubble or snow
  placeholder: 'write something...',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['blockquote', 'code-block'],
      [{ 'script': 'sub' }, { 'script': 'super' }],
    ]
  },
};

onMounted(() => {
  if (editorRef.value) {
    editor = new Quill(editorRef.value, options);

    if (props.modelValue) {
      // Sanitize before setting content to prevent XSS
      editor.root.innerHTML = sanitizeHtml(props.modelValue);
    }

    editor.on('text-change', () => {
      // Sanitize before emitting to prevent XSS
      emit('update:modelValue', sanitizeHtml(editor?.root.innerHTML || ''));
    });
  }
});

onUnmounted(() => {
  if (editor) {
    editor = null;
  }
});

watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.root.innerHTML) {
    editor.root.innerHTML = newValue || '';
  }
});

// Expose editor instance for parent component to access (e.g., Bill.vue)
defineExpose({
  editor: computed(() => editor)
});
</script>

<style lang="scss" scoped>
</style>