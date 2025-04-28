import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Trash2Icon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import { FormWithQuestions, Response } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FormResponses = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/form/:id/responses');
  const [responseToDelete, setResponseToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  if (!match || !params) {
    // Handle invalid route params
    setLocation('/');
    return null;
  }
  
  const formId = parseInt(params.id);

  // Fetch form data
  const { data: form, isLoading: isLoadingForm } = useQuery<FormWithQuestions>({
    queryKey: [`/api/forms/${formId}`],
  });

  // Fetch form responses
  const { data: responses, isLoading: isLoadingResponses, refetch: refetchResponses } = useQuery<Response[]>({
    queryKey: [`/api/forms/${formId}/responses`],
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchOnWindowFocus: true,
  });
  
  // Delete response mutation
  const { mutate: deleteResponse, isPending: isDeleting } = useMutation({
    mutationFn: async (responseId: number) => {
      const response = await apiRequest('DELETE', `/api/responses/${responseId}`);
      return response;
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: 'Response deleted',
        description: 'The response has been deleted successfully',
        variant: 'default',
      });
      
      // Refresh responses list
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/responses`] });
      
      // Close delete dialog
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Error deleting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the response. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Auto-refetch responses on mount
  useEffect(() => {
    console.log("Fetching form responses for formId:", formId);
    refetchResponses();
  }, [formId, refetchResponses]);
  
  const handleDeleteClick = (responseId: number) => {
    setResponseToDelete(responseId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (responseToDelete) {
      deleteResponse(responseToDelete);
    }
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleViewForm = () => {
    setLocation(`/form/${formId}`);
  };

  if (isLoadingForm || isLoadingResponses) {
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
          <Skeleton className="h-8 w-64" />
        </div>

        <Card>
          <CardHeader className="border-b border-gray-200 p-6">
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-5 w-full max-w-md" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="border border-gray-200 rounded-lg p-5">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="space-y-3 mt-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-destructive mb-4">Error loading form. It may have been deleted or doesn't exist.</p>
        <Button onClick={handleBack}>Back to Forms</Button>
      </div>
    );
  }

  // Parse the answers from each response
  const parsedResponses = responses?.map(response => {
    try {
      console.log("Raw response answers:", response.answers);
      // Handle different possible formats of answers
      let parsedAnswers;
      if (typeof response.answers === 'string') {
        parsedAnswers = JSON.parse(response.answers);
      } else if (typeof response.answers === 'object') {
        parsedAnswers = response.answers;
      } else {
        parsedAnswers = {};
      }
      
      console.log("Parsed answers:", parsedAnswers);
      return {
        ...response,
        parsedAnswers
      };
    } catch (e) {
      console.error("Error parsing response answers:", e);
      return {
        ...response,
        parsedAnswers: {}
      };
    }
  }) || [];

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
          Responses: {form.title}
        </h2>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200 px-6 py-4 flex flex-row justify-between items-center">
          <div>
            <h3 className="text-xl font-medium mb-1">{form.title}</h3>
            <p className="text-sm text-gray-600">
              {parsedResponses.length} {parsedResponses.length === 1 ? 'response' : 'responses'} received
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleViewForm}
          >
            View Form
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {parsedResponses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No responses yet</p>
              <Button onClick={handleViewForm}>View Form</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {parsedResponses.map((response, index) => (
                <div key={response.id} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-800">Response #{index + 1}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        Submitted on {formatDate(response.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-destructive hover:bg-destructive/10 rounded-full"
                        title="Delete Response"
                        onClick={() => handleDeleteClick(response.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {form.questions.map(question => (
                      <div key={question.id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="font-medium text-gray-700">{question.text}</div>
                        <div className="md:col-span-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                          {response.parsedAnswers[question.id] || 
                            <span className="text-gray-400 italic">No answer</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Response</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this response? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormResponses;