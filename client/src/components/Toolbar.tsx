import { DrawingTool } from '../types/whiteboard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Edit3, Trash2 } from 'lucide-react';

interface ToolbarProps {
  tool: DrawingTool;
  onToolChange: (tool: Partial<DrawingTool>) => void;
  onClearCanvas: () => void;
}

const COLORS = [
  { name: 'Black', value: '#000000', class: 'bg-black' },
  { name: 'Red', value: '#EF4444', class: 'bg-red-500' },
  { name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', class: 'bg-green-500' },
];

export default function Toolbar({ tool, onToolChange, onClearCanvas }: ToolbarProps) {
  const handleColorSelect = (color: string) => {
    onToolChange({ color });
  };

  const handleStrokeWidthChange = (value: number[]) => {
    onToolChange({ strokeWidth: value[0] });
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas?')) {
      onClearCanvas();
    }
  };

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <div className="flex flex-col space-y-3">
        
        {/* Drawing Tool */}
        <div className="flex items-center justify-center">
          <Button
            size="sm"
            className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center"
          >
            <Edit3 className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Color Palette */}
        <div className="grid grid-cols-2 gap-1">
          {COLORS.map((color) => (
            <button
              key={color.value}
              className={`w-8 h-8 ${color.class} rounded border-2 transition-all ${
                tool.color === color.value 
                  ? 'border-gray-900 ring-2 ring-gray-300' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => handleColorSelect(color.value)}
              title={color.name}
            />
          ))}
        </div>
        
        {/* Stroke Width */}
        <div className="px-1">
          <label className="text-xs text-gray-600 block mb-1">Size</label>
          <Slider
            value={[tool.strokeWidth]}
            onValueChange={handleStrokeWidthChange}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
        </div>
        
        {/* Clear Canvas */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCanvas}
          className="w-full py-2 px-3 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 text-sm font-medium"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
        
      </div>
    </div>
  );
}
