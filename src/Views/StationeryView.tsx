/* eslint-disable @typescript-eslint/ban-types */
import { ColorComponent, debounce, finishRenderMath, ItemView,  Setting,  WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";



import { loadMathJax } from "obsidian";
import { StationerySettings } from "src/Settings";
import { getStationerySettings } from "src/main";
import { useEffect, useRef } from "react";
import ColorPicker from "./ColorPicker";
export const STATIONERY_VIEW = "Stationery-view";

export const StationeryContext = React.createContext<any>({});



export class StationeryView extends ItemView {
    settings: StationerySettings;
    root: Root;
    state = {

    };



    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // this.settings = (this.app as any).plugins.plugins["obsidian-Stationery"].settings as StationerySettings;
        this.settings = getStationerySettings();
        this.state = {

        };
        this.icon = "sigma";
    }

    getViewType() {
        return STATIONERY_VIEW;
    }

    getDisplayText() {
        return "Stationery";
    }

    override onResize(): void {
        super.onResize();
        this.handleResize();
    }

    handleResize = debounce(() => {
        this.render();
    }, 300);




    render() {

        this.root.render(
            <React.StrictMode>
                <StationeryContext.Provider value={{
                    width: this.contentEl.innerWidth,
                    settings: this.settings
                }}>
                   <StationeryComponent settings={this.settings} />
                </StationeryContext.Provider>
            </React.StrictMode>
        );
    }



    async onOpen() {
        const { contentEl } = this;
        // contentEl.setText('Woah!');
        // this.titleEl.setText("Obsidian Janitor")	

        this.root = createRoot(contentEl/*.children[1]*/);
        await loadMathJax();
        await finishRenderMath();
        this.render();
        // const e = nerdamer('x^2+2*(cos(x)+x*x)');
        // const latex = e.toTeX();
        // console.log(latex);
        // const mathEl = renderMath(latex, true);
        // contentEl.appendChild(mathEl);
    }

    async onClose() {

        this.root.unmount();
    }
}

type StationeryComponentProps = {
    settings: StationerySettings
}

const StationeryComponent = ({settings}:StationeryComponentProps) => {

   

    return <div>
        <div>Background Color:
            <ColorPicker color="red" />
        </div>
    </div>
}
