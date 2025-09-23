import { useLocation } from "react-router-dom";

export default function getActualRoute() {
    const path = useLocation().pathname.split('/');
    return path[1];
}