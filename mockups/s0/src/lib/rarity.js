// 選択式のレアリティ（恒常的に存在するもののみ）
// 20th シークレット、ゴールドレア、ミレニアムレア等の期間限定・特殊商品限定は含めない。
export const RARITIES = [
  { value: '', label: '指定なし' },
  { value: 'N', label: 'ノーマル (N)' },
  { value: 'R', label: 'レア (R)' },
  { value: 'SR', label: 'スーパーレア (SR)' },
  { value: 'UR', label: 'ウルトラレア (UR)' },
  { value: 'UL', label: 'アルティメットレア (UL)' },
  { value: 'SE', label: 'シークレットレア (SE)' },
  { value: 'PSER', label: 'プリズマティックシークレットレア (PSER)' },
  { value: 'CR', label: 'コレクターズレア (CR)' },
  { value: 'HR', label: 'ホログラフィックレア (HR)' },
  { value: 'PR', label: 'パラレルレア (PR)' },
];

export const rarityLabel = (value) => RARITIES.find((r) => r.value === value)?.label ?? '指定なし';
