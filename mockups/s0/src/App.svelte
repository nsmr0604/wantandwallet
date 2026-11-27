<script>
  import HomeScreen from './lib/screens/HomeScreen.svelte';
  import WishScreen from './lib/screens/WishScreen.svelte';
  import SearchScreen from './lib/screens/SearchScreen.svelte';
  import PatrolScreen from './lib/screens/PatrolScreen.svelte';
  import CompareScreen from './lib/screens/CompareScreen.svelte';
  import PurchaseScreen from './lib/screens/PurchaseScreen.svelte';
  import PurchaseForm from './lib/screens/PurchaseForm.svelte';
  import PurchaseDetail from './lib/screens/PurchaseDetail.svelte';
  import BudgetScreen from './lib/screens/BudgetScreen.svelte';
  import ReleasesScreen from './lib/screens/ReleasesScreen.svelte';
  import SettingsScreen from './lib/screens/SettingsScreen.svelte';

  const screens = {
    home: HomeScreen,
    wish: WishScreen,
    patrol: PatrolScreen,
    purchase: PurchaseScreen,
    'purchase-form': PurchaseForm,
    'purchase-detail': PurchaseDetail,
    budget: BudgetScreen,
    search: SearchScreen,
    compare: CompareScreen,
    releases: ReleasesScreen,
    settings: SettingsScreen,
  };

  const meta = {
    home: 'ホーム',
    wish: '欲しいリスト',
    patrol: '巡回モード',
    purchase: '購入',
    'purchase-form': '購入を記録',
    'purchase-detail': '購入の詳細',
    budget: '予算',
    search: 'カード検索',
    compare: '比較表',
    releases: '新弾',
    settings: '設定',
  };

  const tabs = [
    { id: 'home', label: 'ホーム' },
    { id: 'wish', label: '欲しい' },
    { id: 'patrol', label: '巡回' },
    { id: 'purchase', label: '購入' },
    { id: 'budget', label: '予算' },
  ];

  const all = [
    'home', 'wish', 'search', 'patrol', 'compare',
    'purchase', 'budget', 'releases', 'settings',
  ];

  let screen = $state('home');
  let pickerOpen = $state(false);

  const Current = $derived(screens[screen]);
  const title = $derived(meta[screen]);
  const isSub = $derived(screen === 'purchase-form' || screen === 'purchase-detail');

  const go = (id) => {
    screen = id;
    pickerOpen = false;
  };
</script>

<div class="min-h-screen bg-slate-200 flex justify-center">
  <div class="w-full max-w-[420px] min-h-screen bg-slate-50 relative shadow-xl overflow-x-clip">
    <div class="sticky top-0 z-40">
      <!-- モックであることの明示 -->
      <div class="bg-amber-300 text-amber-950 text-[11px] px-3 py-1 flex items-center justify-between">
        <span class="font-bold">S0 モック</span>
        <span>表示のみ・データ保存なし</span>
      </div>

      <!-- ヘッダー -->
      <header class="bg-white/95 backdrop-blur border-b border-slate-200">
      <div class="h-12 px-3 flex items-center gap-2">
        {#if isSub}
          <button
            class="w-9 h-9 -ml-1 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
            aria-label="戻る"
            onclick={() => go('purchase')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        {/if}
        <h1 class="text-[15px] font-bold text-slate-900 truncate">{title}</h1>
        <div class="ml-auto flex items-center gap-1">
          <button
            class="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
            aria-label="検索"
            onclick={() => go('search')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <button
            class="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
            aria-label="全画面"
            onclick={() => (pickerOpen = !pickerOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      </header>
    </div>

    <main class="px-3 pt-3 pb-28">
      <Current {go} />
    </main>

    <!-- 下部タブ -->
    <nav class="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
      <div class="w-full max-w-[420px] bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] pointer-events-auto">
        <ul class="grid grid-cols-5">
          {#each tabs as t (t.id)}
            <li>
              <button
                class="w-full h-14 flex flex-col items-center justify-center gap-0.5 text-[10px]"
                class:text-emerald-600={screen === t.id}
                class:text-slate-500={screen !== t.id}
                onclick={() => go(t.id)}
              >
                <span class="w-5 h-5 flex items-center justify-center">
                  {#if t.id === 'home'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/></svg>
                  {:else if t.id === 'wish'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M4 12h16"/></svg>
                  {:else if t.id === 'patrol'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h5l2 10h6"/><circle cx="18" cy="7" r="2"/></svg>
                  {:else if t.id === 'purchase'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-3-6 3z"/></svg>
                  {:else}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>
                  {/if}
                </span>
                <span>{t.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </nav>

    <!-- 画面一覧（モック専用） -->
    {#if pickerOpen}
      <div class="fixed inset-0 z-50 bg-slate-900/40" onclick={() => (pickerOpen = false)} role="presentation">
        <div class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[420px] bg-white rounded-t-2xl p-4" onclick={(e) => e.stopPropagation()} role="presentation">
          <p class="text-xs font-bold text-slate-500 mb-2">全画面（モック専用メニュー）</p>
          <div class="grid grid-cols-3 gap-2">
            {#each all as id (id)}
              <button
                class="h-11 rounded-lg border text-[12px] font-medium"
                class:border-emerald-500={screen === id}
                class:bg-emerald-50={screen === id}
                class:border-slate-200={screen !== id}
                onclick={() => go(id)}
              >
                {meta[id]}
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
