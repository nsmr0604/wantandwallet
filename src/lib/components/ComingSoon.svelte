<script lang="ts">
  interface Props {
    title: string;
    desc: string;
    points?: string[];
  }

  let { title, desc, points = [] }: Props = $props();
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[13px] font-bold text-slate-900">{title}</p>
    <p class="mt-1 text-[11px] text-slate-600 leading-relaxed">{desc}</p>
    {#if points.length}
      <ul class="mt-2 space-y-1">
        {#each points as point (point)}
          <li class="text-[11px] text-slate-500 flex gap-1.5">
            <span class="text-emerald-600">・</span><span>{point}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <p class="px-1 text-[10px] text-slate-400">
    S1 以降で実装します。画面設計は docs/07-wireframes-s0.md を参照。
  </p>
</section>
