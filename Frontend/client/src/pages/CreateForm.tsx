import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import QuestionItem from '@/components/QuestionItem';
import SuccessMessage from '@/components/SuccessMessage';
import { useFormStore } from '@/hooks/useFormStore';
import { FormWithQuestions } from '@shared/schema';

const CreateForm = () => {
  const [, setLocation] = useLocation();
  const [, createParams] = useRoute('/create');
  const [editMatch, editParams] = useRoute('/edit/:id');
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  let formId: number | null = null;
  
  if (editMatch && editParams && editParams.id) {
    console.log("Form ID from route params:", editParams.id);
    formId = parseInt(editParams.id);
  } else {
    const searchParams = new URLSearchParams(window.location.search);
    const formIdStr = searchParams.get('id');
    console.log("Form ID from URL query:", formIdStr);
    formId = formIdStr ? parseInt(formIdStr) : null;
  }
  
  console.log("Final parsed form ID:", formId);

  const {
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
  } = useFormStore();

  const { data: formData, isLoading } = useQuery<FormWithQuestions>({
    queryKey: [`/api/forms/${formId}`],
    enabled: !!formId,
  });

  useEffect(() => {
    console.log("Form data from API:", formData);
    
    if (formData) {
      console.log("Loading form data into editor:", formData);
      
      try {
        const formQuestions = formData.questions
          .sort((a, b) => a.order - b.order) // Make sure questions are in order
          .map(q => {
            console.log(`Processing question ID ${q.id}: "${q.text}" (${q.type})`);
            const questionData = {
              id: q.id,
              text: q.text,
              type: q.type as any,
              required: q.required,
              options: q.options
                .sort((a, b) => a.order - b.order) // Make sure options are in order
                .map(o => {
                  console.log(`  - Option: "${o.text}"`);
                  return o.text;
                }),
            };
            console.log("Created question data:", questionData);
            return questionData;
          });
        
        console.log("Processed questions:", formQuestions);
        console.log("Form title:", formData.title);
        console.log("Form description:", formData.description || '');
        
        resetForm();
        
        setTimeout(() => {
          setInitialFormData(formData.title, formData.description || '', formQuestions);
          console.log("Form data successfully loaded into editor");
        }, 50);
        
      } catch (error) {
        console.error("Error loading form data:", error);
        toast({
          title: 'Error',
          description: 'Failed to load form data for editing',
          variant: 'destructive',
        });
      }
    }
  }, [formData, setInitialFormData, resetForm, toast]);

  const { mutate: saveForm, isPending } = useMutation({
    mutationFn: async () => {
      console.log("Saving form with id:", formId);
      
      if (!title.trim()) {
        throw new Error('Form title is required');
      }

      if (questions.length === 0) {
        throw new Error('At least one question is required');
      }

      const invalidQuestionIndex = questions.findIndex(
        q => q.type === 'dropdown' && (!q.options || q.options.length === 0)
      );

      if (invalidQuestionIndex !== -1) {
        throw new Error(`Question ${invalidQuestionIndex + 1} needs at least one option`);
      }

      const formData = {
        form: {
          title: title.trim(),
          description: description.trim(),
        },
        questions: questions.map(q => ({
          id: q.id, 
          text: q.text.trim(),
          type: q.type,
          required: q.required,
          options: q.type === 'dropdown' ? q.options.filter(o => o.trim() !== '') : undefined,
        })),
      };

      console.log("Form data:", formData);

      const url = formId ? `/api/forms/${formId}` : '/api/forms';
      const method = formId ? 'PUT' : 'POST';
      
      console.log(`Sending ${method} request to ${url}`);
      const response = await apiRequest(method, url, formData);
      const result = await response.json();
      console.log("Response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Form saved successfully:", data);
      
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      
      if (formId) {
        queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}`] });
      }
      
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
        resetForm();
        setLocation('/');
      }, 1500);
    },
    onError: (error: Error) => {
      console.error("Error saving form:", error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleBack = () => {
    setLocation('/');
  };

  const handleSaveForm = () => {
    saveForm();
  };

  const handleSuccessClose = () => {
    setIsSuccess(false);
    resetForm();
    setLocation('/');
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-3 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-medium font-heading text-gray-800">
          {formId ? 'Edit Form' : 'Create New Form'}
        </h2>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="form-title" className="block text-sm font-medium text-gray-700 mb-1">
                Form Title
              </Label>
              <Input
                id="form-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter form title"
              />
            </div>
            <div>
              <Label htmlFor="form-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </Label>
              <Textarea
                id="form-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for your form"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 border-b border-gray-200">
          <h3 className="font-medium text-gray-700 mb-4">Questions</h3>
          
          <div className="form-questions space-y-4">
            {questions.map((question, index) => (
              <QuestionItem
                key={index}
                question={question}
                index={index}
                onUpdate={updateQuestion}
                onRemove={removeQuestion}
                onAddOption={addOption}
                onUpdateOption={updateOption}
                onRemoveOption={removeOption}
              />
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="mt-4 text-primary border-primary"
            onClick={addQuestion}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </CardContent>

        <CardFooter className="p-6 flex justify-end">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={handleBack}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveForm}
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save Form'}
          </Button>
        </CardFooter>
      </Card>

      <SuccessMessage
        isOpen={isSuccess}
        onClose={handleSuccessClose}
        title={formId ? 'Form Updated!' : 'Form Created!'}
        description={formId 
          ? 'Your form has been updated successfully.' 
          : 'Your form has been created successfully.'
        }
      />
    </div>
  );
};

export default CreateForm;
