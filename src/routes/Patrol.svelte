<script lang="ts">
  import ComingSoon from '../lib/components/ComingSoon.svelte';

  const points = [
      '最終訪問順の店舗チップ＋固定の追加ボタン',
      '優先度順 / 種類→名前順の切替',
      'テンキー入力と保存',
  ];
</script>

<ComingSoon title="巡回モード" desc="店舗を選び、欲しいカードの価格をその場で記録します。" {points} />