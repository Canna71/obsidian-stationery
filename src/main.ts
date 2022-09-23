import { DEFAULT_SETTINGS, StationerySettings } from "src/Settings";
import { addIcon, MarkdownView, normalizePath } from "obsidian";
import jss from "jss";
import pluginExpand from "jss-plugin-expand";
// import { MathResult } from './Extensions/ResultMarkdownChild';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { StationeryView, STATIONERY_VIEW } from "../Views/StationeryView";
import {
    App,
    finishRenderMath,
    loadMathJax,
    Modal,
    Plugin,
    WorkspaceLeaf,
} from "obsidian";
import { StationerySettingsTab } from "src/SettingTab";

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

    async onload() {
        await this.loadSettings();

        this.registerView(STATIONERY_VIEW, (leaf) => new StationeryView(leaf));

        addIcon("sigma", sigma);

        if (this.settings.addRibbonIcon) {
            // This creates an icon in the left ribbon.
            const ribbonIconEl = this.addRibbonIcon(
                "sigma",
                "Open Stationery",
                (evt: MouseEvent) => {
                    this.activateView();
                }
            );
            // Perform additional things with the ribbon
            ribbonIconEl.addClass("Stationery-ribbon-class");
        }

        this.addCommand({
            id: "show-Stationery-view",
            name: "Show Stationery Sidebar",
            callback: () => this.activateView(),
        });

        this.app.workspace.onLayoutReady(() => {
            if (this.settings.showAtStartup) {
                this.activateView();
            }
        });

        this.registerCodeBlock();
        this.registerPostProcessor();
        this.registerEditorExtensions();

        this.app.workspace.on("file-open", (file) => {
            const mv = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (mv) {
                this.applyStyles(mv);
            }
        });

        this.app.workspace.on("window-open", (win, ctx) => {
            console.log(win, ctx);
        });

        this.app.workspace.on(
            "active-leaf-change",
            (leaf: WorkspaceLeaf | null) => {
                if (leaf?.view instanceof MarkdownView) {
                    const contentEl = leaf.view.contentEl;
                    // this.applyStyles(contentEl);
                }
            },
            this
        );
        //TODO: apply upon launch
        this.app.workspace.on("layout-change", () => {
            // console.log("layout changed");
        });

        this.addSettingTab(new StationerySettingsTab(this.app, this));
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(STATIONERY_VIEW);
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
        this.app.workspace.detachLeavesOfType(STATIONERY_VIEW);

        await this.app.workspace.getRightLeaf(false).setViewState(
            {
                type: STATIONERY_VIEW,
                active: true,
            },
            { settings: this.settings }
        );

        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(STATIONERY_VIEW)[0]
        );
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

    applyStyles(mv: MarkdownView) {
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
        if(st.frame?.radius) {
            content.border = {
                radius: st.frame?.radius
            }
        } 

        const frame: any = {
            background: {},
        };

        if(st.frame?.image){
            let imgUrl = st.frame?.image as string;
            if(!imgUrl.toUpperCase().startsWith("HTTP")){
                imgUrl=normalizePath(`img/`+imgUrl);
            }
            imgUrl = `url(${imgUrl})`
            frame.background.image = imgUrl;
        }
        if(st.frame?.color){
            frame.background.color = st.frame?.color;
        }
        

        const style = {
            content,

            frame
        };
        

        console.log(st);
        console.log(style);
        sheet = jss.createStyleSheet(style);
        (mv as any)._sheet = sheet;
        sheet.attach();
        contentEl.addClasses([CONTENT_CLASS, sheet.classes.content]);
        parent?.addClass(sheet.classes.frame);
    }
}
