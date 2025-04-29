import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, X } from 'lucide-react';
import { FormQuestion, QuestionType } from '@/hooks/useFormStore';

interface QuestionItemProps {
  question: FormQuestion;
  index: number;
  onUpdate: (index: number, question: Partial<FormQuestion>) => void;
  onRemove: (index: number) => void;
  onAddOption: (questionIndex: number) => void;
  onUpdateOption: (questionIndex: number, optionIndex: number, text: string) => void;
  onRemoveOption: (questionIndex: number, optionIndex: number) => void;
}

const QuestionItem = ({
  question,
  index,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: QuestionItemProps) => {
  const questionTypes = [
    { value: 'text', label: 'Text' },
    { value: 'dropdown', label: 'Dropdown' },
  ];

  const handleQuestionTypeChange = (type: QuestionType) => {
    onUpdate(index, { type });
  };

  return (
    <div className="question-item bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between mb-3">
        <div className="w-full">
          <Input
            className="question-title w-full"
            value={question.text}
            onChange={(e) => onUpdate(index, { text: e.target.value })}
            placeholder="Question text"
          />
        </div>
        <div className="flex ml-3">
          <Select 
            value={question.type} 
            onValueChange={(value) => handleQuestionTypeChange(value as QuestionType)}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 text-gray-500 hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {question.type === 'dropdown' && (
        <div className="dropdown-options mb-3 pl-3 border-l-2 border-primary/50">
          <div className="text-sm font-medium text-gray-700 mb-2">Options</div>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center">
                <Input
                  className="option-text"
                  value={option}
                  onChange={(e) => onUpdateOption(index, optionIndex, e.target.value)}
                  placeholder="Option text"
                  size={30}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-gray-500 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveOption(index, optionIndex)}
                  disabled={question.options.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10"
              onClick={() => onAddOption(index)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Option
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end">
        <div className="flex items-center">
          <Checkbox
            id={`required-${index}`}
            checked={question.required}
            onCheckedChange={(checked) => 
              onUpdate(index, { required: checked === true })
            }
            className="required-toggle"
          />
          <Label htmlFor={`required-${index}`} className="ml-2 text-sm text-gray-700">
            Required
          </Label>
        </div>
      </div>
    </div>
  );
};

export default QuestionItem;
