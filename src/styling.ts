import path from "path";
import fs from "fs/promises";
import { App, MarkdownView } from "obsidian";
import jss from "jss";
import pluginExpand from "jss-plugin-expand";
import StationeryPlugin from "./main";

const CLASS_PREFIX = "stationery-";
const CLASS_NAME_REGEX = /[^_a-zA-Z0-9-]/;
const CLASS_CLEANUP_REGEX = /\bstationery-[^ ]*[ ]?\b/g;

jss.setup({
    plugins: [pluginExpand()],
});

export interface StationeryMetadata {
    background?: {
        color?: string;
        opacity?: number | string;
    };
    frame?: {
        size: string | number; //TODO: support arrays
        radius?: string | number;
        color?: string | number;
        image?: string;
    };
    preset?: string;
}

export interface StationeryStyle {
    content: {
        background: {
            color?: string;
            opacity?: string;
        };
        width?: string;
        margin?: string;
        border?: string;
    };
    frame: {
        background: {
            image?: string;
            color?: string;
        };
    };
    header: {
        margin: number;
    };
}

function sanitizeClassName(name:string){
    return  name.replace(CLASS_NAME_REGEX, "_");
}

function removeTemplateClass(className:string){
    return  className.replace(CLASS_CLEANUP_REGEX, "");
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

        if (!st) {
            const file = mv.file;
            const frontmatter =
                this.app.metadataCache.getFileCache(file)?.frontmatter;
            st = frontmatter?.stationery;
        }

        if (!st) return;

        const style = await this.extractStyleFromMetadata(st);

        this.applyStyleInternal(mv, style);
    }

    private applyStyleInternal(
        mv: MarkdownView,
        style: { content: any; frame: any; header: any },
        templateName?: string
    ) {
        this.removeStyle(mv);
        const sheet = jss.createStyleSheet(style);
        // (mv as any)._sheets = sheet;
        (mv as any)._sheets = (mv as any)._sheets || [];
        (mv as any)._sheets.push(sheet);
        sheet.attach();
        mv.contentEl.addClasses([sheet.classes.content]);
        if(mv.contentEl.parentElement){
            mv.contentEl.parentElement.addClass(sheet.classes.frame);
            if (templateName) {
                mv.contentEl.parentElement.addClass(`${CLASS_PREFIX}-${sanitizeClassName(templateName)}`);
            }
            mv.contentEl.parentElement.firstElementChild?.addClass(
                sheet.classes.header
            );
        }

    }

    private removeStyle(mv: MarkdownView) {
        const sheets = (mv as any)._sheets as any;
        if (sheets) {
            sheets.forEach((sheet: any) => {
                mv.contentEl.removeClasses([sheet.classes.content]);
                if(mv.contentEl.parentElement){
                    mv.contentEl.parentElement.removeClasses([
                        sheet.classes.frame,
                    ]);
                    mv.contentEl.parentElement.className=removeTemplateClass(mv.contentEl.parentElement.className)
                    mv.contentEl.parentElement.firstElementChild?.removeClasses([
                        sheet.classes.header,
                    ]);
                }

                jss.removeStyleSheet(sheet);
            });
            (mv as any)._sheets = undefined;
        }
    }

    private async extractStyleFromMetadata(
        st: StationeryMetadata
    ): Promise<StationeryStyle> {
        const content: any = {
            background: {},
        };
        if (st.background?.color) {
            content.background.color = `${st.background?.color} !important`;
        }
        if (st.background?.opacity) {
            content.opacity = `${st.background?.opacity}`;
        }
        let frameSize = st.frame?.size;
        if (frameSize && isFinite(frameSize as number)) {
            //TODO: support arrays
            frameSize = `${frameSize}`;

            if (!frameSize.endsWith("px")) frameSize = `${frameSize}px`;

            content.width = `calc(100% - 2*${frameSize})`;
            content.height = `calc(100% - 2*${frameSize} - var(--header-height)) !important`;

            content.margin = `${frameSize}`;
        }
        let frameRadius = st.frame?.radius;
        if (frameRadius && isFinite(frameRadius as number)) {
            frameRadius = `${frameRadius}`;
            if (!frameRadius.endsWith("px")) frameRadius = `${frameRadius}px`;
            content.border = {
                radius: frameRadius,
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
            if (imgUrl) {
                frame.background.image = imgUrl;
                frame.background.size = "cover";
            }
        }
        if (st.frame?.color) {
            frame.background.color = st.frame?.color;
        }

        const header = {
            margin: 0,
        };

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const style = {
            content,
            frame,
            header,
        };
        return style;
    }

    private async processImage(imgUrl?: string): Promise<string | undefined> {
        if (!imgUrl) return undefined;

        if (!imgUrl.toUpperCase().startsWith("HTTP")) {
            try {
                const imagePath = path.join(this.basePath, imgUrl);

                const image = await fs.readFile(imagePath, {
                    encoding: "base64",
                });
                imgUrl = "data:image/jpeg;base64," + image;
            } catch (ex) {
                if (!(ex.code === "EISDIR" || ex.code === "ENOENT")) {
                    console.warn(ex);
                }
                imgUrl = undefined;
            }
        }
        imgUrl = imgUrl && `url(${imgUrl})`;
        return imgUrl;
    }
}
