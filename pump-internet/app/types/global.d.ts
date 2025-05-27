declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
    TikTok?: {
      embed: {
        init: () => void;
      };
    };
  }
}

export {};
