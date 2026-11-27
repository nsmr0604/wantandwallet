<script lang="ts">
  import ComingSoon from '../lib/components/ComingSoon.svelte';

  const points = [
      'カード名 → 店舗 → レアリティ',
      '店舗 → カード名 → レアリティ',
      '最安店・差額の表示',
  ];
</script>

<ComingSoon title="比較表" desc="カード別 / 店舗別に、レアリティごとの価格を比較します。" {points} />