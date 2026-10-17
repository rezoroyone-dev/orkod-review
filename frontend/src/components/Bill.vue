<template>
    <v-alert v-model="showAlert" class="fixedTopRight" :type="templateSaved ? 'success' : 'error'" max-width="500px"
      transition="fab-transition" closable elevation="24">
      <strong>{{ templateSaved ? "Template saved successfully" : "Failed to save template" }}</strong>
    </v-alert>

    <div class="d-print-none">
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-icon large @click="showToolBar()" v-bind="props" color="success">mdi-home</v-icon>
        </template>
        <span>{{ t("Show_ToolBar") }}</span>
      </v-tooltip>
      <v-divider vertical />
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-icon large v-bind="props" class="mx-5" color="success" @click="print">mdi-printer</v-icon>
        </template>
        <span>{{ t("print") }}</span>
      </v-tooltip>
      <v-divider vertical />
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-icon @click="saveEditorContents()" large v-bind="props" color="success">mdi-content-save</v-icon>
        </template>
        <span>{{ t("Save") }}</span>
      </v-tooltip>
    </div>

    <div class="invoice-box elevation-10">
      <img src="@/static/PranicHealingLogo.png" height="36" alt="Logo" />
      <quillEditor v-model:content="content" ref="myTextEditor" />

      <table cellpadding="0" cellspacing="0">
        <tbody>
          <tr class="heading">
            <td colspan="1">{{ t('Payment_Method') }}</td>
            <td colspan="1"><input type="text" value="Check" /></td>
          </tr>
          <tr class="heading">
            <td>{{ t('Item') }}</td>
            <td>{{ t('Unit_Cost') }}</td>
            <td>{{ t('Quantity') }}</td>
            <td>{{ t('Price') }}</td>
            <td class="d-print-none">{{ t('actions') }}</td>
          </tr>
          <tr v-for="(item, index) in items" :key="index" class="item">
            <td><input v-model="item.description" /></td>
            <td><input type="number" v-model.number="item.price" /></td>
            <td><input type="number" v-model.number="item.quantity" /></td>
            <td>{{ formatCurrency(item.price * item.quantity) }}</td>
            <td>
              <v-icon @click="removeRow(index)" class="d-print-none">mdi-delete</v-icon>
            </td>
          </tr>
          <tr>
            <td colspan="4">
              <v-icon @click="addRow" class="d-print-none">mdi-plus</v-icon>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="total"> Total: {{ formatCurrency(total) }} <input type="text" value="MAD" size="2" /> </p>
    </div>
</template>

<script setup lang="ts">
import QuillEditor from '@/components/QuillEditor.vue';
import InvoiceService from "@/services/InvoiceService";
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { currency as formatCurrency } from '@/utilities/MyUtilities';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();

const myTextEditor = ref<InstanceType<typeof QuillEditor> | null>(null);
const showAlert = ref(false);
const templateSaved = ref(false);
const busy = ref(false);
const content = ref("");

const items = ref([
  { description: "Chronic redness in the eyes", quantity: 1, price: 1500 },
  { description: "Operation", quantity: 1, price: 5000 },
  { description: "Ear Ringing or tinnitus", quantity: 1, price: 3500 }
]);

onMounted(async () => {
  if (myTextEditor.value) {
    busy.value = true;
    try {
      if (!userStore.superUser) throw new Error("User not authenticated");
      const serverTemplate = await InvoiceService.fetchTemplate();
      const deltaObject = JSON.parse(serverTemplate);
      myTextEditor.value.editor.setContents(deltaObject);
    } catch (err) {
      console.error(err);
    } finally {
      busy.value = false;
    }
  }
});

async function saveEditorContents() {
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    const editorContents = myTextEditor.value?.editor?.getContents();
    const jsonData = JSON.stringify(editorContents);
    await InvoiceService.saveTemplate(jsonData);
    templateSaved.value = true;
    showAlert.value = true;
    setTimeout(() => { showAlert.value = false; }, 5000);
  } catch (err) {
    console.log("Failed to save", err);
    templateSaved.value = false;
    showAlert.value = true;
  }
}

function showToolBar() {
  appStore.setIsToolBarVisible(true);
}

function print() {
  appStore.setIsToolBarVisible(false);
  // The drawer logic was here, but it's better handled in the App.vue or a layout component
  window.print();
}

function addRow() {
  items.value.push({ description: "", quantity: 1, price: 0 });
}

function removeRow(index: number) {
  if (index >= 0) {
    items.value.splice(index, 1);
  }
}

const total = computed(() => {
  return items.value.reduce((acc, item) => acc + item.price * item.quantity, 0);
});


</script>

<style lang="scss" scoped>

.fixedTopRight{
  position: absolute ;
  top:0;
  right:0;
  z-index: 6;
}

.v-text-field {
  font-size: medium;
}

.invoice-box {
  margin: auto;
  padding: 30px;
  border: 1px solid #eee;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
  font-size: 16px;
  line-height: 24px;
  font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif;
  color: #555;
  background-color: whitesmoke;
}

.invoice-box table {
  width: 100%;
  line-height: inherit;
  text-align: left;
}

.invoice-box table td {
  padding: 5px;
  vertical-align: top;
}

.invoice-box table tr td:nth-child(n + 2) {
  text-align: right;
}

.invoice-box table tr.top table td {
  padding-bottom: 20px;
}

.invoice-box table tr.top table td.title {
  font-size: 45px;
  line-height: 45px;
  color: #333;
}

.invoice-box table tr.information table td {
  padding-bottom: 40px;
}

.invoice-box table tr.heading td {
  background: #eee;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
}

.invoice-box table tr.details td {
  padding-bottom: 20px;
}

.invoice-box table tr.item td {
  border-bottom: 1px solid #eee;
}

.invoice-box table tr.item.last td {
  border-bottom: none;
}

.invoice-box table tr.item input {
  padding-left: 5px;
}

.invoice-box table tr.item td:first-child input {
  margin-left: -5px;
  width: 100%;
}

.invoice-box table tr.total td:nth-child(2) {
  border-top: 2px solid #eee;
  font-weight: bold;
}

.total {
  text-align: right;
  border-top: 2px solid #eee;
  font-weight: bold;
}

.invoice-box input[type="number"] {
  width: 60px;
}

@media only screen and (max-width: 600px) {
  .invoice-box table tr.top table td {
    width: 100%;
    display: block;
    text-align: center;
  }

  .invoice-box table tr.information table td {
    width: 100%;
    display: block;
    text-align: center;
  }
}

.rtl {
  direction: rtl;
  font-family: Tahoma, "Helvetica Neue", "Helvetica", Helvetica, Arial,
    sans-serif;
}

.rtl table {
  text-align: right;
}

.rtl table tr td:nth-child(2) {
  text-align: left;
}
</style>
