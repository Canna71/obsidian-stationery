import { ColorComponent } from "obsidian";
import * as React from "react";
import { useEffect, useRef } from "react";


const ColorPicker = ({color}:{color:string}) => {

    const el = useRef<HTMLElement>(null);
    console.log("rendering colorpicker")
    useEffect(()=>{
        console.log("creating picker")
        if(el.current){
            new ColorComponent(el.current).setValue(color);
        }
        return ()=>{if(el.current?.firstChild) el.current.removeChild(el.current.firstChild)}
    },[])

    return <span ref={el} ></span>
    
}

export default ColorPicker;
