import { StationeryMetadata } from 'src/styling';

export interface StationerySettings {
    addRibbonIcon: boolean;
    showAtStartup: boolean;
    templates: {
        name: string,
        definition: StationeryMetadata
    }[];
}   

export const DEFAULT_SETTINGS: StationerySettings = {
    addRibbonIcon: false,
    showAtStartup: false,
    templates: []
}

