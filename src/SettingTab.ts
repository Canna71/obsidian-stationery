import StationeryPlugin from "src/main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class StationerySettingsTab extends PluginSettingTab {
    plugin: StationeryPlugin;

    constructor(app: App, plugin: StationeryPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", { text: "Stationery Settings" });

        this.createToggle(
            containerEl,
            "Add Ribbon Icon",
            "Adds an icon to the ribbon to launch scan",
            "addRibbonIcon"
        );

        new Setting(containerEl)
            .setName("Add Ribbon Icon")
            .setDesc("Adds an icon to the ribbon toopen Stationery Side Bar")
            .addToggle((bool) =>
                bool
                    .setValue(this.plugin.settings.addRibbonIcon)
                    .onChange(async (value) => {
                        this.plugin.settings.addRibbonIcon = value;
                        await this.plugin.saveSettings();
                        this.display();
                        if (this.plugin.settings.addRibbonIcon) {
                            this.plugin.addIcon();
                        } else {
                            this.plugin.removeIcon();
                        }
                    })
            );

        this.createToggle(
            containerEl,
            "Show Stationery Sidebar",
            "Opens Stationery sidebar at startup",
            "showAtStartUp"
        );
    }

    private createToggle(
        containerEl: HTMLElement,
        name: string,
        desc: string,
        prop: string
    ) {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addToggle((bool) =>
                bool
                    .setValue((this.plugin.settings as any)[prop] as boolean)
                    .onChange(async (value) => {
                        (this.plugin.settings as any)[prop] = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );
    }
}
