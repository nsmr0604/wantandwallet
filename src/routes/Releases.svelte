<script lang="ts">
  import ComingSoon from '../lib/components/ComingSoon.svelte';

  const points = [
      '発売日カウントダウン',
      '定価（パック/BOX）とパック数',
      '予約とリマインダー',
  ];
</script>

<ComingSoon title="新弾" desc="発売日・定価・パック数を確認し、予約を記録します。" {points} />