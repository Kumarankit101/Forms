import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import FormQuestionRenderer from '@/components/FormQuestionRenderer';
import SuccessMessage from '@/components/SuccessMessage';
import { FormWithQuestions } from '@shared/schema';

const FormPreview = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/form/:id');
  const formId = parseInt(params.id);
  
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  
  const { toast } = useToast();

  // Fetch form data
  const { data: form, isLoading, isError } = useQuery<FormWithQuestions>({
    queryKey: [`/api/forms/${formId}`],
  });

  // Submit form response mutation
  const { mutate: submitResponse, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      // Validate required fields
      const newErrors: Record<number, string> = {};
      let hasErrors = false;
      
      if (form) {
        form.questions.forEach(question => {
          if (question.required && (!answers[question.id] || answers[question.id].trim() === '')) {
            newErrors[question.id] = 'This field is required';
            hasErrors = true;
          }
        });
      }
      
      if (hasErrors) {
        setErrors(newErrors);
        throw new Error('Please fix the errors in the form');
      }
      
      // Submit the form
      const response = await apiRequest('POST', `/api/forms/${formId}/responses`, {
        answers: answers
      });
      
      return response;
    },
    onSuccess: () => {
      setIsSubmitSuccess(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error submitting form',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleBack = () => {
    setLocation('/');
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error if field is filled
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitResponse();
  };

  const handleSuccessClose = () => {
    setIsSubmitSuccess(false);
    setAnswers({});
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <p>Loading form...</p>
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-destructive mb-4">Error loading form. It may have been deleted or doesn't exist.</p>
        <Button onClick={handleBack}>Back to Forms</Button>
      </div>
    );
  }

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
        <h2 className="text-2xl font-medium font-heading text-gray-800">{form.title}</h2>
      </div>

      <Card>
        <CardHeader className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-medium mb-2">{form.title}</h3>
          {form.description && <p className="text-gray-600">{form.description}</p>}
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {form.questions.map(question => (
              <FormQuestionRenderer
                key={question.id}
                question={question}
                value={answers[question.id] || ''}
                onChange={(value) => handleAnswerChange(question.id, value)}
                error={errors[question.id]}
              />
            ))}
          </CardContent>

          <CardFooter className="pt-4 p-6 border-t border-gray-200">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <SuccessMessage
        isOpen={isSubmitSuccess}
        onClose={handleSuccessClose}
        title="Form Submitted!"
        description="Thank you for your response. It has been recorded successfully."
      />
    </div>
  );
};

export default FormPreview;
