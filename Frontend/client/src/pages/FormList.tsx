import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {  useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { 
  PlusIcon, 
  EyeIcon, 
  ShareIcon, 
  FileTextIcon, 
  BarChart2Icon,
  Trash2Icon
} from 'lucide-react';
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
import ShareFormModal from '@/components/ShareFormModal';
import { FormWithQuestions } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const FormList = () => {
  const [, setLocation] = useLocation();
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: forms, isLoading, isError, refetch } = useQuery<FormWithQuestions[]>({
    queryKey: ['/api/forms'],
    refetchInterval: 2000, 
    refetchOnWindowFocus: true,
  });
  
  // Delete form 
  const { mutate: deleteForm, isPending: isDeleting } = useMutation({
    mutationFn: async (formId: number) => {
      const response = await apiRequest('DELETE', `/api/forms/${formId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Form deleted',
        description: 'The form has been deleted successfully',
        variant: 'default',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Error deleting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the form. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleCreateForm = () => {
    setLocation('/create');
  };

  const handleShare = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFormId(id);
    setIsShareModalOpen(true);
  };

  // const handleEdit = (id: number, e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   console.log(`Navigating to edit form with ID: ${id}`);
    
  //   localStorage.removeItem('formEditData');
    
  //   // Navigate to edit page
  //   setLocation(`/edit/${id}`);
  // };

  const handleViewForm = (id: number) => {
    setLocation(`/form/${id}`);
  };
  
  const handleViewResponses = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/form/${id}/responses`);
  };
  
  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (formToDelete) {
      deleteForm(formToDelete);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium font-heading text-gray-800">Your Forms</h2>
        <Button 
          className="sm:hidden inline-flex" 
          size="sm"
          onClick={handleCreateForm}
        >
          <PlusIcon className="mr-1 h-4 w-4" /> Create Form
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-medium text-gray-700">Forms List</h3>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map(i => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="px-6 py-4 text-center text-destructive">
              Failed to load forms. Please try again.
            </div>
          ) : forms && forms.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {forms.map(form => (
                <div 
                  key={form.id} 
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
                  onClick={() => handleViewForm(form.id)}
                >
                  <div className="flex items-start space-x-3">
                    <FileTextIcon className="text-primary text-xl mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-800">{form.title}</h4>
                      <p className="text-sm text-gray-500">
                        Created {formatDate(form.createdAt)} • {form.responseCount || 0} {form.responseCount === 1 ? 'response' : 'responses'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-600 hover:text-primary hover:bg-primary/10 rounded-full"
                      title="View Form"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewForm(form.id);
                      }}
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Button>
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-600 hover:text-primary hover:bg-primary/10 rounded-full"
                      title="Edit Form"
                      onClick={(e) => handleEdit(form.id, e)}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Button> */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-600 hover:text-primary hover:bg-primary/10 rounded-full"
                      title="Share Form"
                      onClick={(e) => handleShare(form.id, e)}
                    >
                      <ShareIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-600 hover:text-primary hover:bg-primary/10 rounded-full"
                      title="View Responses"
                      onClick={(e) => handleViewResponses(form.id, e)}
                    >
                      <BarChart2Icon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-600 hover:text-destructive hover:bg-destructive/10 rounded-full"
                      title="Delete Form"
                      onClick={(e) => handleDeleteClick(form.id, e)}
                    >
                      <Trash2Icon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-primary/10 mb-3">
                <FileTextIcon className="text-3xl text-primary h-8 w-8" />
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">No forms yet</h4>
              <p className="text-gray-500 mb-4">Create your first form to get started</p>
              <Button onClick={handleCreateForm}>
                <PlusIcon className="mr-1 h-4 w-4" /> Create Form
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fixed Action Button (mobile only) */}
      <div className="sm:hidden fixed right-6 bottom-6">
        <Button 
          size="icon" 
          className="w-14 h-14 rounded-full shadow-lg"
          onClick={handleCreateForm}
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>

      {selectedFormId && (
        <ShareFormModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          formId={selectedFormId}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form? This action cannot be undone and all responses will be permanently deleted.
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

export default FormList;
