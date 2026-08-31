export interface PurchasesTheoryStats {
  matched:number;
  unmatched:number;
  ingredients:number;
}

export interface PurchasesTheoryPayload {
  matched:unknown[];
  unmatched:unknown[];
  ingredients:unknown[];
}

export interface PurchasesSourceSnapshot {
  nativeAvailable:boolean;
  nativeVersion:number|null;
  nativeMounted:boolean;
  theoreticalAvailable:boolean;
  theoretical:PurchasesTheoryStats;
  theoreticalData:PurchasesTheoryPayload;
  rawAvailable:boolean;
}
