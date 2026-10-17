<template>
  <div>
    <v-dialog
      v-if="!embedded"
      :model-value="showMyPDFViewer"
      :width="canvasDialogSize.width"
      :height="canvasDialogSize.height"
      justify="center"
      persistent
      scrollable
      background-color="white"
      transition="dialog-transition"
    >
      <v-card class="elevation-12 pagesToolBar">
        <v-toolbar flat color="white" align="start" justify="center">
          <div v-show="pageCount > 0">
            <v-btn id="prev" text icon v-on:click="moveToPreviousPage">
              <v-icon large dark color="primary">mdi-chevron-left</v-icon>
            </v-btn>
            {{ currentPage }} / {{ pageCount }}
            <v-btn text icon v-on:click="moveToNextPage">
              <v-icon large dark color="primary">mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn text icon v-on:click="zoomIn()">
              <v-icon large dark color="primary">mdi-magnify-plus</v-icon>
            </v-btn>
            <v-btn text icon v-on:click="resetSize()">
              <v-icon large dark color="primary">mdi-magnify</v-icon>
            </v-btn>
            <v-btn text icon v-on:click="zoomOut()">
              <v-icon large dark color="primary">mdi-magnify-minus</v-icon>
            </v-btn>
          </div>
          <v-btn color="success" @click="closeMe()">{{ $t('close') }}</v-btn>
        </v-toolbar>
        <v-card-text class="pdfDialog">
          <canvas id="pdf" ref="pdfRef" />
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-card v-else class="elevation-12 pagesToolBar">
      <v-toolbar flat color="white" align="start" justify="center">
        <div v-show="pageCount > 0">
          <v-btn id="prev" text icon v-on:click="moveToPreviousPage">
            <v-icon large dark color="primary">mdi-chevron-left</v-icon>
          </v-btn>
          {{ currentPage }} / {{ pageCount }}
          <v-btn text icon v-on:click="moveToNextPage">
              <v-icon large dark color="primary">mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn text icon v-on:click="zoomIn()">
            <v-icon large dark color="primary">mdi-magnify-plus</v-icon>
          </v-btn>
          <v-btn text icon v-on:click="resetSize()">
            <v-icon large dark color="primary">mdi-magnify</v-icon>
          </v-btn>
          <v-btn text icon v-on:click="zoomOut()">
            <v-icon large dark color="primary">mdi-magnify-minus</v-icon>
          </v-btn>
        </div>
        <v-btn color="success" @click="closeMe()">{{ $t('close') }}</v-btn>
      </v-toolbar>
      <v-card-text class="pdfDialog">
        <canvas id="pdf" ref="pdfRef" />
      </v-card-text>
    </v-card>
    <ProgressBar :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import AppConfigs from '@/AppConfigs';
import ProgressBar from "@/dialogs/ProgressBar.vue";
import { ICanvasSize, IPDFFileInfo } from '@/interfaces/Treatment'; // Assuming these interfaces are still valid or moved
import AuthenticationService from '@/services/AuthenticationService';
import { useAppStore } from '@/stores/app';
import axios, { AxiosRequestConfig } from 'axios';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, PDFPageProxy, version } from 'pdfjs-dist';
import { onMounted, ref, shallowRef, watch } from 'vue';

// Set up PDF.js worker using CDN to avoid local resolution issues in Vite
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
console.log('DEBUG: MyPDFViewer - Worker Source:', GlobalWorkerOptions.workerSrc);

const props = defineProps<{
  showMyPDFViewer?: boolean;
  pdfFileInfo?: IPDFFileInfo;
  embedded?: boolean;
}>();

const emit = defineEmits(['closeMyPDFViewer', 'MyPDFViewerResized']);

const appStore = useAppStore();

const canvasDialogSize = ref<ICanvasSize>({
  width: 800,
  height: 600
});
const loading = ref(false);
const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const pageRendering = ref(false);
const pageNumPending = ref(0);
const currentPage = ref(1);
const pageCount = ref(0);
const scale = ref(1);
const pdfDoc = shallowRef<PDFDocumentProxy | undefined>(undefined);

const pdfRef = ref<HTMLCanvasElement | null>(null); // Template ref for the canvas

