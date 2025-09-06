// This file defines types and interfaces used in the extension. 

export interface BracketOrQuote {
    type: 'bracket' | 'quote';
    start: number;
    end: number;
}

export interface SelectionChange {
    newStart: number;
    newEnd: number;
}

export interface ReplaceOptions {
    oldValue: string;
    newValue: string;
}