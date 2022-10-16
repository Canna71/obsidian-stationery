import path from "path";
import fs from "fs/promises";
import { App, MarkdownView } from "obsidian";
import jss from "jss";
import pluginExpand from "jss-plugin-expand";
import StationeryPlugin from "./main";

const CONTENT_CLASS = "stationary-content";

jss.setup({
    plugins: [pluginExpand()],
});

export interface StationeryMetadata {
    background?: {
        color?: string,
        opacity?: number | string
    },
    frame?: {
        size: string | number, //TODO: support arrays
        radius?: string | number,
        color?: string | number,
        image?: string
    },
    preset?: string
}

export interface StationeryStyle {
    content: {
        background: {
            color?: string,
            opacity?: string
        },
        width?: string,
        margin?: string,
        border?: string
    },
    frame: {
        background: {
            image?: string,
            color?: string
        }
    }
}

export class StyleProcessor {
    app: App;
    basePath: string;

   
    constructor(plugin: StationeryPlugin) {
        this.app = plugin.app;
        this.basePath = path.join(
            (this.app.vault.adapter as any).getBasePath(),
            plugin.manifest.dir || ""
        );
    }

    async applyStyle(mv: MarkdownView, st?: StationeryMetadata) {
        // workspace-leaf mod-active
        // parent us
        // class="workspace-leaf-content" data-type="markdown" data-mode="source" style="/* background: pink; *//* padding: 20px; */"><div class="view-header"><div class="view-header-icon" draggable="tr
    
        // const contentEl = mv.contentEl;
        // const parent = contentEl.parentElement;
        
    
        this.removeStyle(mv);
    
        if(!st){
            const file = mv.file;
            const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
            st = frontmatter?.stationery;
        }
        
        if (!st) return;
    
        const style = await this.extractStyleFromMetadata(st);
    
        this.applyStyleInternal(mv, style);
    }

    private applyStyleInternal( mv: MarkdownView, style: { content: any; frame: any; }) {
        this.removeStyle(mv);
        const sheet = jss.createStyleSheet(style);
        // (mv as any)._sheets = sheet;
        (mv as any)._sheets = (mv as any)._sheets || [];
        (mv as any)._sheets.push(sheet);
        sheet.attach();
        mv.contentEl.addClasses([CONTENT_CLASS, sheet.classes.content]);
        mv.contentEl.parentElement?.addClass(sheet.classes.frame);
    }

    private removeStyle(mv: MarkdownView) {
        const sheets = (mv as any)._sheets as any;
        if (sheets) { 
            sheets.forEach((sheet:any)=>{
                mv.contentEl.removeClasses([CONTENT_CLASS, sheet.classes.content]);
                mv.contentEl.parentElement?.removeClasses([sheet.classes.frame]);
                jss.removeStyleSheet(sheet);
            });
            (mv as any)._sheets = undefined;  
        }
        
    }

    private async extractStyleFromMetadata(st: StationeryMetadata) : Promise<StationeryStyle> {
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
        return style;
    }

    private async processImage(imgUrl: string):Promise<string> {
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









