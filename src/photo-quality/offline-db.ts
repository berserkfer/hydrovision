/**
 * Cola local de observaciones pendientes de sincronizar — IndexedDB nativo, sin dependencias
 * nuevas. Es la pieza que hace que "sin conexión" sea literal (Tarea 3): toda observación se
 * guarda aquí primero, siempre, y desde aquí se sincroniza al servidor en cuanto hay señal.
 * Solo se ejecuta en el navegador — nunca se importa en código de servidor.
 */

import type { PhotoObservationInput } from "./photo-observation.types";

const DB_NAME = "hydrovision-photo-quality";
const DB_VERSION = 1;
const STORE_NAME = "pending-observations";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no disponible en este entorno"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueObservationLocally(input: PhotoObservationInput): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(input);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listQueuedObservations(): Promise<PhotoObservationInput[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as PhotoObservationInput[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedObservation(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
