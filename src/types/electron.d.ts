export {};

declare global {
  interface Window {
    electronAPI: {
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
      dialog: {
        openFile: (options?: any) => Promise<string[]>;
        saveFile: (options?: any) => Promise<string | undefined>;
      };
      platform: string;
    };
  }
}
