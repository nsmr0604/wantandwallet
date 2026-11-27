<script lang="ts">
  import TabBar from './lib/components/TabBar.svelte';
  import { nav, routeLabels } from './lib/router.svelte';
  import Home from './routes/Home.svelte';
  import Wish from './routes/Wish.svelte';
  import Patrol from './routes/Patrol.svelte';
  import Purchase from './routes/Purchase.svelte';
  import Budget from './routes/Budget.svelte';
  import Search from './routes/Search.svelte';
  import Compare from './routes/Compare.svelte';
  import Releases from './routes/Releases.svelte';
  import Settings from './routes/Settings.svelte';
</script>

<div class="min-h-screen bg-slate-200 flex justify-center">
  <div class="w-full max-w-[420px] min-h-screen bg-slate-50 relative overflow-x-clip">
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div class="h-12 px-3 flex items-center justify-between">
        <h1 class="text-[15px] font-bold text-slate-900">{routeLabels[nav.route]}</h1>
        <span class="text-[10px] text-slate-400">S0 基盤</span>
      </div>
    </header>

    <main class="px-3 pt-3 pb-24">
      {#if nav.route === 'home'}
        <Home />
      {:else if nav.route === 'wish'}
        <Wish />
      {:else if nav.route === 'patrol'}
        <Patrol />
      {:else if nav.route === 'purchase'}
        <Purchase />
      {:else if nav.route === 'budget'}
        <Budget />
      {:else if nav.route === 'search'}
        <Search />
      {:else if nav.route === 'compare'}
        <Compare />
      {:else if nav.route === 'releases'}
        <Releases />
      {:else}
        <Settings />
      {/if}
    </main>

    <TabBar />
  </div>
</div>
