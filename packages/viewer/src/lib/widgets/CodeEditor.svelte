<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { untrack } from "svelte";

  import { createEditor } from "prism-code-editor";
  import { defaultCommands } from "prism-code-editor/commands";

  import "prism-code-editor/prism/languages/json";
  import "prism-code-editor/prism/languages/sql";

  import { Context } from "../contexts.js";

  interface Props {
    value?: string | null;
    onChange?: (value: string) => void;
    language?: "json" | "sql" | null;
    className?: string | null;
  }

  let { value, onChange, language, className }: Props = $props();

  let darkMode = Context.darkMode;

  let container: HTMLDivElement;

  $effect(() => {
    if (container == null) {
      return;
    }

    let editor = createEditor(
      container,
      {
        language: language ?? "json",
        value: untrack(() => value ?? ""),
        lineNumbers: false,
        onUpdate(value) {
          onChange?.(value);
        },
      },
      defaultCommands(),
    );

    $effect(() => {
      if (value !== editor.value) {
        editor.setOptions({ value: value ?? "" });
      }
    });

    return () => {
      editor.remove();
    };
  });
</script>

<div
  class="h-64 rounded-md border border-slate-200 dark:border-slate-600 overflow-hidden {$darkMode
    ? 'code-editor-dark'
    : 'code-editor-light'} {className ?? ''}"
>
  <div bind:this={container} class="w-full h-full grid"></div>
</div>
