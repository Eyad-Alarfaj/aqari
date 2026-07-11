export interface IndexPoint {
  date: string;
  index: number;
  marketValue: number;
  indexChange: number;
}

export interface MarketSnapshot {
  index: number;
  change: number;
}

export interface TrendingDistrict {
  DistrictCode: number;
  DistrictName: string;
  CityCode: number;
  CityName: string;
  RegionCode: number;
  RegionName: string;
  TotalCount: number;
  TotalPrice: number;
  TotalArea: number;
}

// Shape of a live deal from the SREM SignalR stream. Fields are optional
// because the stream schema is not documented — render defensively.
export interface LiveDeal {
  [key: string]: unknown;
}
