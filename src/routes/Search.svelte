<script lang="ts">
  import ComingSoon from '../lib/components/ComingSoon.svelte';

  const points = [
      'かな正規化の部分一致',
      '再録・イラスト違いは 1 件に統合',
      '手入力の逃げ道',
  ];
</script>

<ComingSoon title="カード検索" desc="日本語名でカードを検索し、欲しいリストへ追加します。" {points} />