<script lang="ts">
  import ComingSoon from '../lib/components/ComingSoon.svelte';

  const points = [
      '1BOX のパック数',
      'ストレージの初期価格',
      'エクスポート / インポート',
  ];
</script>

<ComingSoon title="設定" desc="予算・パック数・ストレージ単価・データ管理を設定します。" {points} />