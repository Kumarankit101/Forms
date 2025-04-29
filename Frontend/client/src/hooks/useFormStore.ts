import { useState } from 'react';

export type QuestionType = 'text' | 'dropdown';

export interface FormQuestion {
  id?: number;
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[];
}

interface UseFormStoreReturn {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  questions: FormQuestion[];
  addQuestion: () => void;
  updateQuestion: (index: number, question: Partial<FormQuestion>) => void;
  removeQuestion: (index: number) => void;
  addOption: (questionIndex: number) => void;
  updateOption: (questionIndex: number, optionIndex: number, text: string) => void;
  removeOption: (questionIndex: number, optionIndex: number) => void;
  resetForm: () => void;
  setInitialFormData: (title: string, description: string, questions: FormQuestion[]) => void;
}

// Default empty question template
const createEmptyQuestion = (): FormQuestion => ({
  text: '',
  type: 'text',
  required: false,
  options: [],
});

export const useFormStore = (): UseFormStoreReturn => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [questions, setQuestions] = useState<FormQuestion[]>([createEmptyQuestion()]);

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const updateQuestion = (index: number, question: Partial<FormQuestion>) => {
    console.log(`Updating question at index ${index}:`, question);
    
    // Create a completely new array to force re-render
    const newQuestions = questions.map((q, i) => 
      i === index ? { ...q, ...question } : { ...q }
    );
    
    // If type changed from dropdown to something else, clear options
    if (question.type && question.type !== 'dropdown' && questions[index].type === 'dropdown') {
      newQuestions[index].options = [];
      console.log("Cleared options because type changed from dropdown");
    }
    
    // If type changed to dropdown and no options exist, add one empty option
    if (question.type === 'dropdown' && newQuestions[index].options.length === 0) {
      newQuestions[index].options = [''];
      console.log("Added empty option for dropdown question");
    }
    
    console.log("Updated questions:", newQuestions);
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    console.log(`Removing question at index ${index}`);
    const newQuestions = questions.filter((_, i) => i !== index);
    console.log("Questions after removal:", newQuestions);
    
    // If no questions left, add an empty one
    if (newQuestions.length === 0) {
      newQuestions.push(createEmptyQuestion());
    }
    
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    console.log(`Adding option to question at index ${questionIndex}`);
    const newQuestions = questions.map((q, i) => {
      if (i === questionIndex) {
        return {
          ...q,
          options: [...q.options, '']
        };
      }
      return {...q};
    });
    console.log("Updated questions with new option:", newQuestions);
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    console.log(`Updating option at index ${optionIndex} for question at index ${questionIndex} to: "${text}"`);
    const newQuestions = questions.map((q, i) => {
      if (i === questionIndex) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = text;
        return {
          ...q,
          options: newOptions
        };
      }
      return {...q};
    });
    console.log("Updated questions with option change:", newQuestions);
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    console.log(`Removing option at index ${optionIndex} from question at index ${questionIndex}`);
    const newQuestions = questions.map((q, i) => {
      if (i === questionIndex) {
        const newOptions = [...q.options];
        newOptions.splice(optionIndex, 1);
        return {
          ...q,
          options: newOptions
        };
      }
      return {...q};
    });
    console.log("Updated questions after option removal:", newQuestions);
    setQuestions(newQuestions);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setQuestions([createEmptyQuestion()]);
  };

  const setInitialFormData = (title: string, description: string, questions: FormQuestion[]) => {
    console.log("Setting initial form data:", {title, description, questions});
    setTitle(title);
    setDescription(description || '');
    
    // Make sure we create a new array to trigger re-renders properly
    const newQuestions = questions.length > 0 
      ? [...questions.map(q => ({...q}))] 
      : [createEmptyQuestion()];
    
    console.log("Setting questions:", newQuestions);
    setQuestions(newQuestions);
    console.log("Form data initialized successfully");
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    questions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    addOption,
    updateOption,
    removeOption,
    resetForm,
    setInitialFormData,
  };
};
