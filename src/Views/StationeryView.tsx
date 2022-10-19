/* eslint-disable @typescript-eslint/ban-types */
import { debounce, ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";



import { StationerySettings } from "src/Settings";
import StationeryPlugin from "src/main";
import ColorPicker from "./ColorPicker";
import { useCallback, useEffect, useState } from "react";
import { StationeryMetadata } from "src/styling";
import Slider from "./Slider";
export const STATIONERY_VIEW = "Stationery-view";

export const StationeryContext = React.createContext<any>({});

const FRAME_MAX_SIZE = 100;
const FRAME_MAX_RADIUS = 50;

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
    opacity: number,
    opacitySet: boolean,
    frameSize: number,
    frameColorSet: boolean,
    frameColor: string,
    frameRadius: number,
    frameImg:string
}

function stateToMetadata(state: ToolboxState):StationeryMetadata {
    const md:StationeryMetadata = {
        
    };

    if(state.bgColorSet){
        md.background = {...md.background, color: state.bgColor}
    }
    if(state.opacitySet){
        md.background = {...md.background, opacity: state.opacity}
    }
    if(state.frameSize>0){
        md.frame = {...md.frame, size:state.frameSize};
        if(state.frameColorSet){
            md.frame = {...md.frame, color:state.frameColor}
        }
        if(state.frameRadius>0){
            md.frame = {...md.frame, radius: state.frameRadius}
        }
        if(state.frameImg && state.frameImg.length){
            md.frame = {...md.frame, image: state.frameImg }
        }
    }
    
    return md;
}

const StationeryComponent = ({ settings, onMetadataChanged }: StationeryComponentProps) => {

    const [state, setState] = useState<ToolboxState>({
        bgColor: "#7766dd",
        bgColorSet: false,
        opacity: 1.0,
        opacitySet: false,
        frameSize: 0.0,
        frameColorSet: false,
        frameColor: "#66dd77",
        frameRadius: 0.0,
        frameImg: ""
    })

    const onBackgroundColorChange = useCallback((value:string)=>{
        setState(state => ({...state, bgColor:value }))    
    },[])

    const onBackgroundColorSetChange = useCallback((e:React.ChangeEvent<HTMLInputElement>)=>{
        setState(state => ({...state, bgColorSet:e.target.checked }))
    },[])

    const onOpacitySetChange = useCallback((e:React.ChangeEvent<HTMLInputElement>)=>{
        setState(state => ({...state, opacitySet:e.target.checked }))
    },[])

    const onOpacityChange = useCallback((value:number)=>{
        setState(state => ({...state, opacity:value }))    
    },[])

    const onFrameSizeChange = useCallback((value:number)=>{
        setState(state => ({...state, frameSize:value }))    
    },[])

    const onFrameColorChange = useCallback((value:string)=>{
        setState(state => ({...state, frameColor:value }))    
    },[])

    const onFrameColorSetChange = useCallback((e:React.ChangeEvent<HTMLInputElement>)=>{
        setState(state => ({...state, frameColorSet:e.target.checked }))
    },[])

    const onFrameRadiusChange = useCallback((value:number)=>{
        setState(state => ({...state, frameRadius:value }))    
    },[])

    const onFrameImgChange = useCallback((e:React.ChangeEvent<HTMLInputElement>)=>{
        setState(state => ({...state, frameImg:e.target.value }))    
    },[])

    // this is to reflect the changes on the current pages as a preview
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
                disabled={!state.bgColorSet}
                onChange={onBackgroundColorChange}
                color={state.bgColor} 
                />
        </div>

        <div className="stationery-toolbox-item">
            <label className="stationery-toolbox-label" >
                <input className="stationery-toolbox-checkbox" 
                type="checkbox" checked={state.opacitySet} onChange={onOpacitySetChange} />
                Opacity
            </label>
            
            <Slider
                value={state.opacity}
                disabled={!state.opacitySet}
                min={0}
                max={1}
                step={0.01}
                onChange={onOpacityChange}
                />
            <span className="stationery-toolbox-value">{Number(state.opacity).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:0}) }</span>
        </div>
        <div className="stationery-toolbox-item">
            <label className="stationery-toolbox-label" >
                Frame Size
            </label>
            
            <Slider
                value={state.frameSize}
                
                min={0}
                max={FRAME_MAX_SIZE}
                step={1}
                onChange={onFrameSizeChange}
                />
            <span className="stationery-toolbox-value">{Number(state.frameSize).toLocaleString(undefined) }</span>
        </div>

        <div className="stationery-toolbox-item">
            <label className="stationery-toolbox-label" >
                Frame Radius
            </label>
            
            <Slider
                value={state.frameRadius}
                disabled={state.frameSize<1}
                min={0}
                max={FRAME_MAX_RADIUS}
                step={1}
                onChange={onFrameRadiusChange}
                />
            <span className="stationery-toolbox-value">{Number(state.frameRadius).toLocaleString(undefined) }</span>
        </div>

        <div className="stationery-toolbox-item">
            <label className="stationery-toolbox-label" >
                <input className="stationery-toolbox-checkbox" type="checkbox" checked={state.frameColorSet} onChange={onFrameColorSetChange} />
                Frame Color
            </label>
            
            <ColorPicker
                disabled={!state.frameColorSet}
                onChange={onFrameColorChange}
                color={state.frameColor} 
                />
        </div>
        <div className="stationery-toolbox-item">
            <label className="stationery-toolbox-label" >
                Frame Image
            </label>
            <input className="stationery-toolbox-text" type="text" value={state.frameImg}
                onChange={onFrameImgChange}
            />
            
        </div>
    </div>
}
