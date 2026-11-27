<script lang="ts">
  import ComingSoon from '../lib/components/ComingSoon.svelte';

  const points = [
      'サマリ（種類・残り枚数・目標合計）',
      '絞り込み・並べ替え',
      '編集シート',
      '購入・価格登録への導線',
  ];
</script>

<ComingSoon title="欲しいリスト" desc="カード名で欲しいものを管理し、店舗ごとの価格を比較します。" {points} />