// Methods
const renderPage = async (num: number) => {
  pageRendering.value = true;
  if (!pdfDoc.value) {
    return;
  }

  const pdfPromise = pdfDoc.value.getPage(num);
  if (!pdfPromise) {
    return;
  }

  let pdfPage: PDFPageProxy = await pdfPromise.then((page: PDFPageProxy) => page);

  if (!pdfPage) {
    return;
  }

  let viewport = pdfPage.getViewport({ scale: scale.value });

  if (!canvas.value) {
    return;
  }

  canvas.value.height = viewport.height;
  canvas.value.width = viewport.width;

  if (!ctx.value) {
    return;
  }

  let renderContext = {
    canvasContext: ctx.value,
    canvas: canvas.value,
    viewport: viewport,
  };

  let renderTask = pdfPage.render(renderContext);

  await renderTask.promise.then(() => {
    pageRendering.value = false;
    if (pageNumPending.value != 0) {
      renderPage(pageNumPending.value);
      pageNumPending.value = 0;
    }
  });

  currentPage.value = num;
  canvasDialogSize.value = {
    width: canvas.value.width,
    height: canvas.value.height
  };
  emit("MyPDFViewerResized", canvasDialogSize.value);
};

const loadPDF = async () => {
  try {
    loading.value = true;
    const url = AppConfigs.getServerURL() + "/protocolPDF";
    let axiosConfigs: AxiosRequestConfig = AuthenticationService.getAxiosConfig(appStore);

    if (!props.pdfFileInfo) {
      throw new Error("pdfFileInfo is undefined");
    }

    let data: IPDFFileInfo = props.pdfFileInfo;
    console.log('DEBUG: MyPDFViewer - Loading PDF from:', url, 'with data:', JSON.stringify(data));
    axiosConfigs.responseType = "arraybuffer";

    let PDFBinary = await axios.post(url, data, axiosConfigs)
      .then((response) => {
        console.log('DEBUG: MyPDFViewer - Received PDF binary, length:', response.data.byteLength);
        return response.data;
      })
      .catch(error => {
        throw error;
      });

    pdfDoc.value = await getDocument({ data: PDFBinary }).promise.then((pdf: PDFDocumentProxy) => pdf);

    if (!pdfDoc.value) {
      throw Error("Unable to get PDF from server");
    }

    pageCount.value = pdfDoc.value.numPages;

    if (!canvas.value) {
      throw Error("Unable to get canvas from document");
    }

    renderPage(currentPage.value);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const queueRenderPage = (num: number) => {
  if (pageRendering.value) {
    pageNumPending.value = num;
  } else {
    renderPage(num);
  }
};

const moveToPreviousPage = () => {
  if (currentPage.value <= 1) {
    return;
  }
  currentPage.value--;
  queueRenderPage(currentPage.value);
};

const moveToNextPage = () => {
  if (!pdfDoc.value) {
    return;
  }
  if (currentPage.value >= pdfDoc.value.numPages) {
    return;
  }
  currentPage.value++;
  queueRenderPage(currentPage.value);
};

const zoomIn = () => {
  scale.value += 0.5;
  renderPage(currentPage.value);
};

const zoomOut = () => {
  if (scale.value > 1) {
    scale.value -= 0.5;
    renderPage(currentPage.value);
  }
  if (scale.value < 1) {
    resetSize();
  }
};

const resetSize = () => {
  scale.value = 1;
  renderPage(currentPage.value);
};

const closeMe = () => {
  emit('closeMyPDFViewer');
};

// Lifecycle Hooks
onMounted(async () => {
  // Ensure canvas is available after component is mounted
  if (pdfRef.value) {
    canvas.value = pdfRef.value;
    ctx.value = canvas.value.getContext("2d");
    if (props.showMyPDFViewer) {
      await loadPDF();
    }
  } else {
    // Fallback if ref is not immediately available (e.g., due to v-if)
    // This part might need more robust handling depending on actual usage
    const checkCanvas = () => {
      const el = document.getElementById("pdf") as HTMLCanvasElement;
      if (el) {
        canvas.value = el;
        ctx.value = canvas.value.getContext("2d");
        if (props.showMyPDFViewer) {
          loadPDF();
        }
      } else {
        setTimeout(checkCanvas, 100); // Retry
      }
    };
    checkCanvas();
  }
});

watch(() => props.showMyPDFViewer, async (newVal) => {
  if (newVal && canvas.value && ctx.value && !pdfDoc.value) {
    await loadPDF();
  }
});
</script>

<style lang="css" scoped>
.pagesToolBar {
  position: relative;
  background-color: white;
}

.pdfDialog {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
