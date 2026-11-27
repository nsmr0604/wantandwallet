<script>
  import { releases, money } from '../sample.js';
  let { go } = $props();

  const upcoming = $derived(releases.filter((r) => r.days >= 0).sort((a, b) => a.days - b.days));
  const past = $derived(releases.filter((r) => r.days < 0));

  const d = (iso) => {
    const dt = new Date(iso + 'T00:00:00+09:00');
    return { m: dt.getMonth() + 1, day: dt.getDate(), w: '日月火水木金土'[dt.getDay()] };
  };

  const packEq = (r) => (r.msrpBox && r.packsPerBox ? Math.round(r.msrpBox / r.packsPerBox) : null);
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
            <p class="mt-0.5 text-[10px] text-slate-500">{r.kind}</p>
            <p class="mt-1 flex flex-wrap gap-x-2 text-[11px] text-slate-700">
              {#if r.msrpPack}<span class="whitespace-nowrap">1パック {money(r.msrpPack)}</span>{/if}
              {#if r.msrpBox}<span class="whitespace-nowrap">1BOX {money(r.msrpBox)}</span>{/if}
              {#if r.packsPerBox}<span class="whitespace-nowrap text-slate-500">（{r.packsPerBox}パック入り）</span>{/if}
            </p>
            {#if packEq(r)}
              <p class="text-[9px] text-slate-400">1パック換算 {money(packEq(r))}・{r.cardsPerPack}枚入り</p>
            {/if}
            {#if r.preorderAt}
              <p class="mt-1 text-[10px] text-emerald-700">予約開始 {r.preorderAt.replaceAll('-', '/')}</p>
            {/if}
          </div>
          <div class="shrink-0 text-right">
            <span class="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">あと {r.days} 日</span>
            <button class="mt-2 block w-full h-8 px-2 rounded-lg border border-emerald-600 text-[10px] font-bold text-emerald-700" onclick={() => go('purchase')}>
              予約する
            </button>
          </div>
        </div>
      </li>
    {/each}
  </ul>

  <div class="rounded-2xl bg-white border border-slate-200 p-3">
    <p class="text-[11px] font-bold text-slate-500">リマインダー</p>
    <ul class="mt-1.5 space-y-1.5">
      <li class="flex items-center gap-2 text-[11px] text-slate-700">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        12/12 予約開始を確認（PRIDE AND SOUL）
      </li>
      <li class="flex items-center gap-2 text-[11px] text-slate-700">
        <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        12/19 発売（QUARTER CENTURY CHRONICLE）
      </li>
    </ul>
    <p class="mt-1.5 text-[10px] text-slate-400">設定の「何日前」で自動生成。通知は将来対応。</p>
  </div>

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
      公式商品ページから月 1 回取り込み（最終: 2026/11/27）。定価・パック数が取れない場合は手動で修正できます。
    </p>
    <button class="mt-2 h-8 px-3 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-600">いま更新する</button>
  </div>
</section>
