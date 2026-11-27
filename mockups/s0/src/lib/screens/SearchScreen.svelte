<script>
  import { searchResults } from '../sample.js';
  let { go } = $props();
  let q = $state('うらら');
</script>

<section class="space-y-3">
  <div class="relative">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
    <input
      class="w-full h-11 pl-9 pr-9 rounded-xl bg-white border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
      placeholder="カード名で検索（日本語）"
      bind:value={q}
    />
    {#if q}
      <button class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-[11px]" onclick={() => (q = '')}>✕</button>
    {/if}
  </div>

  <div class="flex items-center justify-between px-1">
    <p class="text-[11px] text-slate-500">「{q}」の検索結果 3 件</p>
    <button class="text-[11px] text-slate-500 underline underline-offset-2">手入力で登録</button>
  </div>

  <ul class="space-y-2">
    {#each searchResults as r (r.name)}
      <li class="rounded-xl bg-white border border-slate-200 p-3">
        <p class="text-[13px] font-bold text-slate-900">{r.name}</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          {#each r.codes as c (c)}
            <button
              class="h-7 px-2 rounded-lg border text-[10px] font-medium"
              class:border-slate-200={c === '—'}
              class:bg-slate-50={c === '—'}
              class:text-slate-400={c === '—'}
              class:border-emerald-300={c !== '—'}
              class:bg-emerald-50={c !== '—'}
              class:text-emerald-800={c !== '—'}
              onclick={() => go('wish')}
            >
              {c}
            </button>
          {/each}
        </div>
      </li>
    {/each}
  </ul>

  <div class="rounded-xl bg-amber-50 border border-amber-200 p-3">
    <p class="text-[11px] font-bold text-amber-900">この画面の確認ポイント（S0）</p>
    <ul class="mt-1 text-[11px] text-amber-900 list-disc pl-4 space-y-0.5">
      <li>型番を選ぶ操作が小さすぎないか（タップ領域 44px 未満）</li>
      <li>同じカードの再録が並んだとき、どれを選ぶか迷わないか</li>
      <li>手入力への逃げ道が見つけられるか</li>
    </ul>
  </div>
</section>
