import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";

interface SuccessMessageProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

const SuccessMessage = ({ isOpen, onClose, title, description }: SuccessMessageProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckIcon className="text-3xl text-green-500 h-8 w-8" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2 font-heading">
            {title}
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {description}
          </p>
          <div className="flex justify-center">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessMessage;
