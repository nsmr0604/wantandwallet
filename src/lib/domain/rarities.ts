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
] as const;

export function rarityLabel(value: string | undefined): string {
  return RARITIES.find((r) => r.value === value)?.label ?? '指定なし';
}
