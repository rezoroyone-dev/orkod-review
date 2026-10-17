import AppConfigs from "@/AppConfigs";
import { TreatmentStatusEnum } from "@/enumerators/TreatmentStatusEnum";
import Diagnostic from '@/interfaces/Diagnostic';
import Nature from '@/interfaces/SicknessNature';
import Treatment from '@/interfaces/Treatment';
import Healer from '@/models/Healer';
import AuthenticationService from '@/services/AuthenticationService';
import HealerService from '@/services/HealerService';
import NatureService from "@/services/SicknessNatureService";
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { isValidDate, possibleTimeFormat } from '@/utilities/dateTime';
import Language from '@/utilities/Language';
import { VForm } from '@/utilities/Types';
import axios from "axios";
import { format, parse } from 'date-fns';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from './useConfirmDialog';
import { useMessageBox } from './useMessageBox';

export interface IPDFFileInfo {
  lang: string;
  fileName: string;
  url?: string;
  pageNumber?: number;
  numPages?: number;
}

export interface ICanvasSize {
    width: number;
    height: number;
}

export function useTreatment() {
    const { t } = useI18n();
    
    // State from TreatmentMixin
    const loading = ref(false);
    const errored = ref(false);
    const statusList = ref([TreatmentStatusEnum.Status.OPEN, TreatmentStatusEnum.Status.CLOSED]);
    const natureList = ref<Nature[]>([]);
    const diagnosticList = ref<Diagnostic[]>([]);
    const healers = ref<Healer[]>([]);
    const treatmentModes = ref([{id: 1, mode: 'Local'}, {id: 2, mode: 'Remote'}]);
    const dialog = ref(false);

    // MyPDFViewer related state
    const pdfFileInfo = reactive<IPDFFileInfo>({ lang: '', fileName: '' });
    const showMyPDFViewer = ref(false);

    const getNow = (): string => {
        return format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");
    };
    const getCurrentTime = (): string => {
        return format(new Date(), 'HH:mm');
    };

    const defaultItem: Treatment = {
        id: undefined,
        nature: 0,
        startDate: getNow(),
        startTime: getCurrentTime(),
        diagnostic: 0,
        healers: [] as Healer[],
        healingFrequency: "",
        protocol: "",
        mode: 1,
        totalCost: 0,
        payed: 0,
        status: TreatmentStatusEnum.Status.OPEN,
        personID: -1,
        comment: ''
    };

    const colWidth = ref("5%");
    const detailsDialog = ref(false);
    const headers = ref([
        {
            title: "Nature",
            align: 'start' as const,
            sortable: true,
            key: 'nature',
            filterable: true,
            width: "15%",
        },
        {
            title: "Diagnostic",
            key: 'diagnostic',
            align: 'start' as const,
            width: "15%",
            sortable: true,
            filterable: true
        },
        {
            title: "Healers",
            key: 'healers',
            align: 'start' as const,
            width: "10%",
            sortable: false,
            filterable: false
        },
        {
            title: "Date",
            key: 'startDate',
            align: 'start' as const,
            width: "10%",
            sortable: true,
            filterable: true
        },
        {
            title: "Time",
            key: 'startTime',
            align: 'start' as const,
            width: colWidth.value,
            sortable: true,
            filterable: true
        },
        {
            title: "TotalCost",
            key: 'totalCost',
            align: 'start' as const,
            sortable: true,
            width: colWidth.value
        },
        {
            title: "payed",
            key: 'payed',
            align: 'start' as const,
            sortable: true,
            width: colWidth.value
        },
        {
            title: "Rest",
            key: 'rest',
            align: 'start' as const,
            sortable: false,
            width: colWidth.value
        },
        {
            title: "Status",
            key: 'status',
            align: 'start' as const,
            width: colWidth.value,
            sortable: true,
            filterable: true
        },
        {
            title: "Actions",
            key: 'actions',
            align: 'start' as const,
            sortable: false,
            width: "8%"
        }
    ]);
    const treatments = ref<Treatment[]>([]);
    const editedIndex = ref(-1);
    const editedItem = reactive<Treatment>({ ...defaultItem });

    const treatmentDetailsItem = ref<Treatment>({ ...defaultItem });
    const showTreatmentDetails = ref(false);

    // Composable replacements for mixins
    const { msgBox, showMsgBox: showMsgBoxComposable, closeMsgBox } = useMessageBox();
    const { confirmDialogContents, showConfirmDialog: showConfirmDialogComposable, closeConfirmDialog } = useConfirmDialog();

    // Pinia Stores
    const appStore = useAppStore();
    const userStore = useUserStore();

    // Computed properties
    const formTitle = computed(() => {
        return editedIndex.value === -1 ? t('New_Treatment') : t('Modify_Treatment');
    });

    const activePerson = computed(() => appStore.activePerson);
    const activeTreatment = computed(() => appStore.activeTreatment);

    const form = ref<VForm | null>(null);

    const locale = computed(() => appStore.locale); // Assuming locale is directly in appStore
    const activeLang = computed(() => Language.getActiveLang(locale.value));

    // Methods
    const startMyPDFViewer = () => {
        if (!editedItem.protocol) {
            showMsgBox("Information", "No protocol available for this diagnostic");
            return;
        }
        pdfFileInfo.lang = locale.value;
        pdfFileInfo.fileName = editedItem.protocol;
        console.log('DEBUG: startMyPDFViewer - pdfFileInfo:', JSON.stringify(pdfFileInfo));
        showMyPDFViewer.value = true;
    };

    const close = () => {
        dialog.value = false;
        setTimeout(() => {
            Object.assign(editedItem, defaultItem);
            editedIndex.value = -1;
        }, 300);
    };

    const showMsgBox = (title: string, body: any): void => {
        if (body && typeof (body) !== "string" && body.response && body.response.data) {
            body += "\n\r" + body.response.data;
        }
        showMsgBoxComposable(title, body);
    };

    const showConfirmDialog = (title: string, body: string, callBackFunction: () => void, cancelCallBackFunction: () => void): void => {
        showConfirmDialogComposable(title, body, callBackFunction, cancelCallBackFunction);
    };

    // Default treatment status to fetch (can be 'open' or 'closed')
    const treatmentStatus = ref<string>('open');

    const getTreatmentList = async (personID: number, status?: string) => {
        if (!userStore.superUser || userStore.superUser.id === -1) {
            return;
        }
        const statusToFetch = status || treatmentStatus.value;
        loading.value = true;
        const action = '/treatmentList/' + statusToFetch + '/';
        const url = AppConfigs.getServerURL() + action + personID;
        const config = AuthenticationService.getAxiosConfig(userStore.superUser);
        try {
            const response = await axios.get(url, config);
            treatments.value = Array.from(response.data);
        } catch (error) {
            errored.value = true;
            console.error(error);
        } finally {
            loading.value = false;
        }
    };

    // Function to set which status to fetch (call this from component)
    const setTreatmentStatus = (status: string) => {
        treatmentStatus.value = status;
    };

    const save = async () => {
        const validationResult = await form.value?.validate();
        if (validationResult && validationResult.valid) {
            let action = '';
            const treatment = editedItem;

            if (editedIndex.value > -1) {
                action = '/updateTreatment';
            } else {
                action = '/createTreatment';
            }

            if (activePerson.value && activePerson.value.id !== undefined && activePerson.value.id >= 0) {
                treatment.personID = activePerson.value.id;
            } else {
                console.error('activePerson.ID must be a valid Id');
                return;
            }

            loading.value = true;
            const url = AppConfigs.getServerURL() + action;
            const config = AuthenticationService.getAxiosConfig(userStore.superUser);
            try {
                const response = await axios.post(url, treatment, config);
                const savedTreatment: Treatment = response.data;

                appStore.activeTreatment = savedTreatment;
            } catch (error) {
                errored.value = true;
                console.error(error);
            } finally {
                loading.value = false;
                close();
            }
        }
    };

    const validateNumbers = (v: number | string): (string | boolean)[] => {
        const msg: string = "item is not a valid number";
        if (v == undefined || typeof v == "string") {
            return [msg];
        }
        if (typeof v == "number") {
            if (editedItem.payed > editedItem.totalCost) {
                return ["Payed value should never be greater than Total cost"];
            } else {
                return [(v >= 0) || msg];
            }
        }
        return [msg];
    };

    const showDetailsDialog = (treatment: Treatment) => {
        console.log('DEBUG: showDetailsDialog called with:', JSON.stringify(treatment));
        treatmentDetailsItem.value = { ...treatment };
        showTreatmentDetails.value = true;
    };

    const updateContents = async () => {
        if (!userStore.superUser || userStore.superUser.id === -1) {
            return;
        }
        translateContents();
        const allHealers = await HealerService.getAllHealers();
        if (allHealers !== undefined && allHealers.length > 0) {
            healers.value = allHealers;
        }
    };

    const editItem = (item: Treatment) => {
        try {
            const index = treatments.value.indexOf(item);
            if (index == -1) {
                throw Error("Bad index in useTreatment.ts");
            }
            editedIndex.value = index;
            Object.assign(editedItem, item);
            dialog.value = true;
        } catch (error) {
            showMsgBox("Error", error);
        }
    };

    const confirmDeleteItem = (item: Treatment) => {
        showConfirmDialog("Confirmation", t('ARE_YOU_SURE_DELETE'), () => deleteItem(item), () => { });
    };

    const deleteItem = async (treatment: Treatment) => {
        closeConfirmDialog();
        const index = treatments.value.indexOf(treatment);
        if (index == -1) {
            throw Error("Bad index in useTreatment.ts");
        }

        if (treatment.id === undefined || treatment.id < 0) {
            return;
        }

        loading.value = true;
        const action = '/deleteTreatment/';
        const url = AppConfigs.getServerURL() + action + treatment.id;
        const config = AuthenticationService.getAxiosConfig(userStore.superUser);
        try {
            await axios.delete(url, config);
            if (treatments.value.length > 0) {
                treatments.value.splice(index, 1);
            }
        } catch (error) {
            errored.value = true;
            showMsgBox("Error:Failed to delete Treatment", error);
        } finally {
            loading.value = false;
        }
    };

    const editedItemStartDate = computed({
        get() {
            const startDate = editedItem.startDate;
            if (startDate == undefined || startDate == null || (typeof startDate === 'string' && startDate.trim() == '')) {
                return '';
            }
            let tmpDate = '';
            if (isValidDate(startDate, possibleTimeFormat)) {
                // Parse using the first matching format from possibleTimeFormat
                for (const fmt of possibleTimeFormat) {
                    const dfnsFmt = fmt.replace(/YYYY/g, 'yyyy').replace(/DD/g, 'dd').replace(/Z/g, 'xxx');
                    const parsed = parse(startDate, dfnsFmt, new Date());
                    if (!isNaN(parsed.getTime())) {
                        tmpDate = format(parsed, 'dd-MM-yyyy');
                        break;
                    }
                }
            }
            return tmpDate;
        },
        set(startDate: string) {
            if (startDate === undefined || startDate === null || startDate.trim() === '') {
                return;
            }
            if (isValidDate(startDate, 'DD-MM-YYYY')) {
                const parsed = parse(startDate, 'dd-MM-yyyy', new Date());
                editedItem.startDate = format(parsed, 'yyyy-MM-dd') as any;
            }
        }
    });

    const editedItemStartTime = computed({
        get() {
            const startTime = editedItem.startTime;
            if (startTime === undefined || startTime === null || startTime.trim() === '') {
                return '';
            }
            let tmpTime = '';
            if (isValidDate(startTime, 'HH:mm')) {
                const parsed = parse(startTime, 'HH:mm', new Date());
                tmpTime = format(parsed, 'HH:mm');
            }
            return tmpTime;
        },
        set(startTime: string) {
            if (startTime === undefined || startTime === null || startTime.trim() === '') {
                return;
            }
            if (isValidDate(startTime, 'HH:mm')) {
                const parsed = parse(startTime, 'HH:mm', new Date());
                editedItem.startTime = format(parsed, 'HH:mm');
            }
        }
    });

    const getNatureDescription = (natureID: number): string => {
        return NatureService.getNatureDescription(natureID, activeLang.value);
    };

    const getDiagnosticList = (natureID: number) => {
        return NatureService.getDiagnosticList(natureID, activeLang.value);
    };

    const getDiagnosticDescription = (natureID: number, diagnosticID: number): string => {
        return NatureService.getDiagnosticDescription(natureID, diagnosticID, activeLang.value);
    };

    const translateContents = () => {
        natureList.value = NatureService.getSickNatures(activeLang.value);
        headers.value.forEach((item: any) => { 
            item.title = t(item.key);
        });
    };

    // Watchers
    watch(activePerson, (val) => {
        if (val != null && val.id != undefined && val.id > -1) {
            getTreatmentList(val.id);
        }
    });

    watch(activeTreatment, (val) => {
        if (val != undefined && val.id != undefined) {
            const matchesStatus = val.status?.toLowerCase() === treatmentStatus.value.toLowerCase();
            // Check if treatment already exists in the list
            const existingIndex = treatments.value.findIndex(t => t.id === val.id);
            
            if (matchesStatus) {
                if (existingIndex === -1) {
                    treatments.value.push(val);
                } else {
                    // Update existing treatment
                    treatments.value[existingIndex] = val;
                }
            } else if (existingIndex !== -1) {
                treatments.value.splice(existingIndex, 1);
            }
        }
    });

    watch(locale, () => {
        translateContents();
    });

    watch(() => editedItem.nature, (val) => {
        editedItem.healingFrequency = "";
        editedItem.protocol = "";
        diagnosticList.value = [];
        const diagList: Diagnostic[] = NatureService.getDiagnosticList(val, activeLang.value);
        diagnosticList.value = diagList;
    });

    watch(() => editedItem.diagnostic, (val) => {
        const healingFrequency: string = NatureService.getHealingFrequency(diagnosticList.value, val);
        const protocol: string = NatureService.getProtocol(diagnosticList.value, val);
        editedItem.healingFrequency = healingFrequency;
        editedItem.protocol = protocol;
    });

    watch(dialog, (val) => {
        val || close();
    });

    // onMounted
    onMounted(async () => {
        if (activePerson.value && activePerson.value.id !== undefined && activePerson.value.id > -1) {
            getTreatmentList(activePerson.value.id);
        }
        await updateContents();
    });

    // Return everything needed by the component
    return {
        loading,
        errored,
        statusList,
        natureList,
        diagnosticList,
        healers,
        treatmentModes,
        dialog,
        pdfFileInfo,
        showMyPDFViewer,
        colWidth,
        detailsDialog,
        headers,
        treatments,
        editedIndex,
        editedItem,
        treatmentDetailsItem,
        showTreatmentDetails,
        msgBox,
        showMsgBox,
        closeMsgBox,
        confirmDialogContents,
        showConfirmDialog,
        closeConfirmDialog,
        formTitle,
        activePerson,
        activeTreatment,
        form,
        locale,
        activeLang,
        getNow,
        getCurrentTime,
        startMyPDFViewer,
        close,
        getTreatmentList,
        setTreatmentStatus,
        save,
        validateNumbers,
        showDetailsDialog,
        updateContents,
        editItem,
        confirmDeleteItem,
        deleteItem,
        editedItemStartDate,
        editedItemStartTime,
        getNatureDescription,
        getDiagnosticList,
        getDiagnosticDescription,
        translateContents,
        isValidDate,
    };
}
