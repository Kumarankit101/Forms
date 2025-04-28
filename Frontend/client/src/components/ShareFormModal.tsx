import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: number;
}

const ShareFormModal = ({ isOpen, onClose, formId }: ShareFormModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Generate the form URL
  const formUrl = `${window.location.origin}/form/${formId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const handleEmailShare = () => {
    const subject = "Form Invitation";
    const body = `Please fill out this form: ${formUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    toast({
      title: "Email client opened",
      description: "Your default email client should open with the form link.",
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Share Form</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-share-link">Form Link</Label>
            <div className="flex">
              <Input
                id="form-share-link"
                value={formUrl}
                readOnly
                className="rounded-r-none"
              />
              <Button
                variant="secondary"
                className="rounded-l-none px-3"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <Button variant="outline" className="mr-2" onClick={onClose}>
                <X className="h-4 w-4 mr-2" /> Close
              </Button>
              <Button onClick={handleEmailShare}>
                <Mail className="h-4 w-4 mr-2" /> Share via Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFormModal;
