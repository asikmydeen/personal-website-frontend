import * as ResizablePrimitive from "react-resizable-panels";
declare const ResizablePanelGroup: ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => import("react/jsx-runtime").JSX.Element;
declare const ResizablePanel: import("react").ForwardRefExoticComponent<Omit<import("react").HTMLAttributes<HTMLDivElement | HTMLElement | HTMLHeadingElement | HTMLParagraphElement | HTMLAnchorElement | HTMLButtonElement | HTMLImageElement | HTMLInputElement | HTMLLabelElement | HTMLUListElement | HTMLOListElement | HTMLLIElement | HTMLSpanElement | HTMLObjectElement | HTMLProgressElement | HTMLTableElement | HTMLEmbedElement | HTMLStyleElement | HTMLMeterElement | HTMLTextAreaElement | HTMLPreElement | HTMLDialogElement | HTMLFormElement | HTMLLinkElement | HTMLOptionElement | HTMLTimeElement | HTMLAreaElement | HTMLAudioElement | HTMLBaseElement | HTMLQuoteElement | HTMLBodyElement | HTMLBRElement | HTMLCanvasElement | HTMLTableColElement | HTMLDataElement | HTMLDataListElement | HTMLModElement | HTMLDetailsElement | HTMLDListElement | HTMLFieldSetElement | HTMLHeadElement | HTMLHRElement | HTMLHtmlElement | HTMLIFrameElement | HTMLLegendElement | HTMLMapElement | HTMLMetaElement | HTMLOptGroupElement | HTMLOutputElement | HTMLSlotElement | HTMLScriptElement | HTMLSelectElement | HTMLSourceElement | HTMLTemplateElement | HTMLTableSectionElement | HTMLTableCellElement | HTMLTitleElement | HTMLTableRowElement | HTMLTrackElement | HTMLVideoElement | HTMLTableCaptionElement | HTMLMenuElement | HTMLPictureElement>, "id" | "onResize"> & {
    className?: string | undefined;
    collapsedSize?: number | undefined;
    collapsible?: boolean | undefined;
    defaultSize?: number | undefined;
    id?: string | undefined;
    maxSize?: number | undefined;
    minSize?: number | undefined;
    onCollapse?: ResizablePrimitive.PanelOnCollapse | undefined;
    onExpand?: ResizablePrimitive.PanelOnExpand | undefined;
    onResize?: ResizablePrimitive.PanelOnResize | undefined;
    order?: number | undefined;
    style?: object | undefined;
    tagName?: keyof HTMLElementTagNameMap | undefined;
} & {
    children?: import("react").ReactNode;
} & import("react").RefAttributes<ResizablePrimitive.ImperativePanelHandle>>;
declare const ResizableHandle: ({ withHandle, className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
    withHandle?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
