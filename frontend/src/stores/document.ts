import Document from '@/interfaces/Document';
import { getIndexOfArrayObject } from '@/utilities/MyUtilities';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useDocumentStore = defineStore('document', () => {
  const debug = ref(import.meta.env.DEV);
  const documents = ref<Document[]>([]);

  // Getters
  const getDocuments = computed(() => {
    return documents.value;
  });

  // Actions
  const setDocuments = (newValue: Document[]) => {
    if (debug.value) {
      console.log('setDocuments triggered with', newValue?.length || 0, 'documents');
    }
    documents.value = newValue;
  };
  const clearDocuments = () => {
    if (debug.value) {
      console.log('clearDocuments triggered');
    }
    documents.value = [];
  };
  const removeDocument = (doc: Document) => {
    if (debug.value) {
      console.log('removeDocument triggered');
    }
    const index: number = getIndexOfArrayObject(documents.value, doc);
    if (index == -1) {
      throw Error("Store can't find the document index");
    }
    documents.value.splice(index, 1);
  };

  return {
    documents,
    getDocuments,
    setDocuments,
    clearDocuments,
    removeDocument,
  };
});
