<script lang="ts">
  import ComingSoon from '../lib/components/ComingSoon.svelte';

  const points = [
      '購入一覧（すべて/予約中/購入済み）',
      '購入フォーム',
      '詳細・編集・購入済みへの変更',
  ];
</script>

<ComingSoon title="購入" desc="シングル・パック/BOX・予約を記録します。" {points} />