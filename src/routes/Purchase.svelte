<script lang="ts">
  import { onMount } from 'svelte';
  import { db, ensureSettings } from '../lib/db/schema';
  import { go } from '../lib/router.svelte';
  import { addPurchase, deletePurchase, listPurchases, markPurchased } from '../lib/repositories/purchases';
  import { listStores } from '../lib/repositories/stores';
  import { listWish, type WishRow } from '../lib/repositories/wish';
  import { upsertManualCard } from '../lib/repositories/cards';
  import { takePendingDraft } from '../lib/purchaseDraft.svelte';
  import type { Card, Purchase, Settings, Store } from '../lib/domain/types';
  import type { ReleaseProduct } from '../lib/domain/releases';
  import { pickableProducts } from '../lib/domain/releases';

  let purchases = $state<Purchase[]>([]);
  let cards = $state<Record<string, Card>>({});
  let stores = $state<Store[]>([]);
  let wish = $state<WishRow[]>([]);
  let settings = $state<Settings | null>(null);
  let releaseProducts = $state<ReleaseProduct[]>([]);
  let loading = $state(true);
  let tab = $state<'all' | 'reserved' | 'bought'>('all');
  let showForm = $state(false);
  let message = $state('');

  const blankForm = () => ({
    itemType: 'card' as 'card' | 'sealed',
    cardId: '',
    manualName: '',
    productName: '',
    unitMode: 'pack' as 'pack' | 'box',
    quantity: 1,
    packPrice: 0,
    boxPrice: 0,
    productPacksPerBox: 0,
    shipping: 0,
    storeId: '',
    status: 'bought' as 'bought' | 'reserved',
    expectedAt: '',
    rarity: '',
  });

  let form = $state(blankForm());

  async function load() {
    purchases = await listPurchases();
    const cardRows = await db.cards.toArray();
    cards = Object.fromEntries(cardRows.map((c) => [c.id, c]));
    stores = await listStores();
    wish = await listWish();
    settings = await ensureSettings();
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/releases.json`);
      if (res.ok) {
        const json = (await res.json()) as { products: ReleaseProduct[] };
        releaseProducts = pickableProducts(json.products ?? []);
      }
    } catch {
      releaseProducts = [];
    }
    if (!form.storeId && stores[0]) form.storeId = stores[0].id;
    loading = false;
  }

  onMount(async () => {
    await load();
    const draft = takePendingDraft();
    if (draft) {
      form.itemType = 'sealed';
      form.productName = draft.productName;
      form.unitMode = draft.unitMode;
      form.quantity = 1;
      if (draft.unitMode === 'box') form.boxPrice = draft.unitPrice;
      else form.packPrice = draft.unitPrice;
      form.status = 'reserved';
      form.expectedAt = draft.expectedAt;
      showForm = true;
    }
  });

  const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
  const unitLabel: Record<string, string> = { single: '単品', pack: 'パック', box: 'BOX' };

  const bought = $derived(purchases.filter((p) => p.status === 'bought'));
  const reserved = $derived(purchases.filter((p) => p.status === 'reserved'));
  const spent = $derived(bought.reduce((n, p) => n + p.total, 0));
  const reservedTotal = $derived(reserved.reduce((n, p) => n + p.total, 0));
  const list = $derived(tab === 'all' ? purchases : purchases.filter((p) => p.status === tab));

  const cardName = (p: Purchase) =>
    (p.cardId && cards[p.cardId]?.nameJa) || p.productKey || '（不明）';

  const packsPerBox = $derived(settings?.defaultPacksPerBox ?? 30);
  const productMap = $derived.by(() => {
    const map = new Map<string, ReleaseProduct>();
    for (const p of releaseProducts) map.set(p.name, p);
    for (const p of purchases) {
      if (p.itemType !== 'sealed' || !p.productKey || map.has(p.productKey)) continue;
      map.set(p.productKey, {
        name: p.productKey,
        date: '',
        kind: '',
        url: '',
        priceUnit: p.unit === 'box' ? 'box' : 'pack',
        price: p.unitPrice,
        packsPerBox: p.packsPerUnit ?? null,
        cardsPerPack: null,
      });
    }
    return map;
  });
  const productOptions = $derived.by(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    for (const p of releaseProducts) {
      if (seen.has(p.name)) continue;
      seen.add(p.name);
      names.push(p.name);
    }
    for (const name of productMap.keys()) {
      if (seen.has(name)) continue;
      seen.add(name);
      names.push(name);
    }
    return names;
  });
  const effectivePacksPerBox = $derived(form.productPacksPerBox || packsPerBox);

  function onProduct(name: string) {
    form.productName = name;
    const p = productMap.get(name);
    if (!p) return;
    if (p.packsPerBox) form.productPacksPerBox = p.packsPerBox;
    if (p.priceUnit) form.unitMode = p.priceUnit;
    if (p.priceUnit === 'box' && p.price) {
      form.boxPrice = p.price;
      if (p.packsPerBox) form.packPrice = Math.round(p.price / p.packsPerBox);
    } else if (p.price) {
      form.packPrice = p.price;
      if (p.packsPerBox) form.boxPrice = p.price * p.packsPerBox;
    }
    if (p.date) form.expectedAt = p.date;
  }

  const formPackCount = $derived(
    form.unitMode === 'box' ? form.quantity * effectivePacksPerBox : form.quantity,
  );
  const formUnitPrice = $derived(
    form.itemType === 'sealed'
      ? form.unitMode === 'box'
        ? form.boxPrice
        : form.packPrice
      : form.packPrice,
  );
  const formTotal = $derived(formUnitPrice * form.quantity + form.shipping);

  async function save() {
    if (form.itemType === 'card') {
      let cardId = form.cardId;
      if (!cardId) {
        const name = form.manualName.trim();
        if (!name) {
          message = 'カードを選ぶか、カード名を入力してください';
          return;
        }
        const card = await upsertManualCard(name);
        cardId = card.id;
      }
      await addPurchase({
        itemType: 'card',
        cardId,
        unit: 'single',
        qty: form.quantity,
        unitPrice: form.packPrice,
        shipping: form.shipping,
        rarity: form.rarity,
        status: 'bought',
        storeId: form.storeId || undefined,
        category: 'single',
      });
    } else {
      const name = form.productName.trim();
      if (!name) {
        message = '商品名を入力してください';
        return;
      }
      await addPurchase({
        itemType: 'sealed',
        productKey: name,
        unit: form.unitMode,
        qty: form.quantity,
        packsPerUnit: form.unitMode === 'box' ? effectivePacksPerBox : 1,
        totalPacks: formPackCount,
        unitPrice: formUnitPrice,
        shipping: form.shipping,
        status: form.status,
        storeId: form.storeId || undefined,
        category: 'newset',
        expectedAt: form.status === 'reserved' ? form.expectedAt || undefined : undefined,
      });
    }
    message = '記録しました';
    showForm = false;
    form = blankForm();
    if (stores[0]) form.storeId = stores[0].id;
    await load();
  }

  async function mark(id: string) {
    await markPurchased(id);
    await load();
  }

  async function remove(id: string) {
    await deletePurchase(id);
    await load();
  }
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] text-slate-500">今月の購入</p>
    <p class="text-[22px] font-bold text-slate-900 leading-none mt-1">{yen(spent)}</p>
    <p class="text-[10px] text-slate-500 mt-1">
      {bought.length} 件・予約中 {yen(reservedTotal)}（{reserved.length} 件）
    </p>
    <button
      class="mt-3 w-full h-10 rounded-lg bg-emerald-600 text-white text-[12px] font-bold"
      onclick={() => (showForm = !showForm)}
    >
      {showForm ? 'フォームを閉じる' : '＋ 購入・予約を記録'}
    </button>
  </div>

  {#if message}
    <p class="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-[10px] text-emerald-800">
      {message}
    </p>
  {/if}

  {#if showForm}
    <div class="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
      <div class="grid grid-cols-2 gap-0.5 rounded-xl bg-slate-200 p-0.5">
        <button
          class="h-10 rounded-lg text-[12px] font-bold"
          class:bg-white={form.itemType === 'card'}
          class:text-slate-900={form.itemType === 'card'}
          class:text-slate-500={form.itemType !== 'card'}
          onclick={() => (form.itemType = 'card')}
        >
          シングル
        </button>
        <button
          class="h-10 rounded-lg text-[12px] font-bold"
          class:bg-white={form.itemType === 'sealed'}
          class:text-slate-900={form.itemType === 'sealed'}
          class:text-slate-500={form.itemType !== 'sealed'}
          onclick={() => (form.itemType = 'sealed')}
        >
          パック / BOX
        </button>
      </div>

      {#if form.itemType === 'card'}
        <div class="space-y-2">
          <select
            class="w-full h-10 px-2 rounded-lg border border-slate-300 bg-white text-[12px]"
            bind:value={form.cardId}
          >
            <option value="">欲しいリストから選ぶ</option>
            {#each wish as w (w.id)}
              <option value={w.cardId}>{w.card?.nameJa ?? '—'}</option>
            {/each}
          </select>
          <input
            class="w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px]"
            placeholder="またはカード名を入力（例: 灰流うらら）"
            bind:value={form.manualName}
          />
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="text-[10px] text-slate-500">数量</span>
              <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="number" min="1" bind:value={form.quantity} />
            </label>
            <label class="block">
              <span class="text-[10px] text-slate-500">単価（円）</span>
              <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="number" min="0" bind:value={form.packPrice} />
            </label>
          </div>
        </div>
      {:else}
        <div class="space-y-2">
          <select
            class="w-full h-10 px-2 rounded-lg border border-slate-300 bg-white text-[12px]"
            value={form.productName}
            onchange={(e) => onProduct(e.currentTarget.value)}
          >
            <option value="">商品を選択してください</option>
            {#each productOptions as name (name)}
              <option value={name}>{name}</option>
            {/each}
          </select>
          {#if productOptions.length === 0}
            <p class="text-[9px] text-amber-700">
              商品データがありません（npm run fetch:releases で生成）
            </p>
          {:else}
            <p class="text-[9px] text-slate-400">
              予約可能な将来の弾と発売1年内のカード商品（グッズ・プロテクター等は除く）。定価・パック数は自動入力されます。
            </p>
          {/if}
          <div class="grid grid-cols-2 gap-0.5 rounded-lg bg-slate-200 p-0.5">
            <button
              class="h-9 rounded-md text-[11px] font-bold"
              class:bg-white={form.unitMode === 'pack'}
              class:text-slate-900={form.unitMode === 'pack'}
              class:text-slate-500={form.unitMode !== 'pack'}
              onclick={() => (form.unitMode = 'pack')}
            >
              パック
            </button>
            <button
              class="h-9 rounded-md text-[11px] font-bold"
              class:bg-white={form.unitMode === 'box'}
              class:text-slate-900={form.unitMode === 'box'}
              class:text-slate-500={form.unitMode !== 'box'}
              onclick={() => (form.unitMode = 'box')}
            >
              BOX
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="text-[10px] text-slate-500">数量（{form.unitMode === 'box' ? 'BOX' : 'パック'}）</span>
              <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="number" min="1" bind:value={form.quantity} />
            </label>
            <label class="block">
              <span class="text-[10px] text-slate-500">単価（円）</span>
              <input
                class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]"
                type="number"
                min="0"
                value={form.unitMode === 'box' ? form.boxPrice : form.packPrice}
                oninput={(e) =>
                  form.unitMode === 'box'
                    ? (form.boxPrice = Number(e.currentTarget.value))
                    : (form.packPrice = Number(e.currentTarget.value))}
              />
            </label>
          </div>
          <p class="text-[10px] text-slate-500">
            購入パック数 {formPackCount}（1BOX {effectivePacksPerBox} パック）
          </p>
          <button
            class="w-full h-10 rounded-xl border p-2 text-left text-[11px] font-bold"
            class:border-amber-300={form.status === 'reserved'}
            class:bg-amber-50={form.status === 'reserved'}
            class:border-slate-200={form.status !== 'reserved'}
            class:text-slate-700={form.status !== 'reserved'}
            class:text-amber-900={form.status === 'reserved'}
            onclick={() => (form.status = form.status === 'reserved' ? 'bought' : 'reserved')}
          >
            {form.status === 'reserved' ? '予約として記録する（ON）' : '予約として記録する（OFF）'}
          </button>
          {#if form.status === 'reserved'}
            <label class="block">
              <span class="text-[10px] text-slate-500">発売日</span>
              <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="date" bind:value={form.expectedAt} />
            </label>
          {/if}
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="text-[10px] text-slate-500">店舗</span>
          <select class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 bg-white text-[12px]" bind:value={form.storeId}>
            <option value="">店舗なし</option>
            {#each stores as s (s.id)}
              <option value={s.id}>{s.shortName || s.name}</option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="text-[10px] text-slate-500">送料（円）</span>
          <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="number" min="0" bind:value={form.shipping} />
        </label>
      </div>

      <div class="flex items-baseline justify-between rounded-xl bg-slate-900 text-white p-3">
        <span class="text-[11px] text-slate-300">合計</span>
        <span class="text-[20px] font-bold">{yen(formTotal)}</span>
      </div>

      <button class="w-full h-11 rounded-xl bg-emerald-600 text-white text-[12px] font-bold" onclick={save}>
        保存
      </button>
    </div>
  {/if}

  <div class="grid grid-cols-3 gap-0.5 rounded-xl bg-slate-200 p-0.5">
    {#each [['all', 'すべて'], ['reserved', '予約中'], ['bought', '購入済']] as [key, label] (key)}
      <button
        class="h-9 rounded-lg text-[11px] font-bold"
        class:bg-white={tab === key}
        class:text-slate-900={tab === key}
        class:text-slate-500={tab !== key}
        onclick={() => (tab = key as typeof tab)}
      >
        {label}
        {#if key === 'all'} {purchases.length}{/if}
        {#if key === 'reserved'} {reserved.length}{/if}
        {#if key === 'bought'} {bought.length}{/if}
      </button>
    {/each}
  </div>

  {#if loading}
    <p class="text-center text-[11px] text-slate-400 py-8">読み込み中…</p>
  {:else if list.length === 0}
    <p class="rounded-xl bg-white border border-dashed border-slate-300 p-6 text-center text-[11px] text-slate-500">
      記録がありません。「＋ 購入・予約を記録」から追加してください。
    </p>
  {/if}

  <ul class="space-y-2">
    {#each list as p (p.id)}
      <li class="rounded-xl border p-3" class:border-amber-200={p.status === 'reserved'} class:border-slate-200={p.status !== 'reserved'} class:bg-white={true}>
        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-slate-900 truncate">{cardName(p)}</p>
            <p class="text-[10px] text-slate-500">
              {unitLabel[p.unit]}・{p.storeId ? stores.find((s) => s.id === p.storeId)?.shortName || stores.find((s) => s.id === p.storeId)?.name : '店舗なし'}
            </p>
          </div>
          <div class="text-right">
            <p class="text-[13px] font-bold text-slate-900">{yen(p.total)}</p>
            {#if p.status === 'reserved'}
              <span class="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">予約中</span>
            {/if}
          </div>
        </div>
        <div class="mt-1.5 flex items-center gap-1.5">
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {p.category === 'newset' ? '新弾' : p.category === 'single' ? 'シングル' : p.category === 'goods' ? 'グッズ' : 'その他'}
          </span>
          <span class="text-[10px] text-slate-500">単価 {yen(p.unitPrice)} × {p.qty}</span>
          {#if p.status === 'reserved'}
            <button class="ml-auto h-7 px-2 rounded-md bg-amber-900 text-white text-[10px] font-bold" onclick={() => mark(p.id)}>
              購入済みに
            </button>
          {:else}
            <button class="ml-auto h-7 px-2 rounded-md border border-rose-200 text-[10px] font-bold text-rose-700" onclick={() => remove(p.id)}>
              削除
            </button>
          {/if}
        </div>
      </li>
    {/each}
  </ul>

  <button class="w-full h-9 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-600" onclick={() => go('budget')}>
    予算を見る
  </button>
</section>
