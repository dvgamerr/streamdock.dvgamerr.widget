declare module '@/hooks/plugin' {
  export function useWatchEvent(event: string, handlers: Record<string, Function>): void;
  export const usePluginStore: any;
}

declare module '@/hooks/property' {
  import { Ref } from 'vue';
  export const usePropertyStore: any;
  export function useWatchEvent(event: { didReceiveSettings(data: any): void; sendToPropertyInspector(data: any): void; didReceiveGlobalSettings(data: any): void }): void;
}

declare module '@/hooks/i18n' {
  export const useI18nStore: () => Record<string, string>;
}
