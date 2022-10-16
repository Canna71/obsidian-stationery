/* eslint-disable @typescript-eslint/ban-types */
import { debounce, ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";



import { StationerySettings } from "src/Settings";
import StationeryPlugin from "src/main";
import ColorPicker from "./ColorPicker";
import { useCallback, useEffect, useState } from "react";
import { StationeryMetadata } from "src/styling";
export const STATIONERY_VIEW = "Stationery-view";

export const StationeryContext = React.createContext<any>({});



export class StationeryView extends ItemView {
    // settings: StationerySettings;
    root: Root;
    state = {

    };
    plugin: StationeryPlugin;



    constructor(leaf: WorkspaceLeaf, plugin: StationeryPlugin) {
        super(leaf);
        this.plugin = plugin;
        // this.settings = getStationerySettings();
        this.state = {

        };
        this.icon = "sigma";
        this.onMetadataChanged = this.onMetadataChanged.bind(this);
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


    async onMetadataChanged(md:StationeryMetadata) {

        // const mv = this.app.workspace.getActiveViewOfType(MarkdownView);
        // console.log(mv);
        const leaves = this.app.workspace.getLeavesOfType("markdown");
        await Promise.all(leaves.map(leaf=>{
            const mv = leaf.view as MarkdownView;
            if (mv) {
                return this.plugin.styleProcessor.applyStyle(mv, md);
            }
        }));
        
    }

    render() {

        this.root.render(
            <React.StrictMode>
                <StationeryContext.Provider value={{
                    width: this.contentEl.innerWidth,
                    settings: this.plugin.settings
                }}>
                    <StationeryComponent settings={this.plugin.settings} onMetadataChanged={this.onMetadataChanged} />
                </StationeryContext.Provider>
            </React.StrictMode>
        );
    }



    async onOpen() {
        const { contentEl } = this;


        this.root = createRoot(contentEl);

        this.render();

    }

    async onClose() {

        this.root.unmount();
    }
}

type StationeryComponentProps = {
    settings: StationerySettings,
    onMetadataChanged: (md:StationeryMetadata)=>void
}

// const defaultMetadata: StationeryMetadata = {

// }

interface ToolboxState {
    bgColor: string
    bgColorSet: boolean
}

function stateToMetadata(state: ToolboxState):StationeryMetadata {
    const md:StationeryMetadata = {
        
    };

    if(state.bgColorSet){
        md.background = {...md.background, color: state.bgColor}
    }
    return md;
}

const StationeryComponent = ({ settings, onMetadataChanged }: StationeryComponentProps) => {

    const [state, setState] = useState<ToolboxState>({
        bgColor: "#7766dd",
        bgColorSet: false
    })

    const onBackgroundColorChange = useCallback((value:string)=>{
        setState(state => {
            const newState = {...state, bgColor:value };
            // onMetadataChanged && onMetadataChanged(stateToMetadata(newState));
            return newState;
        }
            
        )
        
    },[])

    const onBackgroundColorSetChange = useCallback((e:React.ChangeEvent<HTMLInputElement>)=>{
        setState(state => {
            const newState = {...state, bgColorSet:e.target.checked };
            // onMetadataChanged && onMetadataChanged(stateToMetadata(newState));
            return newState;
        })
    },[])

    useEffect(()=>{
        onMetadataChanged && onMetadataChanged(stateToMetadata(state));
    },[state])

    return <div className="stationery-toolbox">
        <div className="stationery-toolbox-item">
            <label className="stationery-toolbox-label" >
                <input className="stationery-toolbox-checkbox" type="checkbox" checked={state.bgColorSet} onChange={onBackgroundColorSetChange} />
                Background Color
            </label>
            
            <ColorPicker
                
                onChange={onBackgroundColorChange}
                color={state.bgColor} 
                />
        </div>
    </div>
}
