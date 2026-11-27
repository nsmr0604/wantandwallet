<script>
  import { wishItems, stores, yen } from '../sample.js';
  let { go } = $props();

  let storeId = $state(1);
  let index = $state(0);
  let price = $state('1180');

  const item = $derived(wishItems[index % wishItems.length]);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

  const press = (k) => {
    if (k === '⌫') price = price.slice(0, -1);
    else if (k === '00') price = price === '' ? '0' : price + '00';
    else price = (price === '0' ? '' : price) + k;
  };

  const next = () => {
    index = (index + 1) % wishItems.length;
    price = '';
  };
</script>

<section class="space-y-3">
  <!-- 店舗選択 -->
  <div>
    <p class="text-[11px] font-bold text-slate-500 mb-1">いまいる店舗</p>
    <div class="flex gap-1.5 overflow-x-auto pb-1">
      {#each stores as s (s.id)}
        <button
          class="shrink-0 h-9 px-3 rounded-full border text-[11px] font-medium"
          class:bg-slate-900={storeId === s.id}
          class:text-white={storeId === s.id}
          class:border-slate-900={storeId === s.id}
          class:bg-white={storeId !== s.id}
          class:text-slate-600={storeId !== s.id}
          class:border-slate-200={storeId !== s.id}
          onclick={() => (storeId = s.id)}
        >
          {s.name}
        </button>
      {/each}
    </div>
  </div>

  <!-- 進捗 -->
  <div class="flex items-center gap-2 px-1">
    <div class="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
      <div class="h-full bg-emerald-500" style="width: {((index + 1) / wishItems.length) * 100}%"></div>
    </div>
    <span class="text-[10px] text-slate-500">{index + 1} / {wishItems.length}</span>
  </div>

  <!-- 対象カード -->
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[10px] text-slate-500">残り {item.wanted - item.bought} 枚</p>
    <p class="mt-0.5 text-[17px] font-bold text-slate-900 leading-snug">{item.name}</p>
    <div class="mt-1.5 flex items-center gap-2">
      <button class="h-7 px-2 rounded-md border border-slate-300 text-[10px] font-medium text-slate-600">
        レアリティ: 指定なし（任意）
      </button>
      <p class="ml-auto text-[11px] text-slate-500">目標 {yen(item.target)}</p>
    </div>
  </div>

  <!-- 価格表示 -->
  <div class="rounded-2xl bg-slate-900 text-white px-4 py-3 flex items-baseline justify-between">
    <span class="text-[11px] text-slate-300">価格</span>
    <span class="text-[34px] font-bold leading-none tracking-tight">
      <span class="text-[18px] font-medium text-slate-300 mr-0.5">¥</span>{price === '' ? '0' : Number(price).toLocaleString('ja-JP')}
    </span>
  </div>

  <!-- テンキー -->
  <div class="grid grid-cols-3 gap-2">
    {#each keys as k (k)}
      <button
        class="h-14 rounded-xl bg-white border border-slate-200 text-[18px] font-bold text-slate-800 active:bg-slate-100"
        onclick={() => press(k)}
      >
        {#if k === '⌫'}
          <span class="flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6H9l-6 6 6 6h11z" /><path d="m13 10 4 4M17 10l-4 4" />
            </svg>
          </span>
        {:else}
          {k}
        {/if}
      </button>
    {/each}
  </div>

  <div class="grid grid-cols-3 gap-2">
    <button class="col-span-1 h-12 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600" onclick={next}>
      在庫なし
    </button>
    <button class="col-span-2 h-12 rounded-xl bg-emerald-600 text-white text-[13px] font-bold active:bg-emerald-700" onclick={next}>
      保存して次へ
    </button>
  </div>

  <div class="rounded-xl bg-amber-50 border border-amber-200 p-3">
    <p class="text-[11px] font-bold text-amber-900">この画面の確認ポイント（S2 の予習）</p>
    <ul class="mt-1 text-[11px] text-amber-900 list-disc pl-4 space-y-0.5">
      <li>店頭で片手・10 秒以内に入力できるか</li>
      <li>「保存して次へ」が親指で届くか</li>
      <li>目標価格との比較がその場で分かるか（今は表示のみ）</li>
    </ul>
  </div>
</section>
