<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { coordinator as defaultCoordinator } from "@uwdata/mosaic-core";
  import { onMount } from "svelte";

  import EmbeddingAtlas from "./lib/EmbeddingAtlas.svelte";
  import Spinner from "./lib/Spinner.svelte";

  import type { DataColumns, DataSource } from "./data_source.js";
  import type { EmbeddingAtlasState } from "./lib/api.js";
  import { systemDarkMode } from "./lib/dark_mode_store.js";
  import { type ExportFormat } from "./lib/mosaic_exporter.js";
  import { debounce } from "./lib/utils.js";
  import { getQueryPayload, setQueryPayload } from "./query_payload.js";

  const coordinator = defaultCoordinator();

  interface Props {
    dataSource: DataSource;
  }

  let { dataSource }: Props = $props();

  let ready = $state(false);
  let error = $state(false);
  let status = $state("Loading...");
  let initialState: any | null = $state.raw(null);
  let columns: DataColumns | null = $state.raw(null);

  onMount(async () => {
    try {
      initialState = await getQueryPayload();
      status = "Initializing database...";
      columns = await dataSource.initializeCoordinator(coordinator, "dataset", (s) => {
        status = s;
      });
      ready = true;
    } catch (e: any) {
      error = true;
      status = e.message;
      return;
    }
  });

  async function onExportSelection(predicate: string | null, format: ExportFormat) {
    if (dataSource.downloadSelection) {
      await dataSource.downloadSelection(predicate, format);
    }
  }

  async function onDownloadArchive() {
    if (dataSource.downloadArchive) {
      await dataSource.downloadArchive();
    }
  }

  function onStateChange(state: EmbeddingAtlasState) {
    setQueryPayload({ ...state, predicate: undefined });
  }
</script>

<div class="fixed left-0 right-0 top-0 bottom-0">
  {#if ready && columns != null}
    <EmbeddingAtlas
      coordinator={coordinator}
      table="dataset"
      initialState={initialState}
      idColumn={columns.id}
      textColumn={columns.text}
      projectionColumns={columns.embedding}
      neighborsColumn={columns.neighbors}
      cache={dataSource.cache}
      automaticLabels={true}
      onExportApplication={dataSource.downloadArchive ? onDownloadArchive : null}
      onExportSelection={dataSource.downloadSelection ? onExportSelection : null}
      onStateChange={debounce(onStateChange, 200)}
    />
  {:else}
    <div
      class="w-full h-full grid place-content-center select-none text-slate-800 bg-slate-200 dark:text-slate-200 dark:bg-slate-800"
      class:dark={$systemDarkMode}
    >
      {#if error}
        <div class="text-red-600" style:max-width="36rem">{status}</div>
      {:else}
        <div class="w-72">
          <Spinner status={status} />
        </div>
      {/if}
    </div>
  {/if}
</div>
