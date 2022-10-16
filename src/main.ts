import { DEFAULT_SETTINGS, StationerySettings } from "src/Settings";
import { addIcon, MarkdownView } from "obsidian";
// import { MathResult } from './Extensions/ResultMarkdownChild';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { StationeryView, STATIONERY_VIEW } from "./Views/StationeryView";
import {
    App,
    finishRenderMath,
    loadMathJax,
    Modal,
    Plugin,
    WorkspaceLeaf,
} from "obsidian";
import path from "path";

import { StationerySettingsTab } from "src/SettingTab";
import { StationeryMetadata, StyleProcessor } from "./styling";


const sigma = `<path stroke="currentColor" fill="none" d="M78.6067 22.8905L78.6067 7.71171L17.8914 7.71171L48.2491 48.1886L17.8914 88.6654L78.6067 88.6654L78.6067 73.4866" opacity="1"  stroke-linecap="round" stroke-linejoin="round" stroke-width="6" />
`;

// Remember to rename these classes and interfaces!

let gSettings: StationerySettings;

export function getStationerySettings() {
    return gSettings;
}


export default class StationeryPlugin extends Plugin {
    settings: StationerySettings;
    // basePath: string;
    ribbonIconEl: HTMLElement | null;
    private _styleProcessor: StyleProcessor;
    public get styleProcessor(): StyleProcessor {
        return this._styleProcessor;
    }
   

    async onload() {
        await this.loadSettings();
        console.log("Loading Stationery ");
        
        this._styleProcessor = new StyleProcessor(this);

        this.registerView(STATIONERY_VIEW, (leaf) => new StationeryView(leaf, this));

        addIcon("sigma", sigma);

        if (this.settings.addRibbonIcon) {
            // This creates an icon in the left ribbon.
            this.addIcon();
        }

        this.addCommand({
            id: "show-Stationery-view",
            name: "Show Stationery Sidebar",
            callback: () => this.activateView(),
        });

        this.addCommand({
            id: "apply-stationeru",
            name: "Refresh Styles",
            callback: () => {
                const leaves = this.app.workspace.getLeavesOfType("markdown");
                leaves.forEach((leaf) =>
                    this.styleProcessor.applyStyle(leaf.view as MarkdownView)
                );
            },
        });

        this.app.workspace.onLayoutReady(() => {
            if (this.settings.showAtStartup) {
                this.activateView();
            }
        });

        this.registerCodeBlock();
        this.registerPostProcessor();
        this.registerEditorExtensions();

        this.app.workspace.on(
            "file-open",
            (file) => {
                const mv = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (mv) {
                    this.styleProcessor.applyStyle(mv);
                }
            },
            this
        );

        this.app.workspace.on("window-open", (win, ctx) => {
            console.log(win, ctx);
        });

        this.app.workspace.on(
            "active-leaf-change",
            (leaf: WorkspaceLeaf | null) => {
                if (leaf?.view instanceof MarkdownView) {
                    // this.applyStyles(leaf.view);
                }
            },
            this
        );

        this.app.workspace.on("layout-change", () => {
            // console.log("layout changed");
        });

        this.app.workspace.onLayoutReady(() => {
            const leaves = this.app.workspace.getLeavesOfType("markdown");
            leaves.forEach((leaf) =>
                this.styleProcessor.applyStyle(leaf.view as MarkdownView)
            );
        });

        // this.addSettingTab(new StationerySettingsTab(this.app, this));
    }

    addIcon() {
        this.removeIcon();
        this.ribbonIconEl = this.addRibbonIcon(
            "sigma",
            "Open Stationery",
            (evt: MouseEvent) => {
                this.activateView();
            }
        );
        // Perform additional things with the ribbon
        this.ribbonIconEl.addClass("Stationery-ribbon-class");
    }

    removeIcon() {
        if (this.ribbonIconEl) {
            this.ribbonIconEl.remove();
            this.ribbonIconEl = null;
        }
    }

    onunload() {
        // this.app.workspace.detachLeavesOfType(STATIONERY_VIEW);
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
        gSettings = this.settings;
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async activateView() {
        // this.app.workspace.detachLeavesOfType(STATIONERY_VIEW);

        let leaf = this.app.workspace.getLeavesOfType(STATIONERY_VIEW)[0];

        if (!leaf) {
            await this.app.workspace.getRightLeaf(false).setViewState(
                {
                    type: STATIONERY_VIEW,
                    active: true,
                },
                { settings: this.settings }
            );
            leaf = this.app.workspace.getLeavesOfType(STATIONERY_VIEW)[0];
        }

        leaf && this.app.workspace.revealLeaf(leaf);
    }

    async registerCodeBlock() {
        await loadMathJax();
        await finishRenderMath();
        this.registerMarkdownCodeBlockProcessor(
            "Stationery",
            (source, el, ctx) => {
                // processCodeBlock(source, el, this.settings, ctx);
            }
        );
    }

    async registerPostProcessor() {
        // await loadMathJax();
        // await finishRenderMath();
        // this.registerMarkdownPostProcessor(getPostPrcessor(this.settings));
    }

    async registerEditorExtensions() {
        // this.registerEditorExtension([resultField, StationeryConfigField]);
    }

    

    
}

