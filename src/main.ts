import { DEFAULT_SETTINGS, StationerySettings } from "src/Settings";
import { addIcon, MarkdownView } from "obsidian";
import jss from "jss";
import pluginExpand from "jss-plugin-expand";
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
import { StationerySettingsTab } from "src/SettingTab";
import path from "path";
import fs from "fs/promises";
import { Console } from "console";

const CONTENT_CLASS = "stationary-content";

const sigma = `<path stroke="currentColor" fill="none" d="M78.6067 22.8905L78.6067 7.71171L17.8914 7.71171L48.2491 48.1886L17.8914 88.6654L78.6067 88.6654L78.6067 73.4866" opacity="1"  stroke-linecap="round" stroke-linejoin="round" stroke-width="6" />
`;

// Remember to rename these classes and interfaces!

let gSettings: StationerySettings;

export function getStationerySettings() {
    return gSettings;
}

jss.setup({
    plugins: [pluginExpand()],
});
export default class StationeryPlugin extends Plugin {
    settings: StationerySettings;
    basePath: string;
    ribbonIconEl: HTMLElement | null;

    async onload() {
        await this.loadSettings();
        console.log("Loading Stationery ");
        this.basePath = path.join(
            (this.app.vault.adapter as any).getBasePath(),
            this.manifest.dir || ""
        );

        this.registerView(STATIONERY_VIEW, (leaf) => new StationeryView(leaf));

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
                    this.applyStyles(leaf.view as MarkdownView)
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
                    this.applyStyles(mv);
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
                this.applyStyles(leaf.view as MarkdownView)
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

    async applyStyles(mv: MarkdownView) {
        // workspace-leaf mod-active
        // parent us
        // class="workspace-leaf-content" data-type="markdown" data-mode="source" style="/* background: pink; *//* padding: 20px; */"><div class="view-header"><div class="view-header-icon" draggable="tr

        const contentEl = mv.contentEl;
        const parent = contentEl.parentElement;
        const file = mv.file;

        let sheet = (mv as any)._sheet;
        if (sheet) {
            contentEl.removeClasses([CONTENT_CLASS, sheet.classes.content]);
            parent?.removeClasses([sheet.classes.frame]);
            jss.removeStyleSheet((mv as any)._sheet);
        }

        const frontmatter =
            this.app.metadataCache.getFileCache(file)?.frontmatter;
        const st = frontmatter?.stationery;
        if (!st) return;

        const content: any = {
            background: {},
        };
        if (st.background?.color) {
            content.background.color = `${st.background?.color} !important`;
        }
        if (st.background?.opacity) {
            content.opacity = `${st.background?.opacity}`;
        }
        if (st.frame?.size) {
            //TODO: support arrays
            //and numeric
            content.width = `calc(100% - 2*${st.frame?.size})`;
            content.margin = `${st.frame?.size}`;
        }
        if (st.frame?.radius) {
            content.border = {
                radius: st.frame?.radius,
            };
        }

        if (st.preset === "lined") {
            content.background =
                "repeating-linear-gradient(transparent, transparent 23px, var(--background-modifier-border) 23px, var(--background-modifier-border) 24px)";
        }
        if (st.preset === "squared") {
            content.background.size = "24px 24px";
            content.background.image = `linear-gradient(to right, var(--background-modifier-border) 1px, transparent 1px)
            ,linear-gradient(to bottom, var(--background-modifier-border) 1px, transparent 1px)
            `;
        }
        const frame: any = {
            background: {},
        };

        if (st.frame?.image) {
            const imgUrl = await this.processImage(st.frame?.image);
            frame.background.image = imgUrl;
        }
        if (st.frame?.color) {
            frame.background.color = st.frame?.color;
        }

        // eslint-disable-next-line @typescript-eslint/no-var-requires

        const style = {
            content,
            frame,
        };

        sheet = jss.createStyleSheet(style);
        (mv as any)._sheet = sheet;
        sheet.attach();
        contentEl.addClasses([CONTENT_CLASS, sheet.classes.content]);
        parent?.addClass(sheet.classes.frame);
    }

    private async processImage(imgUrl: string) {
        if (!imgUrl.toUpperCase) {
            console.log(imgUrl);
        }
        if (!imgUrl.toUpperCase().startsWith("HTTP")) {
            try {
                const imagePath = path.join(this.basePath, imgUrl);
                const image = await fs.readFile(imagePath, {
                    encoding: "base64",
                });
                imgUrl = "data:image/jpeg;base64," + image;
            } catch (ex) {
                console.warn(ex);
            }
        }
        imgUrl = `url(${imgUrl})`;
        return imgUrl;
    }
}
