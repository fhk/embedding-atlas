<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import EmbeddingViewDemo from "./EmbeddingViewDemo.svelte";
  import EmbeddingViewMosaicDemo from "./EmbeddingViewMosaicDemo.svelte";

  let testView: "EmbeddingView" | "EmbeddingViewMosaic" = $state("EmbeddingView");
</script>

<div style="padding-bottom:8px">
  <label style="display:flex;align-items:center;gap:4px">
    Component:
    <select bind:value={testView}>
      <option value="EmbeddingView">EmbeddingView</option>
      <option value="EmbeddingViewMosaic">EmbeddingViewMosaic</option>
    </select>
  </label>
</div>

{#if testView == "EmbeddingViewMosaic"}
  <EmbeddingViewMosaicDemo />
{:else if testView == "EmbeddingView"}
  <EmbeddingViewDemo />
{/if}

<style>
  :global(body) {
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Open Sans",
      "Helvetica Neue",
      sans-serif;
    font-size: 14px;
  }
</style>
