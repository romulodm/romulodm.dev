import { CgClose } from "react-icons/cg";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface CustomTooltipProps {
    position: TooltipPosition;
    content: string;
    children: React.ReactNode;
    onClose: () => void;
}

export default function CustomTooltip({ position, content, children, onClose }: CustomTooltipProps): JSX.Element {
    return (
        <div id="tooltip" className="relative group">
            <div className="">
                {children}
            </div>
            <span className={`absolute w-52 rounded-lg inner-block bg-blue-600 text-white text-xs p-2
                            ${position === "top" && 'left-1/2 -translate-x-1/2 bottom-[calc(100%+5px)]'}
                            ${position === "bottom" && 'left-1/2 -translate-x-[50%] top-[calc(100%+5px)]'}
                            ${position === "left" && 'top-1/2 -translate-y-1/2 right-[calc(100%+5px)]'}
                            ${position === "right" && 'top-1/2 -translate-y-1/2 left-[calc(100%+5px)]'}
            `}>
                <div className="flex justify-between px-1 items-center gap-1">
                    <div className="w-full flex items-center justify-center">
                        {content}
                    </div>
                    <CgClose className="cursor-pointer" onClick={onClose} />
                </div>
            </span>
            <span className={`absolute inner-block border-[5px] 
                            ${position === "top" && 'left-1/2 -translate-x-1/4 bottom-full border-l-transparent border-r-transparent border-b-0 border-t-blue-600'}
                            ${position === "bottom" && 'left-1/2 -translate-x-[20%] -translate-y-[-20%] top-full border-l-transparent border-r-transparent border-t-0 border-b-blue-600'}
                            ${position === "left" && 'top-1/2 -translate-y-1/2 right-full border-t-transparent border-b-transparent border-r-0 border-l-blue-600'}
                            ${position === "right" && 'top-1/2 -translate-y-1/2 left-full border-t-transparent border-b-transparent border-l-0 border-r-blue-600'}
            `} />
        </div>
    );
}
