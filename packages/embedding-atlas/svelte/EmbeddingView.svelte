<script>
  import { onDestroy, onMount } from "svelte";

  import { EmbeddingView as Component } from "../dist/index.js";

  /** @type import("../dist/index.js").EmbeddingViewProps */
  let props = $props();

  /** @type {HTMLElement} */
  let container;

  onMount(() => {
    let component = new Component(container, props);

    $effect(() => {
      component.update(props);
    });

    onDestroy(() => {
      component.destroy();
    });
  });
</script>

<div bind:this={container} style:display="flex"></div>
