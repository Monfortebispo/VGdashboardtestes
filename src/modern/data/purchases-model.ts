export interface PurchasesTheoryStats {
  matched:number;
  unmatched:number;
  ingredients:number;
}

export interface PurchasesSourceSnapshot {
  nativeAvailable:boolean;
  nativeVersion:number|null;
  nativeMounted:boolean;
  theoreticalAvailable:boolean;
  theoretical:PurchasesTheoryStats;
  rawAvailable:boolean;
}
