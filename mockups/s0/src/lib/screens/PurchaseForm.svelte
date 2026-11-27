<script>
  import { shop, saveDraft, wishNames, productOptions, selectProduct, recalcSealed, setSealedMode } from '../store.svelte.js';
  import { money } from '../sample.js';

  let { go } = $props();

  const draft = $derived(shop.draft);
  const kind = $derived(draft?.itemType === 'sealed' ? 'sealed' : 'single');
  const products = $derived(productOptions());
  const mode = $derived(draft?.unitMode || 'pack');
  const qty = $derived(Number(draft?.quantity) || 0);
  const packsPerBox = $derived(Number(draft?.packsPerBox) || 30);
  const totalPacks = $derived(mode === 'box' ? qty * packsPerBox : qty);
  const sealedTotal = $derived(mode === 'box' ? (draft?.msrpBox || 0) * qty : (draft?.msrpPack || 0) * qty);
  // 遊戯王の日などの参加条件（税込 ¥1,000 以上）を満たす最小パック数
  const minPacks = $derived(draft?.msrpPack ? Math.ceil(1000 / draft.msrpPack) : 0);

  const setKind = (k) => {
    if (!draft) return;
    if (k === 'single') {
      draft.itemType = 'card';
      draft.unit = 'single';
      draft.category = 'シングル';
      draft.name = '';
      draft.unitPrice = 0;
      draft.unitMode = 'pack';
      // シングルに予約は無い
      draft.status = 'bought';
      draft.reservedAt = '';
      draft.expectedAt = '';
    } else {
      draft.itemType = 'sealed';
      draft.unit = 'pack';
      draft.unitMode = 'pack';
      draft.quantity = 1;
      draft.category = '新弾';
      draft.name = '';
      draft.unitPrice = 0;
    }
  };

  const pickCard = (name, price) => {
    if (!draft) return;
    draft.name = name;
    if (price) draft.unitPrice = price;
    else if (name === 'ストレージ') draft.unitPrice = shop.settings.storagePrice;
  };

  const onProduct = (e) => {
    const p = products.find((x) => x.name === e.currentTarget.value);
    if (p) selectProduct(p);
  };

  const setQty = (n) => {
    if (!draft) return;
    draft.quantity = Math.max(0, Number(n) || 0);
    recalcSealed();
  };

  const toggleReserve = () => {
    if (!draft) return;
    draft.status = draft.status === 'reserved' ? 'bought' : 'reserved';
    draft.reservedAt = draft.status === 'reserved' ? '11/27' : '';
  };

  const save = () => {
    if (saveDraft()) go('purchase');
  };
</script>

