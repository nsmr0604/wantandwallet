<script>
  let { go } = $props();

  const rows = [
    { label: '月次予算', value: '¥10,000', to: 'budget' },
    { label: 'カテゴリ配分', value: '新弾 / シングル / グッズ / その他', to: 'budget' },
    { label: '店舗', value: '3 件', to: 'patrol' },
    { label: '新弾の取り込み', value: '最終 2026/11/27', to: 'releases' },
  ];
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100">
    {#each rows as r (r.label)}
      <button class="w-full px-4 py-3 flex items-center gap-3 text-left" onclick={() => go(r.to)}>
        <span class="text-[12px] font-medium text-slate-800">{r.label}</span>
        <span class="ml-auto text-[11px] text-slate-500 truncate max-w-[55%] text-right">{r.value}</span>
        <span class="text-slate-300">›</span>
      </button>
    {/each}
  </div>

  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] font-bold text-slate-500">データ</p>
    <p class="mt-1 text-[11px] text-slate-600">最終エクスポート: 未実施</p>
    <p class="text-[10px] text-rose-600 mt-0.5">iOS では長期間使わないとデータが消えることがあります</p>
    <div class="mt-2 grid grid-cols-2 gap-2">
      <button class="h-10 rounded-lg bg-slate-900 text-white text-[11px] font-bold">エクスポート</button>
      <button class="h-10 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-600">インポート</button>
    </div>
  </div>

  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] font-bold text-slate-500">このアプリについて</p>
    <p class="mt-1 text-[10px] text-slate-500 leading-relaxed">
      wantandwallet 0.0.0（S0 モック）<br />
      データは端末内のみ。外部送信なし。<br />
      カードデータ: yaml-yugi / 新弾: 公式商品ページ
    </p>
  </div>
</section>
