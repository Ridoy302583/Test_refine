import React, { useState, useRef, useEffect, useCallback } from "react";
import Erase from '../../icons/whiteboard/erase.svg';
import Star from '../../icons/whiteboard/star.svg';
import Download from '../../icons/whiteboard/download.svg';

interface WhiteBoardProps {
    handleWhiteBoardClose: () => void;
    setDrawImage: (image: string | null) => void;
}

interface DrawObject {
    id: string;
    type: string;
    color: string;
    strokeWidth: number;
    fill?: string;
    points?: { x: number, y: number }[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    fontSize?: number;
    selected?: boolean;
    opacity?: number;
    rotation?: number;
    zIndex: number; // Added zIndex for layer management
}

const DEFAULT_COLORS = [
    "#df4b26", "#2d9bf0", "#27ae60", "#f1c40f", "#8e44ad", "#e74c3c", 
    "#1abc9c", "#f39c12", "#2c3e50", "#16a085", "#d35400"
];

const CANVAS_COLORS = [
    "#FFFFFF", "#F8F9FA", "#F1F3F5", "#E9ECEF", "#DEE2E6", 
    "#CED4DA", "#ADB5BD", "#868E96", "#495057", "#343A40", "#212529"
];

const generateId = () => `${Date.now()}-${Math.random()}`;

const WhiteBoard: React.FC<WhiteBoardProps> = ({ handleWhiteBoardClose, setDrawImage }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<string>("select");
    const [penTool, setPenTool] = useState<boolean>(true);
    const [textMode, setTextMode] = useState<boolean>(false);
    const [eraseMode, setEraseMode] = useState<boolean>(false);
    const [filled, setFilled] = useState<boolean>(false);
    const [color, setColor] = useState<string>("#df4b26");
    const [canvasColor, setCanvasColor] = useState<string>("#FFFFFF");
    const [penWidth, setPenWidth] = useState<number>(5);
    const [shapeStrokeWidth, setShapeStrokeWidth] = useState<number>(2);
    const [objects, setObjects] = useState<DrawObject[]>([]);
    const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
    const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
    const [currentObject, setCurrentObject] = useState<DrawObject | null>(null);
    const [textInput, setTextInput] = useState<string>("");
    const [fontSize, setFontSize] = useState<number>(20);
    const [textPosition, setTextPosition] = useState<{x: number, y: number} | null>(null);
    const [selectedObject, setSelectedObject] = useState<string | null>(null);
    const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [draggingObject, setDraggingObject] = useState<{ id: string, offsetX: number, offsetY: number } | null>(null);
    const [undoStack, setUndoStack] = useState<DrawObject[][]>([]);
    const [redoStack, setRedoStack] = useState<DrawObject[][]>([]);
    const [opacity, setOpacity] = useState<number>(100);
    const [isRotating, setIsRotating] = useState<boolean>(false);
    const [rotationStartAngle, setRotationStartAngle] = useState<number>(0);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [grid, setGrid] = useState<boolean>(false);
    const [gridSize, setGridSize] = useState<number>(20);
    const [showColorPalette, setShowColorPalette] = useState<boolean>(false);
    const [showShapeSelector, setShowShapeSelector] = useState<boolean>(true);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [maxZIndex, setMaxZIndex] = useState<number>(0);
    const [showCanvasColorPicker, setShowCanvasColorPicker] = useState<boolean>(false);
    
    // Define shape options for the left sidebar
    const shapeOptions = [
        { name: "Rectangle", value: "rect", icon: "■" },
        { name: "Rounded Rectangle", value: "roundedRect", icon: "⬭" },
        { name: "Circle", value: "circle", icon: "⬤" },
        { name: "Triangle", value: "triangle", icon: "▲" },
        { name: "Line", value: "line", icon: "╱" },
        { name: "Arrow", value: "arrow", icon: "→" },
        { name: "Star", value: "star", icon: "★" },
        { name: "Text", value: "text", icon: "T" },
    ];

    // Initialize canvas and context
    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                setCtx(context);
            }
        }
    }, []);

    // Setup canvas size
    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasContainerRef.current) {
                const width = window.innerWidth * 0.85;
                const height = window.innerHeight * 0.85;
                setCanvasSize({ width, height });
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    // Draw all objects on canvas
    useEffect(() => {
        if (!ctx || !canvasRef.current) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Set background color
        ctx.fillStyle = canvasColor;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw background image if exists
        if (backgroundImage) {
            const img = new Image();
            img.src = backgroundImage;
            if (img.complete) {
                ctx.globalAlpha = 0.3;
                ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.globalAlpha = 1.0;
            } else {
                img.onload = () => {
                    ctx.globalAlpha = 0.3;
                    ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.globalAlpha = 1.0;
                };
            }
        }

        // Draw grid if enabled
        if (grid) {
            ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            // Draw vertical lines
            for (let x = 0; x <= canvasRef.current.width; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvasRef.current.height);
            }
            
            // Draw horizontal lines
            for (let y = 0; y <= canvasRef.current.height; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(canvasRef.current.width, y);
            }
            
            ctx.stroke();
        }

        // Sort objects by zIndex to draw them in the correct order
        const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

        // Draw all objects
        sortedObjects.forEach(obj => {
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.globalAlpha = (obj.opacity !== undefined ? obj.opacity : 100) / 100;

            // Apply rotation if specified
            if (obj.rotation !== undefined && obj.rotation !== 0 && obj.x !== undefined && obj.y !== undefined) {
                ctx.save();
                ctx.translate(obj.x, obj.y);
                ctx.rotate((obj.rotation * Math.PI) / 180);
                ctx.translate(-obj.x, -obj.y);
            }

            // Draw selection indicator if object is selected
            if (obj.id === selectedObject) {
                ctx.save();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                
                if (obj.type === 'path' && obj.points) {
                    // Calculate bounding box for path
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    obj.points.forEach(point => {
                        minX = Math.min(minX, point.x);
                        minY = Math.min(minY, point.y);
                        maxX = Math.max(maxX, point.x);
                        maxY = Math.max(maxY, point.y);
                    });
                    
                    ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
                    
                    // Draw rotation handle
                    ctx.beginPath();
                    ctx.arc(maxX + 5, minY - 5, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#3b82f6';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.setLineDash([]);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else if (obj.type === 'rect' && obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                    ctx.strokeRect(obj.x - 5, obj.y - 5, obj.width + 10, obj.height + 10);
                    
                    // Draw rotation handle
                    ctx.beginPath();
                    ctx.arc(obj.x + obj.width + 5, obj.y - 5, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#3b82f6';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.setLineDash([]);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else if (obj.type === 'circle' && obj.x !== undefined && obj.y !== undefined && obj.radius !== undefined) {
                    ctx.strokeRect(obj.x - obj.radius - 5, obj.y - obj.radius - 5, obj.radius * 2 + 10, obj.radius * 2 + 10);
                    
                    // Draw rotation handle
                    ctx.beginPath();
                    ctx.arc(obj.x + obj.radius + 5, obj.y - obj.radius - 5, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#3b82f6';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.setLineDash([]);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else if (obj.type === 'triangle' && obj.points) {
                    // Calculate bounding box for triangle
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    obj.points.forEach(point => {
                        minX = Math.min(minX, point.x);
                        minY = Math.min(minY, point.y);
                        maxX = Math.max(maxX, point.x);
                        maxY = Math.max(maxY, point.y);
                    });
                    
                    ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
                    
                    // Draw rotation handle
                    ctx.beginPath();
                    ctx.arc(maxX + 5, minY - 5, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#3b82f6';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.setLineDash([]);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else if (obj.type === 'text' && obj.x !== undefined && obj.y !== undefined && obj.text) {
                    const metrics = ctx.measureText(obj.text);
                    const height = obj.fontSize || 20;
                    ctx.strokeRect(obj.x - 5, obj.y - height, metrics.width + 10, height + 10);
                    
                    // Draw rotation handle
                    ctx.beginPath();
                    ctx.arc(obj.x + metrics.width + 5, obj.y - height - 5, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#3b82f6';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.setLineDash([]);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                
                ctx.restore();
            }

            // Draw the actual object
            ctx.strokeStyle = obj.color;
            ctx.fillStyle = obj.fill || 'transparent';
            ctx.lineWidth = obj.strokeWidth;
            ctx.setLineDash([]);

            if (obj.type === 'path' && obj.points && obj.points.length > 0) {
                ctx.beginPath();
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                for (let i = 1; i < obj.points.length; i++) {
                    ctx.lineTo(obj.points[i].x, obj.points[i].y);
                }
                ctx.stroke();
            } else if (obj.type === 'rect' && obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                ctx.beginPath();
                ctx.rect(obj.x, obj.y, obj.width, obj.height);
                if (obj.fill !== 'transparent') {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (obj.type === 'roundedRect' && obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                const radius = 10;
                ctx.beginPath();
                ctx.moveTo(obj.x + radius, obj.y);
                ctx.lineTo(obj.x + obj.width - radius, obj.y);
                ctx.arcTo(obj.x + obj.width, obj.y, obj.x + obj.width, obj.y + radius, radius);
                ctx.lineTo(obj.x + obj.width, obj.y + obj.height - radius);
                ctx.arcTo(obj.x + obj.width, obj.y + obj.height, obj.x + obj.width - radius, obj.y + obj.height, radius);
                ctx.lineTo(obj.x + radius, obj.y + obj.height);
                ctx.arcTo(obj.x, obj.y + obj.height, obj.x, obj.y + obj.height - radius, radius);
                ctx.lineTo(obj.x, obj.y + radius);
                ctx.arcTo(obj.x, obj.y, obj.x + radius, obj.y, radius);
                ctx.closePath();
                if (obj.fill !== 'transparent') {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (obj.type === 'circle' && obj.x !== undefined && obj.y !== undefined && obj.radius !== undefined) {
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                if (obj.fill !== 'transparent') {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (obj.type === 'triangle' && obj.points && obj.points.length === 3) {
                ctx.beginPath();
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                ctx.lineTo(obj.points[1].x, obj.points[1].y);
                ctx.lineTo(obj.points[2].x, obj.points[2].y);
                ctx.closePath();
                if (obj.fill !== 'transparent') {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (obj.type === 'text' && obj.x !== undefined && obj.y !== undefined && obj.text) {
                ctx.font = `${obj.fontSize || 20}px Arial`;
                ctx.fillStyle = obj.color;
                ctx.fillText(obj.text, obj.x, obj.y);
            } else if (obj.type === 'arrow' && obj.points && obj.points.length === 2) {
                const startPoint = obj.points[0];
                const endPoint = obj.points[1];
                
                // Calculate the angle of the line
                const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
                
                // Calculate the points for the arrowhead
                const arrowSize = obj.strokeWidth * 4;
                const arrowPoint1 = {
                    x: endPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
                    y: endPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
                };
                const arrowPoint2 = {
                    x: endPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
                    y: endPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
                };
                
                // Draw the line
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
                
                // Draw the arrowhead
                ctx.beginPath();
                ctx.moveTo(endPoint.x, endPoint.y);
                ctx.lineTo(arrowPoint1.x, arrowPoint1.y);
                ctx.lineTo(arrowPoint2.x, arrowPoint2.y);
                ctx.closePath();
                ctx.fillStyle = obj.color;
                ctx.fill();
            } else if (obj.type === 'line' && obj.points && obj.points.length === 2) {
                const startPoint = obj.points[0];
                const endPoint = obj.points[1];
                
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
            } else if (obj.type === 'star' && obj.x !== undefined && obj.y !== undefined && obj.radius !== undefined) {
                const outerRadius = obj.radius;
                const innerRadius = obj.radius / 2;
                const spikes = 5;
                
                ctx.beginPath();
                let rot = Math.PI / 2 * 3;
                const step = Math.PI / spikes;
                
                ctx.moveTo(obj.x + outerRadius * Math.cos(rot), obj.y + outerRadius * Math.sin(rot));
                
                for (let i = 0; i < spikes; i++) {
                    rot += step;
                    ctx.lineTo(obj.x + innerRadius * Math.cos(rot), obj.y + innerRadius * Math.sin(rot));
                    rot += step;
                    ctx.lineTo(obj.x + outerRadius * Math.cos(rot), obj.y + outerRadius * Math.sin(rot));
                }
                
                ctx.closePath();
                if (obj.fill !== 'transparent') {
                    ctx.fill();
                }
                ctx.stroke();
            }

            // Restore rotation context if needed
            if (obj.rotation !== undefined && obj.rotation !== 0) {
                ctx.restore();
            }
            
            // Reset global alpha
            ctx.globalAlpha = 1.0;
        });

        // Draw current path while drawing
        if (isDrawing && currentPath.length > 0 && penTool) {
            ctx.strokeStyle = color;
            ctx.lineWidth = penWidth;
            ctx.globalAlpha = opacity / 100;
            ctx.beginPath();
            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            
            for (let i = 1; i < currentPath.length; i++) {
                ctx.lineTo(currentPath[i].x, currentPath[i].y);
            }
            
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Draw current shape while drawing
        if (isDrawing && startPos && currentObject && !penTool && !textMode) {
            ctx.strokeStyle = color;
            ctx.fillStyle = filled ? color : 'transparent';
            ctx.lineWidth = shapeStrokeWidth;
            ctx.globalAlpha = opacity / 100;

            if (currentObject.type === 'rect' && currentObject.width !== undefined && currentObject.height !== undefined) {
                ctx.beginPath();
                ctx.rect(startPos.x, startPos.y, currentObject.width, currentObject.height);
                if (filled) {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (currentObject.type === 'roundedRect' && currentObject.width !== undefined && currentObject.height !== undefined) {
                const radius = 10;
                ctx.beginPath();
                ctx.moveTo(startPos.x + radius, startPos.y);
                ctx.lineTo(startPos.x + currentObject.width - radius, startPos.y);
                ctx.arcTo(startPos.x + currentObject.width, startPos.y, startPos.x + currentObject.width, startPos.y + radius, radius);
                ctx.lineTo(startPos.x + currentObject.width, startPos.y + currentObject.height - radius);
                ctx.arcTo(startPos.x + currentObject.width, startPos.y + currentObject.height, startPos.x + currentObject.width - radius, startPos.y + currentObject.height, radius);
                ctx.lineTo(startPos.x + radius, startPos.y + currentObject.height);
                ctx.arcTo(startPos.x, startPos.y + currentObject.height, startPos.x, startPos.y + currentObject.height - radius, radius);
                ctx.lineTo(startPos.x, startPos.y + radius);
                ctx.arcTo(startPos.x, startPos.y, startPos.x + radius, startPos.y, radius);
                ctx.closePath();
                if (filled) {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (currentObject.type === 'circle' && currentObject.radius !== undefined) {
                ctx.beginPath();
                ctx.arc(startPos.x, startPos.y, currentObject.radius, 0, Math.PI * 2);
                if (filled) {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (currentObject.type === 'triangle' && currentObject.points && currentObject.points.length === 3) {
                ctx.beginPath();
                ctx.moveTo(currentObject.points[0].x, currentObject.points[0].y);
                ctx.lineTo(currentObject.points[1].x, currentObject.points[1].y);
                ctx.lineTo(currentObject.points[2].x, currentObject.points[2].y);
                ctx.closePath();
                if (filled) {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (currentObject.type === 'arrow' && currentObject.points && currentObject.points.length === 2) {
                const startPoint = currentObject.points[0];
                const endPoint = currentObject.points[1];
                
                // Calculate the angle of the line
                const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
                
                // Calculate the points for the arrowhead
                const arrowSize = shapeStrokeWidth * 4;
                const arrowPoint1 = {
                    x: endPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
                    y: endPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
                };
                const arrowPoint2 = {
                    x: endPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
                    y: endPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
                };
                
                // Draw the line
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
                
                // Draw the arrowhead
                ctx.beginPath();
                ctx.moveTo(endPoint.x, endPoint.y);
                ctx.lineTo(arrowPoint1.x, arrowPoint1.y);
                ctx.lineTo(arrowPoint2.x, arrowPoint2.y);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
            } else if (currentObject.type === 'line' && currentObject.points && currentObject.points.length === 2) {
                const startPoint = currentObject.points[0];
                const endPoint = currentObject.points[1];
                
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
            } else if (currentObject.type === 'star' && currentObject.x !== undefined && currentObject.y !== undefined && currentObject.radius !== undefined) {
                const outerRadius = currentObject.radius;
                const innerRadius = currentObject.radius / 2;
                const spikes = 5;
                
                ctx.beginPath();
                let rot = Math.PI / 2 * 3;
                const step = Math.PI / spikes;
                
                ctx.moveTo(currentObject.x + outerRadius * Math.cos(rot), currentObject.y + outerRadius * Math.sin(rot));
                
                for (let i = 0; i < spikes; i++) {
                    rot += step;
                    ctx.lineTo(currentObject.x + innerRadius * Math.cos(rot), currentObject.y + innerRadius * Math.sin(rot));
                    rot += step;
                    ctx.lineTo(currentObject.x + outerRadius * Math.cos(rot), currentObject.y + outerRadius * Math.sin(rot));
                }
                
                ctx.closePath();
                if (filled) {
                    ctx.fill();
                }
                ctx.stroke();
            }

            ctx.globalAlpha = 1.0;
        }
    }, [objects, ctx, isDrawing, currentPath, startPos, currentObject, penTool, color, penWidth, shapeStrokeWidth, filled, selectedObject, textMode, opacity, darkMode, grid, gridSize, backgroundImage, canvasColor]);

    const getCanvasMousePosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }, []);

    const saveToHistory = useCallback(() => {
        // Add current state to undo stack
        setUndoStack(prev => [...prev, [...objects]]);
        // Clear redo stack when new action is performed
        setRedoStack([]);
    }, [objects]);

    const handleUndo = useCallback(() => {
        if (undoStack.length === 0) return;
        
        // Get the last state from undo stack
        const lastState = undoStack[undoStack.length - 1];
        
        // Add current state to redo stack
        setRedoStack(prev => [...prev, [...objects]]);
        
        // Set objects to last state
        setObjects(lastState);
        
        // Remove last state from undo stack
        setUndoStack(prev => prev.slice(0, -1));
    }, [undoStack, objects]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        
        // Get the last state from redo stack
        const lastState = redoStack[redoStack.length - 1];
        
        // Add current state to undo stack
        setUndoStack(prev => [...prev, [...objects]]);
        
        // Set objects to last state
        setObjects(lastState);
        
        // Remove last state from redo stack
        setRedoStack(prev => prev.slice(0, -1));
    }, [redoStack, objects]);

    // Layer movement functions (forward/backward)
    const bringForward = useCallback(() => {
        if (!selectedObject) return;
        
        saveToHistory();
        
        setObjects(prev => {
            // Find the selected object and its index
            const index = prev.findIndex(obj => obj.id === selectedObject);
            if (index === -1 || index === prev.length - 1) return prev;
            
            // Get the object one position ahead
            const nextObj = prev[index + 1];
            
            // Swap the zIndices
            const updatedObjects = [...prev];
            const tempZIndex = updatedObjects[index].zIndex;
            updatedObjects[index].zIndex = nextObj.zIndex;
            updatedObjects[index + 1].zIndex = tempZIndex;
            
            return updatedObjects;
        });
    }, [selectedObject, saveToHistory]);const bringToFront = useCallback(() => {
        if (!selectedObject) return;
        
        saveToHistory();
        
        setObjects(prev => {
            // Find the selected object
            const index = prev.findIndex(obj => obj.id === selectedObject);
            if (index === -1) return prev;
            
            // Create a new array with the selected object having the highest zIndex
            const newMaxZIndex = maxZIndex + 1;
            setMaxZIndex(newMaxZIndex);
            
            return prev.map(obj => 
                obj.id === selectedObject 
                    ? { ...obj, zIndex: newMaxZIndex } 
                    : obj
            );
        });
    }, [selectedObject, maxZIndex, saveToHistory]);

    const sendBackward = useCallback(() => {
        if (!selectedObject) return;
        
        saveToHistory();
        
        setObjects(prev => {
            // Find the selected object and its index
            const index = prev.findIndex(obj => obj.id === selectedObject);
            if (index === -1 || index === 0) return prev;
            
            // Get the object one position behind
            const prevObj = prev[index - 1];
            
            // Swap the zIndices
            const updatedObjects = [...prev];
            const tempZIndex = updatedObjects[index].zIndex;
            updatedObjects[index].zIndex = prevObj.zIndex;
            updatedObjects[index - 1].zIndex = tempZIndex;
            
            return updatedObjects;
        });
    }, [selectedObject, saveToHistory]);

    const sendToBack = useCallback(() => {
        if (!selectedObject) return;
        
        saveToHistory();
        
        setObjects(prev => {
            // Find the selected object
            const index = prev.findIndex(obj => obj.id === selectedObject);
            if (index === -1) return prev;
            
            // Find the minimum zIndex
            const minZIndex = Math.min(...prev.map(obj => obj.zIndex)) - 1;
            
            return prev.map(obj => 
                obj.id === selectedObject 
                    ? { ...obj, zIndex: minZIndex } 
                    : obj
            );
        });
    }, [selectedObject, saveToHistory]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasMousePosition(e);
        
        // Check if we're trying to interact with a rotation handle
        if (selectedObject) {
            const selected = objects.find(obj => obj.id === selectedObject);
            if (selected) {
                let rotationHandlePos = { x: 0, y: 0 };
                
                if (selected.type === 'rect' && selected.x !== undefined && selected.y !== undefined && selected.width !== undefined) {
                    rotationHandlePos = { x: selected.x + selected.width + 5, y: selected.y - 5 };
                } else if (selected.type === 'circle' && selected.x !== undefined && selected.y !== undefined && selected.radius !== undefined) {
                    rotationHandlePos = { x: selected.x + selected.radius + 5, y: selected.y - selected.radius - 5 };
                } else if (selected.type === 'path' && selected.points) {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity;
                    selected.points.forEach(point => {
                        minX = Math.min(minX, point.x);
                        minY = Math.min(minY, point.y);
                        maxX = Math.max(maxX, point.x);
                    });
                    rotationHandlePos = { x: maxX + 5, y: minY - 5 };
                } else if (selected.type === 'triangle' && selected.points) {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity;
                    selected.points.forEach(point => {
                        minX = Math.min(minX, point.x);
                        minY = Math.min(minY, point.y);
                        maxX = Math.max(maxX, point.x);
                    });
                    rotationHandlePos = { x: maxX + 5, y: minY - 5 };
                } else if (selected.type === 'text' && selected.x !== undefined && selected.y !== undefined && selected.text) {
                    const metrics = ctx?.measureText(selected.text) || { width: 0 };
                    rotationHandlePos = { x: selected.x + metrics.width + 5, y: selected.y - (selected.fontSize || 20) - 5 };
                }
                
                // Check if we clicked near the rotation handle
                const distance = Math.sqrt(
                    Math.pow(pos.x - rotationHandlePos.x, 2) + Math.pow(pos.y - rotationHandlePos.y, 2)
                );
                if (distance <= 8) {
                    setIsRotating(true);
                    
                    // Calculate the center of the object
                    let centerX = 0, centerY = 0;
                    
                    if (selected.type === 'rect' || selected.type === 'roundedRect') {
                        centerX = selected.x! + selected.width! / 2;
                        centerY = selected.y! + selected.height! / 2;
                    } else if (selected.type === 'circle') {
                        centerX = selected.x!;
                        centerY = selected.y!;
                    } else if (selected.type === 'path' || selected.type === 'triangle') {
                        let totalX = 0, totalY = 0;
                        let count = 0;
                        
                        selected.points!.forEach(point => {
                            totalX += point.x;
                            totalY += point.y;
                            count++;
                        });
                        
                        centerX = totalX / count;
                        centerY = totalY / count;
                    } else if (selected.type === 'text') {
                        const metrics = ctx?.measureText(selected.text!) || { width: 0 };
                        centerX = selected.x! + metrics.width / 2;
                        centerY = selected.y! - (selected.fontSize || 20) / 2;
                    }
                    
                    // Calculate initial angle
                    const startAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
                    setRotationStartAngle(startAngle);
                    
                    return;
                }
            }
        }
        
        setIsDrawing(true);
        
        if (isSelectMode || tool === "select") {
            // Check if clicked on an object for selection or dragging
            let found = false;
            
            // Sort objects by zIndex in reverse order to select objects on top first
            const sortedObjects = [...objects].sort((a, b) => b.zIndex - a.zIndex);
            
            for (const obj of sortedObjects) {
                if (isPointInObject(pos, obj)) {
                    setSelectedObject(obj.id);
                    setDraggingObject({
                        id: obj.id,
                        offsetX: pos.x - (obj.x || 0),
                        offsetY: pos.y - (obj.y || 0)
                    });
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                setSelectedObject(null);
            }
            return;
        }
        
        if (eraseMode) {
            // Check if clicked on an object to erase
            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                if (isPointInObject(pos, obj)) {
                    saveToHistory();
                    setObjects(prev => prev.filter(o => o.id !== obj.id));
                    break;
                }
            }
            return;
        }
        
        if (penTool) {
            saveToHistory();
            setCurrentPath([pos]);
        } else if (textMode || tool === "text") {
            setTextPosition(pos);
            setTextInput("");
        } else {
            saveToHistory();
            setStartPos(pos);
            const newObject: DrawObject = {
                id: generateId(),
                type: tool,
                color: color,
                strokeWidth: shapeStrokeWidth,
                fill: filled ? color : 'transparent',
                x: pos.x,
                y: pos.y,
                opacity: opacity,
                rotation: 0,
                zIndex: maxZIndex + 1 // New objects go on top
            };
            
            // Update max z-index
            setMaxZIndex(maxZIndex + 1);
            
            if (tool === 'rect' || tool === 'roundedRect') {
                newObject.width = 0;
                newObject.height = 0;
            } else if (tool === 'circle' || tool === 'star') {
                newObject.radius = 0;
            } else if (tool === 'triangle') {
                const x1 = pos.x;
                const y1 = pos.y;
                newObject.points = [
                    { x: x1, y: y1 },
                    { x: x1, y: y1 },
                    { x: x1, y: y1 }
                ];
            } else if (tool === 'line' || tool === 'arrow') {
                newObject.points = [
                    { x: pos.x, y: pos.y },
                    { x: pos.x, y: pos.y }
                ];
            }
            
            setCurrentObject(newObject);
        }
    }, [getCanvasMousePosition, objects, isSelectMode, eraseMode, penTool, textMode, tool, color, shapeStrokeWidth, filled, selectedObject, opacity, ctx, saveToHistory, maxZIndex]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasMousePosition(e);
        
        if (!isDrawing && !isRotating) return;
        
        if (isRotating && selectedObject) {
            const selected = objects.find(obj => obj.id === selectedObject);
            if (selected) {
                let centerX = 0, centerY = 0;
                
                if (selected.type === 'rect' || selected.type === 'roundedRect') {
                    centerX = selected.x! + selected.width! / 2;
                    centerY = selected.y! + selected.height! / 2;
                } else if (selected.type === 'circle') {
                    centerX = selected.x!;
                    centerY = selected.y!;
                } else if (selected.type === 'path' || selected.type === 'triangle') {
                    let totalX = 0, totalY = 0;
                    let count = 0;
                    
                    selected.points!.forEach(point => {
                        totalX += point.x;
                        totalY += point.y;
                        count++;
                    });
                    
                    centerX = totalX / count;
                    centerY = totalY / count;
                } else if (selected.type === 'text') {
                    const metrics = ctx?.measureText(selected.text!) || { width: 0 };
                    centerX = selected.x! + metrics.width / 2;
                    centerY = selected.y! - (selected.fontSize || 20) / 2;
                }
                
                // Calculate current angle
                const currentAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
                
                // Calculate rotation difference in degrees
                let rotation = ((currentAngle - rotationStartAngle) * 180 / Math.PI);
                
                // Update object rotation
                setObjects(prev => 
                    prev.map(obj => 
                        obj.id === selectedObject 
                            ? { ...obj, rotation: (obj.rotation || 0) + rotation } 
                            : obj
                    )
                );
                
                // Update rotation start angle for next move
                setRotationStartAngle(currentAngle);
                
                return;
            }
        }
        
        if (draggingObject && (isSelectMode || tool === "select")) {
            // Move object when dragging
            setObjects(prev => {
                return prev.map(obj => {
                    if (obj.id === draggingObject.id) {
                        const newX = pos.x - draggingObject.offsetX;
                        const newY = pos.y - draggingObject.offsetY;
                        
                        if (obj.type === 'path' && obj.points) {
                            // For paths, we need to move all points
                            const offsetX = newX - (obj.x || 0);
                            const offsetY = newY - (obj.y || 0);
                            
                            return {
                                ...obj,
                                x: newX,
                                y: newY,
                                points: obj.points.map(p => ({
                                    x: p.x + offsetX,
                                    y: p.y + offsetY
                                }))
                            };
                        }
                        
                        return {
                            ...obj,
                            x: newX,
                            y: newY
                        };
                    }
                    return obj;
                });
            });
            return;
        }
        
        if (penTool) {
            setCurrentPath(prev => [...prev, pos]);
        } else if (currentObject && startPos) {
            if (tool === 'rect' || tool === 'roundedRect') {
                setCurrentObject({
                    ...currentObject,
                    width: pos.x - startPos.x,
                    height: pos.y - startPos.y
                });
            } else if (tool === 'circle' || tool === 'star') {
                const radius = Math.sqrt(
                    Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
                );
                setCurrentObject({
                    ...currentObject,
                    radius
                });
            } else if (tool === 'triangle') {
                const x1 = startPos.x;
                const y1 = startPos.y;
                const x2 = pos.x;
                const y2 = pos.y;
                const x3 = startPos.x + (pos.x - startPos.x) / 2;
                const y3 = startPos.y - Math.abs(pos.y - startPos.y);
                
                setCurrentObject({
                    ...currentObject,
                    points: [
                        { x: x1, y: y1 },
                        { x: x2, y: y2 },
                        { x: x3, y: y3 }
                    ]
                });
            } else if (tool === 'line' || tool === 'arrow') {
                setCurrentObject({
                    ...currentObject,
                    points: [
                        currentObject.points![0],
                        { x: pos.x, y: pos.y }
                    ]
                });
            }
        }
    }, [getCanvasMousePosition, isDrawing, isRotating, penTool, currentObject, startPos, tool, draggingObject, isSelectMode, selectedObject, objects, rotationStartAngle, ctx]);

    const handleMouseUp = useCallback(() => {
        if (isDrawing) {
            if (penTool && currentPath.length > 1) {
                const newObject: DrawObject = {
                    id: generateId(),
                    type: 'path',
                    color: color,
                    strokeWidth: penWidth,
                    points: currentPath,
                    opacity: opacity,
                    rotation: 0,
                    zIndex: maxZIndex + 1
                };
                setObjects(prev => [...prev, newObject]);
                setMaxZIndex(maxZIndex + 1);
            } else if (currentObject && startPos && !textMode) {
                // Only add shapes if they have size
                let shouldAdd = false;
                
                if ((currentObject.type === 'rect' || currentObject.type === 'roundedRect') && 
                    currentObject.width !== undefined && currentObject.height !== undefined) {
                    shouldAdd = Math.abs(currentObject.width) > 2 && Math.abs(currentObject.height) > 2;
                } else if ((currentObject.type === 'circle' || currentObject.type === 'star') && currentObject.radius !== undefined) {
                    shouldAdd = currentObject.radius > 2;
                } else if (currentObject.type === 'triangle' && currentObject.points) {
                    shouldAdd = true;
                } else if ((currentObject.type === 'line' || currentObject.type === 'arrow') && currentObject.points) {
                    const startPoint = currentObject.points[0];
                    const endPoint = currentObject.points[1];
                    const distance = Math.sqrt(
                        Math.pow(endPoint.x - startPoint.x, 2) + 
                        Math.pow(endPoint.y - startPoint.y, 2)
                    );
                    shouldAdd = distance > 5;
                }
                
                if (shouldAdd) {
                    setObjects(prev => [...prev, currentObject]);
                }
            }
        }
        
        setIsDrawing(false);
        setIsRotating(false);
        setCurrentPath([]);
        setStartPos(null);
        setCurrentObject(null);
        setDraggingObject(null);
    }, [isDrawing, penTool, currentPath, currentObject, startPos, color, penWidth, textMode, opacity, maxZIndex]);

    const isPointInObject = useCallback((point: {x: number, y: number}, obj: DrawObject): boolean => {
        if (obj.type === 'rect' || obj.type === 'roundedRect') {
            if (obj.x === undefined || obj.y === undefined || obj.width === undefined || obj.height === undefined) {
                return false;
            }
            
            const x = obj.width < 0 ? obj.x + obj.width : obj.x;
            const y = obj.height < 0 ? obj.y + obj.height : obj.y;
            const width = Math.abs(obj.width);
            const height = Math.abs(obj.height);
            
            return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
        } else if (obj.type === 'circle') {
            if (obj.x === undefined || obj.y === undefined || obj.radius === undefined) {
                return false;
            }
            
            const distance = Math.sqrt(
                Math.pow(point.x - obj.x, 2) + Math.pow(point.y - obj.y, 2)
            );
            
            return distance <= obj.radius;
        } else if (obj.type === 'triangle' && obj.points && obj.points.length === 3) {
            // Check if point is inside triangle
            const p1 = obj.points[0];
            const p2 = obj.points[1];
            const p3 = obj.points[2];
            
            // Calculate area of triangle
            const areaOrig = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y));
            
            // Calculate area of 3 triangles formed between the point and each corner
            const area1 = Math.abs((p1.x - point.x) * (p2.y - point.y) - (p2.x - point.x) * (p1.y - point.y));
            const area2 = Math.abs((p2.x - point.x) * (p3.y - point.y) - (p3.x - point.x) * (p2.y - point.y));
            const area3 = Math.abs((p3.x - point.x) * (p1.y - point.y) - (p1.x - point.x) * (p3.y - point.y));
            
            // If sum of 3 areas equals the original, point is inside triangle
            return Math.abs(area1 + area2 + area3 - areaOrig) < 0.1;
        } else if (obj.type === 'path' && obj.points) {
            // Check if point is near any point in the path
            for (let i = 0; i < obj.points.length; i++) {
                const distance = Math.sqrt(
                    Math.pow(point.x - obj.points[i].x, 2) + Math.pow(point.y - obj.points[i].y, 2)
                );
                
                if (distance <= obj.strokeWidth * 2) {
                    return true;
                }
            }
        } else if (obj.type === 'text') {
            if (obj.x === undefined || obj.y === undefined || obj.text === undefined) {
                return false;
            }
            
            const fontSize = obj.fontSize || 20;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (context) {
                context.font = `${fontSize}px Arial`;
                const textWidth = context.measureText(obj.text).width;
                
                return point.x >= obj.x && point.x <= obj.x + textWidth && 
                       point.y >= obj.y - fontSize && point.y <= obj.y;
            }
        } else if ((obj.type === 'line' || obj.type === 'arrow') && obj.points && obj.points.length === 2) {
            const p1 = obj.points[0];
            const p2 = obj.points[1];
            
            // Calculate distance from point to line
            const lineLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            if (lineLength === 0) return false;
            
            const dot = ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) / Math.pow(lineLength, 2);
            
            if (dot < 0 || dot > 1) {
                // Check distance to endpoints
                const distToP1 = Math.sqrt(Math.pow(point.x - p1.x, 2) + Math.pow(point.y - p1.y, 2));
                const distToP2 = Math.sqrt(Math.pow(point.x - p2.x, 2) + Math.pow(point.y - p2.y, 2));
                return Math.min(distToP1, distToP2) <= obj.strokeWidth * 2;
            }
            
            const closestX = p1.x + dot * (p2.x - p1.x);
            const closestY = p1.y + dot * (p2.y - p1.y);
            const distance = Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2));
            
            return distance <= obj.strokeWidth * 2;
        } else if (obj.type === 'star' && obj.x !== undefined && obj.y !== undefined && obj.radius !== undefined) {
            // Simplified check - just check if point is within bounding circle
            const distance = Math.sqrt(
                Math.pow(point.x - obj.x, 2) + Math.pow(point.y - obj.y, 2)
            );
            
            return distance <= obj.radius;
        }
        
        return false;
    }, []);
    const handleTextInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTextInput(e.target.value);
    }, []);

    const handleTextEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && textInput && textPosition) {
            saveToHistory();
            
            const newText: DrawObject = {
                id: generateId(),
                type: 'text',
                text: textInput,
                x: textPosition.x,
                y: textPosition.y,
                fontSize: fontSize,
                color: color,
                strokeWidth: 1,
                opacity: opacity,
                rotation: 0,
                zIndex: maxZIndex + 1
            };
            
            setObjects(prev => [...prev, newText]);
            setTextPosition(null);
            setTextInput("");
            setMaxZIndex(maxZIndex + 1);
        }
    }, [textInput, textPosition, color, fontSize, opacity, saveToHistory, maxZIndex]);

    const generateRandomString = useCallback(() => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 20; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }, []);

    const saveImage = useCallback(() => {
        if (canvasRef.current) {
            // Create a temporary canvas to draw with white background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasRef.current.width;
            tempCanvas.height = canvasRef.current.height;
            
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.fillStyle = 'white';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvasRef.current, 0, 0);
                
                const dataURL = tempCanvas.toDataURL('image/jpeg');
                
                // Create and trigger download link
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = `whiteboard-${generateRandomString()}.jpg`;
                link.click();
            }
        }
    }, [generateRandomString]);

    const convertImageToBase64 = useCallback(() => {
        if (canvasRef.current) {
            // Create a temporary canvas to draw with white background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasRef.current.width;
            tempCanvas.height = canvasRef.current.height;
            
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.fillStyle = 'white';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvasRef.current, 0, 0);
                
                return tempCanvas.toDataURL('image/jpeg');
            }
        }
        return null;
    }, []);

    const submitGenerate = useCallback(() => {
        const base64Image = convertImageToBase64();
        if (base64Image) {
            setDrawImage(base64Image);
            handleWhiteBoardClose();
        }
    }, [convertImageToBase64, setDrawImage, handleWhiteBoardClose]);

    const handlePenTool = useCallback(() => {
        setTool("pen");
        setPenTool(true);
        setIsSelectMode(false);
        setTextMode(false);
        setEraseMode(false);
        setTextPosition(null);
        setTextInput("");
        setSelectedObject(null);
    }, []);

    const handleFill = useCallback(() => {
        setFilled(prev => !prev);
        setPenTool(false);
        setTextMode(false);
        setEraseMode(false);
        setTextPosition(null);
        setTextInput("");
    }, []);

    const handleSelectMode = useCallback(() => {
        setTool("select");
        setIsSelectMode(true);
        setPenTool(false);
        setTextMode(false);
        setEraseMode(false);
        setTextPosition(null);
        setTextInput("");
    }, []);

    const handleTextMode = useCallback(() => {
        setTool("text");
        setTextMode(true);
        setPenTool(false);
        setIsSelectMode(false);
        setEraseMode(false);
        setSelectedObject(null);
    }, []);

    const handleEraseMode = useCallback(() => {
        setTool("erase");
        setEraseMode(true);
        setPenTool(false);
        setIsSelectMode(false);
        setTextMode(false);
        setTextPosition(null);
        setTextInput("");
        setSelectedObject(null);
    }, []);

    const handleToolChange = useCallback((toolValue: string) => {
        setTool(toolValue);
        setPenTool(false);
        setIsSelectMode(toolValue === "select");
        setTextMode(toolValue === "text");
        setEraseMode(false);
        setSelectedObject(null);
    }, []);

    const toggleMenu = useCallback(() => {
        setShowMenu(prev => !prev);
    }, []);

    const handleAddBackgroundImage = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imgSrc = e.target?.result as string;
                    setBackgroundImage(imgSrc);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }, []);

    const handleDuplicateSelected = useCallback(() => {
        if (selectedObject) {
            const selected = objects.find(obj => obj.id === selectedObject);
            if (selected) {
                saveToHistory();
                
                const duplicate: DrawObject = {
                    ...selected,
                    id: generateId(),
                    zIndex: maxZIndex + 1
                };
                
                // Offset the duplicate slightly
                if (duplicate.x !== undefined) duplicate.x += 20;
                if (duplicate.y !== undefined) duplicate.y += 20;
                
                if (duplicate.points) {
                    duplicate.points = duplicate.points.map(p => ({
                        x: p.x + 20,
                        y: p.y + 20
                    }));
                }
                
                setObjects(prev => [...prev, duplicate]);
                setSelectedObject(duplicate.id);
                setMaxZIndex(maxZIndex + 1);
            }
        }
    }, [selectedObject,objects, saveToHistory, maxZIndex]);

    const handleDeleteSelected = useCallback(() => {
        if (selectedObject) {
            saveToHistory();
            setObjects(prev => prev.filter(obj => obj.id !== selectedObject));
            setSelectedObject(null);
        }
    }, [selectedObject, saveToHistory]);

    const handleClearAll = useCallback(() => {
        if (objects.length > 0) {
            saveToHistory();
            setObjects([]);
            setSelectedObject(null);
            setMaxZIndex(0);
        }
    }, [objects.length, saveToHistory]);
    
    const changeSelectedObjectColor = useCallback((newColor: string) => {
        if (!selectedObject) return;
        
        saveToHistory();
        
        setObjects(prev => 
            prev.map(obj => 
                obj.id === selectedObject 
                    ? { 
                        ...obj, 
                        color: newColor,
                        fill: obj.fill !== 'transparent' ? newColor : 'transparent'
                    } 
                    : obj
            )
        );
    }, [selectedObject, saveToHistory]);

    return (
        <div className={`h-screen flex justify-center items-center bg-gray-900 relative`}>
            {/* Close button */}
            <button
    onClick={handleWhiteBoardClose}
    className="absolute top-5 right-5 cursor-pointer text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors bg-transparent"
>
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
</button>

            {/* Left Sidebar - Shape Selector */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col gap-2">
                <button
                    onClick={handleSelectMode}
                    className={`w-10 h-10 rounded-lg flex justify-center items-center ${tool === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors`}
                    title="Select"
                    type="button"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                </button>

                <button
                    onClick={handlePenTool}
                    className={`w-10 h-10 rounded-lg flex justify-center items-center ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors`}
                    title="Pen"
                    type="button"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>

                <div className="h-px w-full bg-gray-300 dark:bg-gray-600 my-1"></div>
                
                {/* Shape tools */}
                {shapeOptions.map(shape => (
                    <button
                        key={shape.value}
                        onClick={() => handleToolChange(shape.value)}
                        className={`w-10 h-10 rounded-lg flex justify-center items-center text-lg font-bold ${tool === shape.value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors`}
                        title={shape.name}
                        type="button"
                    >
                        {shape.icon}
                    </button>
                ))}
                
                <div className="h-px w-full bg-gray-300 dark:bg-gray-600 my-1"></div>
                
                <button
                    onClick={handleEraseMode}
                    className={`w-10 h-10 rounded-lg flex justify-center items-center ${eraseMode ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors`}
                    title="Erase"
                    type="button"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
                
                <button
                    onClick={handleFill}
                    className={`w-10 h-10 rounded-lg flex justify-center items-center ${filled ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors`}
                    title="Fill"
                    type="button"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                </button>
                
                <div className="relative">
                    <button
                        onClick={() => setShowColorPalette(!showColorPalette)}
                        className="w-10 h-10 rounded-lg flex justify-center items-center overflow-hidden"
                        title="Choose Color"
                        style={{ backgroundColor: color }}
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                    </button>
                    
                    {showColorPalette && (
                        <div className="absolute left-12 top-0 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg grid grid-cols-5 gap-1 z-10">
                            {DEFAULT_COLORS.map((colorOption) => (
                                <button
                                    key={colorOption}
                                    className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                                    style={{ backgroundColor: colorOption }}
                                    onClick={() => {
                                        setColor(colorOption);
                                        setShowColorPalette(false);
                                    }}
                                />
                            ))}
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="col-span-5 mt-1 w-full h-8 cursor-pointer rounded"
                            />
                        </div>
                    )}
                </div>
                
                <div className="relative">
    <button
        onClick={(e) => {
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = canvasColor;
            colorInput.addEventListener('input', (event) => {
                setCanvasColor((event.target as HTMLInputElement).value);
            });
            colorInput.click();
        }}
        className="w-10 h-10 rounded-lg flex justify-center items-center overflow-hidden border-2 border-black dark:border-white"
        title="Canvas Color"
        style={{ backgroundColor: canvasColor }}
    >
        <svg className="w-6 h-6 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    </button>
    
    {showCanvasColorPicker && (
        <div 
            className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-50 w-64"
            style={{ 
                transform: 'translateX(-50%)',
                left: '50%'
            }}
        >
            <input
                type="color"
                value={canvasColor}
                onChange={(e) => {
                    const newColor = e.target.value;
                    setCanvasColor(newColor);
                }}
                autoFocus
                className="w-full h-16 cursor-pointer rounded"
            />
            <div className="flex items-center mt-2">
                <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">Hex:</span>
                <input
                    type="text"
                    value={canvasColor}
                    onChange={(e) => setCanvasColor(e.target.value)}
                    className="flex-grow px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter hex color"
                />
            </div>
        </div>
    )}
</div>
            </div>
            {/* ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} */}

            <div 
    ref={canvasContainerRef} 
    className={`relative w-[85vw] h-[85vh] ${
        darkMode 
            ? 'bg-gray-900 text-white' 
            : 'bg-gray-100 text-black'
    }`}
>
                {/* Main Canvas */}
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="border border-gray-600 rounded-lg cursor-crosshair shadow-2xl "
                    style={{
                        cursor: penTool
                            ? 'crosshair'
                            : (isSelectMode || tool === "select")
                                ? 'move'
                                : textMode || tool === "text"
                                    ? 'text'
                                    : eraseMode
                                        ? `url('${Erase}'), auto`
                                        : 'crosshair',
                    }}
                />

                {/* Tools Panel at bottom */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex justify-center py-2 px-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <button
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        className={`w-10 h-10 rounded-lg mx-1 flex justify-center items-center ${undoStack.length > 0 ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'} transition-colors`}
                        title="Undo"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <button
                        onClick={handleRedo}
                        disabled={redoStack.length === 0}
                        className={`w-10 h-10 rounded-lg mx-1 flex justify-center items-center ${redoStack.length > 0 ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'} transition-colors`}
                        title="Redo"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                    
                    <div className="h-10 mx-2 w-px bg-gray-300 dark:bg-gray-600"></div>
                    
                    <button
                        onClick={saveImage}
                        className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Save Image"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    
                    <button
                        onClick={handleAddBackgroundImage}
                        className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Add Background Image"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                    
                    <button
                        onClick={() => setGrid(!grid)}
                        className={`w-10 h-10 rounded-lg mx-1 flex justify-center items-center ${grid ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors`}
                        title={grid ? "Hide Grid" : "Show Grid"}
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    
                    {/* <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title={darkMode ? "Light Mode" : "Dark Mode"}
                        type="button"
                    >
                        {darkMode ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )} */}
                    {/* </button> */}
                    <div className="relative">
                        <button
                            onClick={toggleMenu}
                            className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="Menu"
                            type="button"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                        </button>

                        {showMenu && (
                            <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[200px] z-10">
                                <button
                                    onClick={saveImage}
                                    className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                >
                                    <img src={Download} className="w-5 h-5 mr-2" alt="download" />
                                    <span className="text-sm">Save Image</span>
                                </button>
                                <button
                                    onClick={submitGenerate}
                                    className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                >
                                    <img src={Star} className="w-5 h-5 mr-2" alt="generate" />
                                    <span className="text-sm">Generate</span>
                                </button>
                                {/* <button
                                    onClick={handleAddBackgroundImage}
                                    className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm">Add Background Image</span>
                                </button>
                                {backgroundImage && (
                                    <button
                                        onClick={() => setBackgroundImage(null)}
                                        className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        type="button"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span className="text-sm">Remove Background</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setGrid(!grid)}
                                    className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span className="text-sm">{grid ? 'Hide Grid' : 'Show Grid'}</span>
                                </button>*/}
                                {/* <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                    <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                </button>  */}
                                <button
                                    onClick={handleClearAll}
                                    className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600"
                                    type="button"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="text-sm">Clear All</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={handleClearAll}
                        className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="Clear All"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Selected object controls */}
                {selectedObject && (
    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <button
            onClick={bringToFront}
            className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Bring to Front"
            type="button"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        </button>
        
        <button
            onClick={bringForward}
            className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Bring Forward"
            type="button"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
            </svg>
        </button>
        
        <button
            onClick={sendBackward}
            className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Send Backward"
            type="button"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
            </svg>
        </button>
        
        <button
            onClick={sendToBack}
            className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Send to Back"
            type="button"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        
        <div className="h-10 mx-2 w-px bg-gray-300 dark:bg-gray-600"></div>
        
        <button
            onClick={handleDuplicateSelected}
            className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Duplicate"
            type="button"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
        </button>
        
        <div className="h-10 mx-2 w-px bg-gray-300 dark:bg-gray-600"></div>
        
        <div className="flex items-center mx-1">
            <span className="mr-2 text-black dark:text-white text-sm">Color:</span>
            <div className="flex items-center gap-2">
                <div className="grid grid-cols-6 gap-1">
                    {DEFAULT_COLORS.map((colorOption) => (
                        <button
                            key={colorOption}
                            className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: colorOption }}
                            onClick={() => changeSelectedObjectColor(colorOption)}
                        />
                    ))}
                    <button
                        onClick={(e) => {
                            const colorInput = document.createElement('input');
                            colorInput.type = 'color';
                            colorInput.value = selectedObject?.color || color;
                            colorInput.addEventListener('input', (event) => {
                                const newColor = (event.target as HTMLInputElement).value;
                                changeSelectedObjectColor(newColor);
                            });
                            colorInput.click();
                        }}
                        className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs"
                        title="Custom Color"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
        
        <div className="h-10 mx-2 w-px bg-gray-300 dark:bg-gray-600"></div>
        
        {/* Conditional Font Size for Text */}
        {selectedObject.type === 'text' && (
            <>
                <div className="flex flex-col mx-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">Font Size</label>
                    <input
                        type="range"
                        min="10"
                        max="72"
                        value={selectedObject.fontSize || 20}
                        onChange={(e) => {
                            const newFontSize = parseInt(e.target.value);
                            setObjects(prev => 
                                prev.map(obj => 
                                    obj.id === selectedObject.id 
                                        ? { ...obj, fontSize: newFontSize } 
                                        : obj
                                )
                            );
                        }}
                        className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="h-10 mx-2 w-px bg-gray-300 dark:bg-gray-600"></div>
            </>
        )}
        
        <div className="flex flex-col mx-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Opacity</label>
            <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => {
                    const newOpacity = parseInt(e.target.value);
                    setOpacity(newOpacity);
                    
                    if (selectedObject) {
                        setObjects(prev => 
                            prev.map(obj => 
                                obj.id === selectedObject 
                                    ? { ...obj, opacity: newOpacity } 
                                    : obj
                            )
                        );
                    }
                }}
                className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        
        <div className="h-10 mx-2 w-px bg-gray-300 dark:bg-gray-600"></div>
        
        <button
            onClick={handleDeleteSelected}
            className="w-10 h-10 rounded-lg mx-1 flex justify-center items-center bg-red-500 text-white hover:bg-red-600 transition-colors"
            title="Delete"
            type="button"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    </div>
)}
    
                    {/* Property controls - Stroke Width and Font Size */}
                    <div className="absolute top-4 right-16 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
                        <div className="mb-3">
                            <label className="text-black dark:text-white text-sm font-medium mb-1 block">Pen Width: {penWidth}</label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={penWidth}
                                onChange={(e) => setPenWidth(parseInt(e.target.value))}
                                className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="text-black dark:text-white text-sm font-medium mb-1 block">Shape Width: {shapeStrokeWidth}</label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={shapeStrokeWidth}
                                onChange={(e) => setShapeStrokeWidth(parseInt(e.target.value))}
                                className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        {(textMode || tool === "text") && (
                            <div>
                                <label className="text-black dark:text-white text-sm font-medium mb-1 block">Font Size: {fontSize}</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="72"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
    
                    {/* Grid size control when grid is enabled */}
                    {grid && (
                        <div className="absolute top-4 right-72 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
                            <div>
                                <label className="text-black dark:text-white text-sm font-medium mb-1 block">Grid Size: {gridSize}px</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    value={gridSize}
                                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                                    className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                    
                </div>
    
                {/* Text Input */}
                {textPosition && (
                    <div 
                        className="absolute z-50"
                        style={{
                            left: `${textPosition.x}px`,
                            top: `${textPosition.y}px`,
                        }}
                    >
                        <input
                            type="text"
                            value={textInput}
                            onChange={handleTextInputChange}
                            onKeyDown={handleTextEnter}
                            className="p-2 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none rounded shadow-md"
                            placeholder="Type text and press Enter"
                            style={{ fontSize: `${fontSize}px` }}
                            autoFocus
                        />
                    </div>
                )}
            </div>
        );
    };
    
    export default WhiteBoard;