{#if draft}
<section class="space-y-3">
  <!-- 種別 -->
  <div>
    <p class="text-[11px] font-bold text-slate-500 mb-1">記録する対象</p>
    <div class="grid grid-cols-2 gap-0.5 rounded-xl bg-slate-200 p-0.5">
      <button
        class="h-10 rounded-lg text-[12px] font-bold"
        class:bg-white={kind === 'single'} class:text-slate-900={kind === 'single'} class:text-slate-500={kind !== 'single'}
        onclick={() => setKind('single')}
      >
        シングル
      </button>
      <button
        class="h-10 rounded-lg text-[12px] font-bold"
        class:bg-white={kind === 'sealed'} class:text-slate-900={kind === 'sealed'} class:text-slate-500={kind !== 'sealed'}
        onclick={() => setKind('sealed')}
      >
        パック / BOX
      </button>
    </div>
  </div>

  {#if kind === 'single'}
    <!-- シングル -->
    <div class="rounded-xl bg-white border border-slate-200 p-3">
      <p class="text-[11px] font-bold text-slate-500 mb-1.5">カード（名前）</p>
      <input
        class="w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
        placeholder="カード名"
        bind:value={draft.name}
      />
      <div class="mt-2 flex flex-wrap gap-1.5">
        <button
          class="h-7 px-2 rounded-lg border border-slate-300 bg-slate-100 text-[10px] font-bold text-slate-700"
          onclick={() => pickCard('ストレージ')}
        >
          ストレージ
        </button>
        {#each wishNames.slice(0, 4) as n (n)}
          <button class="h-7 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600" onclick={() => pickCard(n, 1180)}>{n}</button>
        {/each}
      </div>
      <p class="mt-1.5 text-[10px] text-slate-400">欲しいリストから選ぶと単価の初期値が入ります。「ストレージ」は店頭のストレージ（投げ売り）用。</p>
    </div>

    <div class="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="text-[10px] text-slate-500">数量</span>
          <div class="mt-0.5 flex items-center gap-1.5">
            <button class="w-8 h-9 rounded-lg border border-slate-300 text-[14px] font-bold text-slate-600" onclick={() => (draft.qty = Math.max(1, draft.qty - 1))}>−</button>
            <input class="w-full h-9 text-center rounded-lg border border-slate-300 text-[13px]" type="number" min="1" bind:value={draft.qty} />
            <button class="w-8 h-9 rounded-lg border border-slate-300 text-[14px] font-bold text-slate-600" onclick={() => (draft.qty = draft.qty + 1)}>＋</button>
          </div>
        </label>
        <label class="block">
          <span class="text-[10px] text-slate-500">単価（円）</span>
          <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="number" min="0" bind:value={draft.unitPrice} />
        </label>
      </div>
    </div>
  {:else}
    <!-- パック / BOX -->
    <div class="rounded-xl bg-white border border-slate-200 p-3">
      <p class="text-[11px] font-bold text-slate-500 mb-1.5">商品（選択式）</p>
      <select
        class="w-full h-10 px-2 rounded-lg border border-slate-300 text-[12px] bg-white outline-none focus:border-emerald-500"
        value={draft.productKey}
        onchange={onProduct}
      >
        <option value="">商品を選択してください</option>
        {#each products as p (p.name)}
          <option value={p.name}>{p.name}</option>
        {/each}
      </select>
      {#if draft.name}
        <div class="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-2">
          <p class="text-[10px] text-slate-600">
            {#if draft.msrpPack}1パック {money(draft.msrpPack)}{/if}
            {#if draft.msrpPack && draft.msrpBox} / {/if}
            {#if draft.msrpBox}1BOX {money(draft.msrpBox)}{/if}
            <span class="text-slate-400">（{packsPerBox}パック入り）</span>
          </p>
          {#if draft.expectedAt}
            <p class="text-[10px] text-slate-500 mt-0.5">発売日 {draft.expectedAt.replaceAll('-', '/')}</p>
          {/if}
        </div>
      {/if}

      <div class="mt-2">
        <div class="flex items-center justify-between">
          <p class="text-[10px] text-slate-500">数量</p>
          <div class="grid grid-cols-2 gap-0.5 rounded-lg bg-slate-200 p-0.5">
            <button
              class="h-7 px-2.5 rounded-md text-[10px] font-bold"
              class:bg-white={mode === 'pack'} class:text-slate-900={mode === 'pack'} class:text-slate-500={mode !== 'pack'}
              onclick={() => setSealedMode('pack')}
            >
              パック
            </button>
            <button
              class="h-7 px-2.5 rounded-md text-[10px] font-bold disabled:opacity-30"
              class:bg-white={mode === 'box'} class:text-slate-900={mode === 'box'} class:text-slate-500={mode !== 'box'}
              disabled={!draft.msrpBox}
              onclick={() => setSealedMode('box')}
            >
              BOX
            </button>
          </div>
        </div>
        <div class="mt-1 flex items-center gap-1.5">
          <button class="w-8 h-9 rounded-lg border border-slate-300 text-[14px] font-bold text-slate-600" onclick={() => setQty(qty - 1)}>−</button>
          <input
            class="w-full h-9 text-center rounded-lg border border-slate-300 text-[13px]"
            type="number"
            min="0"
            value={draft.quantity}
            oninput={(e) => setQty(e.currentTarget.value)}
          />
          <button class="w-8 h-9 rounded-lg border border-slate-300 text-[14px] font-bold text-slate-600" onclick={() => setQty(qty + 1)}>＋</button>
        </div>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          {#each [1, 2, 3] as n (n)}
            <button
              class="h-7 px-2 rounded-md border text-[10px] font-bold"
              class:border-emerald-300={mode === 'box' && qty === n} class:bg-emerald-50={mode === 'box' && qty === n}
              class:text-emerald-800={mode === 'box' && qty === n}
              class:border-slate-200={!(mode === 'box' && qty === n)} class:bg-slate-50={!(mode === 'box' && qty === n)}
              class:text-slate-600={!(mode === 'box' && qty === n)}
              disabled={!draft.msrpBox}
              onclick={() => { setSealedMode('box'); setQty(n); }}
            >
              {n}BOX
            </button>
          {/each}
          {#if minPacks > 0}
            <button
              class="h-7 px-2 rounded-md border border-amber-300 bg-amber-50 text-[10px] font-bold text-amber-900"
              title="遊戯王の日など、税込1,000円以上の購入が条件のイベント用"
              onclick={() => { setSealedMode('pack'); setQty(minPacks); }}
            >
              ¥1,000以上: {minPacks}パック
            </button>
          {/if}
        </div>
        {#if minPacks > 0}
          <p class="mt-1 text-[9px] text-amber-700">
            遊戯王の日は対象商品 税込¥1,000 以上で参加（{minPacks}パック = {money(minPacks * draft.msrpPack)}）
          </p>
        {/if}
        <p class="mt-1.5 text-[11px] font-bold" class:text-emerald-700={mode === 'box'} class:text-slate-700={mode !== 'box'}>
          {#if qty === 0}
            数量を入力してください（1BOX 未満は 0 になります）
          {:else if mode === 'box'}
            = {qty}BOX（{totalPacks}パック）・BOX 定価で計算
          {:else}
            = {totalPacks}パック・パック定価で計算
          {/if}
        </p>
        <p class="mt-0.5 text-[9px] text-slate-400">単位を切り替えると数量を換算します（パック→BOX は端数を切り捨て）</p>
      </div>
    </div>

    <div class="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="text-[10px] text-slate-500">単価（円・自動）</span>
          <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="number" min="0" bind:value={draft.unitPrice} />
        </label>
        <div>
          <span class="text-[10px] text-slate-500">内訳</span>
          <div class="mt-0.5 h-9 px-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center text-[11px] text-slate-600">
            {#if mode === 'box'}{qty} BOX（{totalPacks} パック）{:else}{qty} パック{/if}
          </div>
        </div>
      </div>
      <p class="text-[10px] text-slate-400">
        合計 {money(sealedTotal)}（定価ベース）。実際の支払額に合わせて単価を修正できます。
      </p>
    </div>
  {/if}

  <!-- 送料・カテゴリ -->
  <div class="rounded-xl bg-white border border-slate-200 p-3">
    <div class="grid grid-cols-2 gap-2">
      <label class="block">
        <span class="text-[10px] text-slate-500">送料（円）</span>
        <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="number" min="0" bind:value={draft.shipping} />
      </label>
      <div>
        <span class="text-[10px] text-slate-500">カテゴリ</span>
        <div class="mt-0.5 h-9 px-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center text-[12px] text-slate-600">{draft.category}</div>
      </div>
    </div>
  </div>

  <!-- 店舗 -->
  <div class="rounded-xl bg-white border border-slate-200 p-3">
    <p class="text-[11px] font-bold text-slate-500 mb-1.5">店舗</p>
    <div class="flex flex-wrap gap-1.5">
      {#each ['秋葉原 A 店', '秋葉原 B 店', '池袋 D 店', 'カード通販 C'] as s (s)}
        <button
          class="h-8 px-2.5 rounded-full border text-[10px] font-medium"
          class:bg-slate-900={draft.store === s} class:text-white={draft.store === s} class:border-slate-900={draft.store === s}
          class:bg-white={draft.store !== s} class:text-slate-600={draft.store !== s} class:border-slate-200={draft.store !== s}
          onclick={() => (draft.store = s)}
        >
          {s}
        </button>
      {/each}
    </div>
  </div>

  <!-- 予約（パック/BOX のみ） -->
  {#if kind === 'sealed'}
    <button
      class="w-full rounded-xl border p-3 flex items-center gap-3 text-left"
      class:border-amber-300={draft.status === 'reserved'} class:bg-amber-50={draft.status === 'reserved'}
      class:border-slate-200={draft.status !== 'reserved'} class:bg-white={draft.status !== 'reserved'}
      onclick={toggleReserve}
    >
      <span class="w-5 h-5 rounded-md border-2 flex items-center justify-center" class:border-amber-700={draft.status === 'reserved'} class:border-slate-300={draft.status !== 'reserved'}>
        {#if draft.status === 'reserved'}<span class="w-2.5 h-2.5 rounded-sm bg-amber-700"></span>{/if}
      </span>
      <span>
        <span class="block text-[12px] font-bold text-slate-800">予約として記録する</span>
        <span class="block text-[10px] text-slate-500">
          予約中は購入済みと別に集計。残額からは差し引かれます
          {#if draft.expectedAt}・{draft.expectedAt.replaceAll('-', '/')} 発売{/if}
        </span>
      </span>
    </button>
  {/if}

  <!-- 合計 -->
  <div class="rounded-xl bg-slate-900 text-white p-3 flex items-baseline justify-between">
    <span class="text-[11px] text-slate-300">合計</span>
    <span class="text-[22px] font-bold">{money(draft.unitPrice * draft.qty + draft.shipping)}</span>
  </div>

  <div class="grid grid-cols-3 gap-2">
    <button class="h-11 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600" onclick={() => go('purchase')}>
      キャンセル
    </button>
    <button
      class="col-span-2 h-11 rounded-xl bg-emerald-600 text-white text-[12px] font-bold disabled:opacity-40"
      disabled={!draft.name.trim()}
      onclick={save}
    >
      {draft.status === 'reserved' ? '予約を保存' : '購入を保存'}
    </button>
  </div>
</section>
{:else}
  <p class="text-[12px] text-slate-500">入力中のデータがありません。</p>
  <button class="mt-2 h-10 px-3 rounded-lg bg-slate-900 text-white text-[12px] font-bold" onclick={() => go('purchase')}>購入画面へ戻る</button>
{/if}
