export const SREM = "https://prod-srem-api-srem.moj.gov.sa/api/v1";

// The SREM WAF rejects requests with no/blank User-Agent (Vercel's fetch
// sends none), returning a connection reset. Browser-like headers plus an
// Origin matching the real front-end get the request through from a
// datacenter IP.
export const SREM_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "ar,en;q=0.9",
  Origin: "https://srem.moj.gov.sa",
  Referer: "https://srem.moj.gov.sa/",
};
