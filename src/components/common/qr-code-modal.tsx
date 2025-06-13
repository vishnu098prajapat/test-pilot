
"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, QrCode } from 'lucide-react'; // Added QrCode for consistency if needed

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export default function QrCodeModal({ isOpen, onClose, url, title = "Share Test via QR Code" }: QrCodeModalProps) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    if(navigator.clipboard && url) {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "The test link has been copied to your clipboard.",
        duration: 2000,
      });
    } else {
      toast({
        title: "Copy Failed",
        description: "Could not copy link. Please try again or copy manually.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  if (!isOpen || !url) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center gap-2">
            <QrCode className="h-6 w-6" /> {title}
          </DialogTitle>
          <DialogDescription>
            Students can scan this QR code to access the test directly.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 md:p-6 gap-6">
          <div className="p-2 sm:p-4 bg-white rounded-lg shadow-md inline-block">
            <QRCodeSVG value={url} size={220} level="H" includeMargin={true} />
          </div>
          <div className="w-full space-y-2">
            <p className="text-sm text-muted-foreground text-center">Or share this link:</p>
            <div className="flex w-full items-center space-x-2">
              <Input type="text" value={url} readOnly className="flex-1 text-xs sm:text-sm" />
              <Button type="button" size="icon" variant="outline" onClick={handleCopyLink} title="Copy link">
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-center pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
