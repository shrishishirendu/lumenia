declare module '@wolfram-alpha/wolfram-alpha-api' {
  interface WolframAlphaAPI {
    getShort(query: string | object): Promise<string>;
    getFull(query: string | object): Promise<any>;
    getSimple(query: string | object): Promise<string>;
    getSpoken(query: string | object): Promise<string>;
  }
  
  function WolframAlphaAPI(appId: string): WolframAlphaAPI;
  export = WolframAlphaAPI;
}
