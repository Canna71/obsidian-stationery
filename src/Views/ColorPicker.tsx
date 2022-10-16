import { ColorComponent } from "obsidian";
import * as React from "react";
import { useEffect, useRef } from "react";

export interface ColorPickerProps {
    color: string,
    onChange?: (value: string) => void,
    disabled?: boolean
}

const ColorPicker = ({ color, onChange, disabled=false }: ColorPickerProps) => {

    const el = useRef<HTMLElement>(null);
    useEffect(() => {
        if (el.current) {
            new ColorComponent(el.current)
                .setValue(color)
                .onChange((value: string) => {
                    onChange && onChange(value)
                })
                .setDisabled(disabled)

                ;
        }
        return () => { if (el.current?.firstChild) el.current.removeChild(el.current.firstChild) }
    }, [])

    return <span className="stationery-toolboc-color" ref={el} ></span>

}

export default ColorPicker;
