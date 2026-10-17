import { createHead } from '@unhead/vue';

// Single shared document-head manager. Views (and the app shell) contribute
// <head> tags reactively — title, description, Open Graph, canonical and
// JSON-LD — instead of each route reaching for document.title by hand. Unhead
// dedupes and restores tags across client-side navigation.
const head = createHead();

export default head;
