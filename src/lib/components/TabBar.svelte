<script lang="ts">
  import { nav, go, type Route } from '../router.svelte';

  const tabs: { route: Route; label: string; path: string }[] = [
    { route: 'home', label: 'ホーム', path: 'M3 10.5 12 3l9 7.5M5 10v10h14V10' },
    { route: 'wish', label: '欲しい', path: 'M12 4v16M4 12h16' },
    { route: 'patrol', label: '巡回', path: 'M4 7h5l2 10h6' },
    { route: 'purchase', label: '購入', path: 'M6 3h12v18l-6-3-6 3z' },
    { route: 'budget', label: '予算', path: 'M3 6h18v13H3zM3 10h18' },
  ];
</script>

<nav class="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
  <div class="w-full max-w-[420px] bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] pointer-events-auto">
    <ul class="grid grid-cols-5">
      {#each tabs as t (t.route)}
        <li>
          <button
            class="w-full h-14 flex flex-col items-center justify-center gap-0.5 text-[10px]"
            class:text-emerald-600={nav.route === t.route}
            class:text-slate-500={nav.route !== t.route}
            onclick={() => go(t.route)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><path d={t.path} /></svg>
            <span>{t.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</nav>
