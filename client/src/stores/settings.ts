import {acceptHMRUpdate, defineStore} from "pinia";
import {ISettings, SettingType} from "@/types/ISettings";
import {ref} from "vue";

export const useSettingsStore = defineStore("settings", () => {
   const settings = ref<ISettings|{ [key: string]: string }>({});
   const loading = ref(false);
   const error = ref("");

   async function getSettings(forceRefresh: boolean = false) {
       loading.value = true;
       const response= await fetch("/api/v1/settings");

       if (!response.ok) {
           error.value = `API error (${response.status} ${response.statusText}): Unable to load settings`;
           loading.value = false;
           return;
       }

       settings.value = await response.json();
       loading.value = false;
   }

   async function saveSetting(settingName: keyof ISettings, value: string, settingType: SettingType) {
       const submitResult = await fetch(`/api/v1/settings/${settingName}`, {
           method: "POST",
           body: JSON.stringify({
               value,
               settingType,
           }),
           headers: {
               "Content-Type": "application/json",
           },
       });

       if (!submitResult.ok) {
           return `Save error: ${submitResult.status} ${submitResult.statusText}`;
       }

       settings.value[settingName] = value;
       return submitResult.ok;
   }

   return { settings, loading, error, getSettings, saveSetting };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
