// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type * as Functions from "./worker_functions.js";

let global_worker: Promise<Worker> | null = null;
let callbacks = new Map<string, (data: any) => void>();
function worker(): Promise<Worker> {
  if (global_worker == null) {
    global_worker = new Promise((resolve, _) => {
      let w = new Worker(new URL("./clustering.worker.js", import.meta.url), { type: "module" });
      w.onmessage = (msg) => {
        if (msg.data.ready) {
          resolve(w);
          return;
        }
        if (msg.data.id != null) {
          let cb = callbacks.get(msg.data.id);
          if (cb != null) {
            callbacks.delete(msg.data.id);
            cb(msg.data);
          }
        }
      };
    });
  }
  return global_worker;
}

function invokeWorker(name: string, payload: any, transfer: Transferable[] = []): Promise<any> {
  return new Promise((resolve, _) => {
    worker().then((w) => {
      let id = new Date().getTime().toString() + "-" + Math.random().toString();
      callbacks.set(id, (data) => {
        resolve(data.payload);
      });
      w.postMessage({ id: id, name: name, payload: payload }, transfer);
    });
  });
}

type PromiseReturn<F extends (...args: any) => any> = (...args: Parameters<F>) => Promise<ReturnType<F>>;

export let findClusters: PromiseReturn<typeof Functions.findClusters> = (density_map, width, height, options) => {
  return invokeWorker("findClusters", { density_map, width, height, options: options }, [density_map.buffer]);
};

export let dynamicLabelPlacement: PromiseReturn<typeof Functions.dynamicLabelPlacement> = (labels, options) => {
  return invokeWorker("dynamicLabelPlacement", { labels, options });
};
