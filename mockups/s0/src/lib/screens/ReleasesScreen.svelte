<script>
  import { releases } from '../sample.js';
  let { go } = $props();

  const upcoming = $derived(releases.filter((r) => r.days >= 0).sort((a, b) => a.days - b.days));
  const past = $derived(releases.filter((r) => r.days < 0));

  const d = (iso) => {
    const dt = new Date(iso + 'T00:00:00+09:00');
    return { m: dt.getMonth() + 1, day: dt.getDate(), w: '日月火水木金土'[dt.getDay()] };
  };
</script>

<section class="space-y-3">
  <div class="flex items-center justify-between px-1">
    <p class="text-[11px] font-bold text-slate-500">今後の新弾 {upcoming.length} 件</p>
    <button class="text-[11px] text-slate-500 underline underline-offset-2">手動で追加</button>
  </div>

  <ul class="space-y-2">
    {#each upcoming as r (r.name)}
      {@const dt = d(r.date)}
      <li class="rounded-2xl bg-white border border-slate-200 p-3">
        <div class="flex items-start gap-3">
          <div class="shrink-0 w-12 text-center">
            <p class="text-[9px] text-slate-500">{dt.m}月</p>
            <p class="text-[20px] font-bold text-slate-900 leading-none">{dt.day}</p>
            <p class="text-[9px] text-slate-500">{dt.w}</p>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[12px] font-bold text-slate-900 leading-snug">{r.name}</p>
            <p class="mt-0.5 text-[10px] text-slate-500">{r.kind}・{r.date.replaceAll('-', '/')}</p>
          </div>
          <span class="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
            あと {r.days} 日
          </span>
        </div>
      </li>
    {/each}
  </ul>

  <div>
    <p class="px-1 pb-1 text-[11px] font-bold text-slate-400">発売済み</p>
    <ul class="space-y-1.5">
      {#each past as r (r.name)}
        <li class="rounded-xl bg-slate-100 border border-slate-200 p-3 flex items-center gap-2 opacity-70">
          <span class="text-[11px] text-slate-600 truncate">{r.name}</span>
          <span class="ml-auto text-[10px] text-slate-500 shrink-0">{r.date}</span>
        </li>
      {/each}
    </ul>
  </div>

  <div class="rounded-xl bg-white border border-slate-200 p-3">
    <p class="text-[11px] font-bold text-slate-500">データ元</p>
    <p class="mt-1 text-[11px] text-slate-600 leading-relaxed">
      公式商品ページから月 1 回取り込み（最終: 2026/11/27）。取り込みに失敗した場合は前回の内容を保持します。
    </p>
    <button class="mt-2 h-8 px-3 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-600">いま更新する</button>
  </div>
</section>
