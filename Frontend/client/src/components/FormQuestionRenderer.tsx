import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { QuestionWithOptions } from '@shared/schema';

interface FormQuestionRendererProps {
  question: QuestionWithOptions;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const FormQuestionRenderer = ({
  question,
  value,
  onChange,
  error,
}: FormQuestionRendererProps) => {
  const renderQuestionInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={question.required}
            className={error ? 'border-destructive' : ''}
          />
        );
      case 'dropdown':
        return (
          <Select 
            value={value} 
            onValueChange={onChange}
            required={question.required}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option) => (
                <SelectItem key={option.id} value={option.text}>
                  {option.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
    
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={question.required}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <div className="mb-6">
      <Label className="block text-sm font-medium text-gray-700 mb-1">
        {question.text} {question.required && <span className="text-destructive">*</span>}
      </Label>
      {renderQuestionInput()}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};

export default FormQuestionRenderer;
