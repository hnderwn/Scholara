const DB_NAME = 'ScholaraOfflineDB';
const DB_VERSION = 2;
const STORES = {
  MATERIALS: 'materials',
  RESULTS_QUEUE: 'results_queue',
  QUESTIONS_CACHE: 'questions_cache',
};

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.MATERIALS)) {
        db.createObjectStore(STORES.MATERIALS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.RESULTS_QUEUE)) {
        db.createObjectStore(STORES.RESULTS_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.QUESTIONS_CACHE)) {
        db.createObjectStore(STORES.QUESTIONS_CACHE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const localDB = {
  // Materials (Dictionary)
  async saveMaterials(items) {
    const db = await openDB();
    const tx = db.transaction(STORES.MATERIALS, 'readwrite');
    const store = tx.objectStore(STORES.MATERIALS);
    items.forEach((item) => store.put(item));
    return new Promise((resolve) => (tx.oncomplete = () => resolve()));
  },
  async getMaterials() {
    const db = await openDB();
    const tx = db.transaction(STORES.MATERIALS, 'readonly');
    const store = tx.objectStore(STORES.MATERIALS);
    const request = store.getAll();
    return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)));
  },

  // Questions Cache (for Exams)
  async saveQuestions(items) {
    const db = await openDB();
    const tx = db.transaction(STORES.QUESTIONS_CACHE, 'readwrite');
    const store = tx.objectStore(STORES.QUESTIONS_CACHE);
    items.forEach((item) => store.put(item));
    return new Promise((resolve) => (tx.oncomplete = () => resolve()));
  },
  async getQuestions() {
    const db = await openDB();
    const tx = db.transaction(STORES.QUESTIONS_CACHE, 'readonly');
    const store = tx.objectStore(STORES.QUESTIONS_CACHE);
    const request = store.getAll();
    return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)));
  },

  // Results Queue
  async queueResult(result) {
    const db = await openDB();
    const tx = db.transaction(STORES.RESULTS_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.RESULTS_QUEUE);
    store.add({ ...result, created_at: new Date().toISOString(), status: 'pending' });
    return new Promise((resolve) => (tx.oncomplete = () => resolve()));
  },
  async getQueuedResults() {
    const db = await openDB();
    const tx = db.transaction(STORES.RESULTS_QUEUE, 'readonly');
    const store = tx.objectStore(STORES.RESULTS_QUEUE);
    const request = store.getAll();
    return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)));
  },
  async removeQueuedResult(id) {
    const db = await openDB();
    const tx = db.transaction(STORES.RESULTS_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.RESULTS_QUEUE);
    store.delete(id);
    return new Promise((resolve) => (tx.oncomplete = () => resolve()));
  },
};
