<script lang="ts">
  import ComingSoon from '../lib/components/ComingSoon.svelte';

  const points = [
      '残額 = 上限 − 購入 − 予約',
      '購入/予約/残りの 3 色バー',
      'カテゴリ別の内訳',
  ];
</script>

<ComingSoon title="予算" desc="月次予算と購入・予約の内訳を表示します。" {points} />