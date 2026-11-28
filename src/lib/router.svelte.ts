export const routes = [
  'home',
  'wish',
  'patrol',
  'purchase',
  'budget',
  'search',
  'compare',
  'releases',
  'settings',
  'stores',
] as const;

export type Route = (typeof routes)[number];

export const routeLabels: Record<Route, string> = {
  home: 'ホーム',
  wish: '欲しいリスト',
  patrol: '巡回モード',
  purchase: '購入',
  budget: '予算',
  search: 'カード検索',
  compare: '比較表',
  releases: '新弾',
  settings: '設定',
  stores: '店舗',
};

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return (routes as readonly string[]).includes(hash) ? (hash as Route) : 'home';
}

export const nav = $state<{ route: Route }>({ route: readRoute() });

export function go(route: Route): void {
  if (window.location.hash === `#/${route}`) {
    nav.route = route;
    return;
  }
  window.location.hash = `#/${route}`;
}

window.addEventListener('hashchange', () => {
  nav.route = readRoute();
});
