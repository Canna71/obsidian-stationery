import { ColorComponent } from "obsidian";
import * as React from "react";
import { useEffect, useRef } from "react";


const ColorPicker = ({color,onChange}:{color:string, onChange?: (value:string)=>void}) => {

    const el = useRef<HTMLElement>(null);
    useEffect(()=>{
        if(el.current){
            new ColorComponent(el.current)
            .setValue(color)
            .onChange((value:string)=>{
                onChange && onChange(value)
            })
            
            ;
        }
        return ()=>{if(el.current?.firstChild) el.current.removeChild(el.current.firstChild)}
    },[])

    return <span ref={el} ></span>
    
}

export default ColorPicker;
